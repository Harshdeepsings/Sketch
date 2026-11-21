import { Router, Response } from "express";
import crypto from "crypto";
import { Types } from "mongoose";
import { CanvasModel, UserModel, InvitationModel, ICanvasElement } from "../db";
import { UserMiddleware, AuthRequest } from "../Middleware";

const CanvasRoutes = Router();

// Helper: Determine user's role on a drawing
export async function getDrawingPermission(
  drawingId: string,
  userId: string
): Promise<{ drawing: any; role: "owner" | "editor" | "viewer" | null }> {
  if (!Types.ObjectId.isValid(drawingId)) {
    return { drawing: null, role: null };
  }

  const drawing = await CanvasModel.findById(drawingId)
    .populate("owner", "username email name")
    .populate("collaborators.user", "username email name");

  if (!drawing) {
    return { drawing: null, role: null };
  }

  const ownerId = (drawing.owner as any)._id
    ? (drawing.owner as any)._id.toString()
    : drawing.owner.toString();

  if (ownerId === userId) {
    return { drawing, role: "owner" };
  }

  const collaborator = drawing.collaborators.find((c: any) => {
    const cId = c.user?._id ? c.user._id.toString() : c.user?.toString();
    return cId === userId;
  });

  if (collaborator) {
    return { drawing, role: collaborator.role };
  }

  if (drawing.isPublic) {
    return { drawing, role: "viewer" };
  }

  return { drawing, role: null };
}

// GET / - List all drawings accessible by user (owned + shared)
CanvasRoutes.get("/", UserMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const userObjectId = new Types.ObjectId(userId);

    const rawDrawings = await CanvasModel.aggregate([
      {
        $match: {
          $or: [{ owner: userObjectId }, { "collaborators.user": userObjectId }],
        },
      },
      {
        $sort: { updatedAt: -1 },
      },
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "ownerDoc",
        },
      },
      {
        $unwind: { path: "$ownerDoc", preserveNullAndEmptyArrays: true },
      },
      {
        $project: {
          title: 1,
          isPublic: 1,
          revision: 1,
          updatedAt: 1,
          createdAt: 1,
          owner: 1,
          collaborators: 1,
          ownerInfo: {
            _id: "$ownerDoc._id",
            username: "$ownerDoc.username",
            email: "$ownerDoc.email",
            name: "$ownerDoc.name",
          },
          elementsCount: { $size: { $ifNull: ["$elements", []] } },
        },
      },
    ]);

    const formatted = rawDrawings.map((d: any) => {
      const isOwner = d.owner?.toString() === userId;
      let role: "owner" | "editor" | "viewer" = "viewer";

      if (isOwner) {
        role = "owner";
      } else {
        const collab = (d.collaborators || []).find(
          (c: any) => (c.user?._id ? c.user._id.toString() : c.user?.toString()) === userId
        );
        role = collab?.role || "viewer";
      }

      return {
        id: d._id.toString(),
        title: d.title,
        owner: d.ownerInfo || d.owner,
        elementsCount: d.elementsCount || 0,
        collaboratorsCount: (d.collaborators || []).length,
        isPublic: d.isPublic,
        role,
        updatedAt: d.updatedAt,
        createdAt: d.createdAt,
      };
    });

    return res.status(200).json({
      drawings: formatted,
    });
  } catch (e: any) {
    console.error("Fetch drawings error:", e);
    return res.status(500).json({ message: "Failed to fetch drawings" });
  }
});

// Handler: Create a new drawing
const handleCreateDrawing = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const title = (req.body.title || "Untitled Drawing").trim();

    const drawing = await CanvasModel.create({
      title,
      owner: new Types.ObjectId(userId),
      elements: [],
      collaborators: [],
      isPublic: false,
      revision: 1,
    });

    return res.status(201).json({
      message: "Drawing created successfully",
      drawing: {
        id: drawing._id.toString(),
        title: drawing.title,
        owner: drawing.owner,
        elements: drawing.elements,
        collaborators: drawing.collaborators,
        role: "owner",
        revision: drawing.revision,
        createdAt: drawing.createdAt,
        updatedAt: drawing.updatedAt,
      },
    });
  } catch (e: any) {
    console.error("Create drawing error:", e);
    return res.status(500).json({ message: "Failed to create drawing" });
  }
};

// POST / and POST /create - Create a new drawing
CanvasRoutes.post("/", UserMiddleware, handleCreateDrawing);
CanvasRoutes.post("/create", UserMiddleware, handleCreateDrawing);

// GET /:id - Fetch single drawing
CanvasRoutes.get("/:id", UserMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const userId = req.userId;
    if (!id || !userId) {
      return res.status(400).json({ message: "Invalid drawing ID or user session" });
    }

    const { drawing, role } = await getDrawingPermission(id, userId);

    if (!drawing) {
      return res.status(404).json({ message: "Drawing not found" });
    }

    if (!role) {
      return res.status(403).json({
        message: "You do not have permission to view this drawing",
        accessDenied: true,
      });
    }

    return res.status(200).json({
      drawing: {
        id: drawing._id.toString(),
        title: drawing.title,
        owner: drawing.owner,
        elements: drawing.elements,
        collaborators: drawing.collaborators,
        isPublic: drawing.isPublic,
        role,
        revision: drawing.revision,
        createdAt: drawing.createdAt,
        updatedAt: drawing.updatedAt,
      },
    });
  } catch (e: any) {
    console.error("Get drawing error:", e);
    return res.status(500).json({ message: "Failed to retrieve drawing" });
  }
});

// PUT /:id - Update drawing (elements, title, autosave)
CanvasRoutes.put("/:id", UserMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const userId = req.userId;
    if (!id || !userId) {
      return res.status(400).json({ message: "Invalid parameters" });
    }

    const { elements, title, expectedRevision } = req.body;

    const { drawing, role } = await getDrawingPermission(id, userId);

    if (!drawing) {
      return res.status(404).json({ message: "Drawing not found" });
    }

    if (role !== "owner" && role !== "editor") {
      return res.status(403).json({ message: "Editor permission required to modify drawing" });
    }

    // Concurrency check if expectedRevision is provided
    if (expectedRevision !== undefined && drawing.revision > expectedRevision + 5) {
      return res.status(409).json({
        message: "Drawing has been updated by another collaborator",
        currentRevision: drawing.revision,
        elements: drawing.elements,
      });
    }

    if (title !== undefined) {
      drawing.title = title.trim() || drawing.title;
    }

    if (Array.isArray(elements)) {
      const sanitizedElements: ICanvasElement[] = elements.map((el: any) => ({
        id: String(el.id || crypto.randomUUID()),
        type: el.type,
        x: Number(el.x) || 0,
        y: Number(el.y) || 0,
        width: el.width !== undefined ? Number(el.width) : undefined,
        height: el.height !== undefined ? Number(el.height) : undefined,
        radiusX: el.radiusX !== undefined ? Number(el.radiusX) : undefined,
        radiusY: el.radiusY !== undefined ? Number(el.radiusY) : undefined,
        points: Array.isArray(el.points) ? el.points.map(Number) : undefined,
        stroke: el.stroke ?? "#E2E8F0",
        strokeWidth: el.strokeWidth !== undefined ? Number(el.strokeWidth) : 2,
        strokeStyle: ["solid", "dashed", "dotted"].includes(el.strokeStyle) ? el.strokeStyle : "solid",
        fill: el.fill ?? "transparent",
        opacity: el.opacity !== undefined ? Number(el.opacity) : 1,
        rotation: el.rotation !== undefined ? Number(el.rotation) : 0,
        text: el.text !== undefined ? String(el.text) : undefined,
        fontSize: el.fontSize !== undefined ? Number(el.fontSize) : 18,
        fontFamily: el.fontFamily ?? "sans-serif",
        align: el.align ?? "left",
        zIndex: el.zIndex !== undefined ? Number(el.zIndex) : 0,
        groupId: el.groupId ? String(el.groupId) : undefined,
        isLocked: el.isLocked === true,
      }));

      drawing.elements = sanitizedElements;
    }

    drawing.revision = (drawing.revision || 1) + 1;
    await drawing.save();

    return res.status(200).json({
      message: "Drawing saved successfully",
      revision: drawing.revision,
      updatedAt: drawing.updatedAt,
    });
  } catch (e: any) {
    console.error("Save drawing error:", e);
    return res.status(500).json({ message: "Failed to update drawing" });
  }
});

// POST /:id/duplicate - Duplicate drawing
CanvasRoutes.post("/:id/duplicate", UserMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const userId = req.userId;
    if (!id || !userId) {
      return res.status(400).json({ message: "Invalid parameters" });
    }

    const { drawing, role } = await getDrawingPermission(id, userId);

    if (!drawing || !role) {
      return res.status(404).json({ message: "Drawing not found or accessible" });
    }

    const cloned = await CanvasModel.create({
      title: `${drawing.title} (Copy)`,
      owner: new Types.ObjectId(userId),
      elements: JSON.parse(JSON.stringify(drawing.elements)),
      collaborators: [],
      isPublic: false,
      revision: 1,
    });

    return res.status(201).json({
      message: "Drawing duplicated successfully",
      drawing: {
        id: cloned._id.toString(),
        title: cloned.title,
        owner: cloned.owner,
        elementsCount: cloned.elements.length,
        createdAt: cloned.createdAt,
      },
    });
  } catch (e: any) {
    return res.status(500).json({ message: "Failed to duplicate drawing" });
  }
});

// DELETE /:id - Delete drawing (owner only)
CanvasRoutes.delete("/:id", UserMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const userId = req.userId;
    if (!id || !userId) {
      return res.status(400).json({ message: "Invalid parameters" });
    }

    const { drawing, role } = await getDrawingPermission(id, userId);

    if (!drawing) {
      return res.status(404).json({ message: "Drawing not found" });
    }

    if (role !== "owner") {
      return res.status(403).json({ message: "Only the owner can delete this drawing" });
    }

    await CanvasModel.findByIdAndDelete(id);
    await (InvitationModel as any).deleteMany({ drawingId: new Types.ObjectId(id) });

    return res.status(200).json({ message: "Drawing deleted successfully" });
  } catch (e: any) {
    return res.status(500).json({ message: "Failed to delete drawing" });
  }
});

// POST /:id/invite - Invite collaborator by email
CanvasRoutes.post("/:id/invite", UserMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const userId = req.userId;
    if (!id || !userId) {
      return res.status(400).json({ message: "Invalid parameters" });
    }

    const { email, role = "editor" } = req.body;

    if (!email || typeof email !== "string") {
      return res.status(400).json({ message: "Valid invitee email required" });
    }

    const targetEmail = email.trim().toLowerCase();

    const { drawing, role: userRole } = await getDrawingPermission(id, userId);

    if (!drawing) {
      return res.status(404).json({ message: "Drawing not found" });
    }

    if (userRole !== "owner" && userRole !== "editor") {
      return res.status(403).json({ message: "Permission required to invite collaborators" });
    }

    // Check if target is already the owner
    const owner = await UserModel.findById(drawing.owner._id || drawing.owner);
    if (owner && owner.email.toLowerCase() === targetEmail) {
      return res.status(400).json({ message: "User is already the owner of this drawing" });
    }

    // Check if user is registered
    const registeredUser = await UserModel.findOne({ email: targetEmail });

    if (registeredUser) {
      // Check if already a collaborator
      const existingCollab = drawing.collaborators.find((c: any) => {
        const cId = c.user?._id ? c.user._id.toString() : c.user?.toString();
        return cId === registeredUser._id.toString();
      });

      if (existingCollab) {
        existingCollab.role = role === "viewer" ? "viewer" : "editor";
        await drawing.save();
        return res.status(200).json({
          message: `Collaborator updated to ${role}`,
          collaborator: {
            user: {
              id: registeredUser._id.toString(),
              username: registeredUser.username,
              email: registeredUser.email,
              name: registeredUser.name,
            },
            role,
          },
        });
      }

      // Add directly as collaborator
      drawing.collaborators.push({
        user: registeredUser._id,
        role: role === "viewer" ? "viewer" : "editor",
        addedAt: new Date(),
      });

      await drawing.save();

      return res.status(200).json({
        message: `${registeredUser.username} added as collaborator`,
        collaborator: {
          user: {
            id: registeredUser._id.toString(),
            username: registeredUser.username,
            email: registeredUser.email,
            name: registeredUser.name,
          },
          role,
        },
      });
    }

    // User is not yet registered: create an invitation token
    const token = crypto.randomBytes(24).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await (InvitationModel as any).findOneAndUpdate(
      { drawingId: drawing._id, inviteeEmail: targetEmail, status: "pending" },
      {
        drawingId: drawing._id,
        inviterId: new Types.ObjectId(userId),
        inviteeEmail: targetEmail,
        role: role === "viewer" ? "viewer" : "editor",
        status: "pending",
        token,
        expiresAt,
      },
      { upsert: true, new: true }
    );

    return res.status(200).json({
      message: `Invitation generated for ${targetEmail}`,
      invitationToken: token,
      inviteUrl: `/invite/${token}`,
    });
  } catch (e: any) {
    console.error("Invite error:", e);
    return res.status(500).json({ message: "Failed to send invitation" });
  }
});

// GET /:id/collaborators - List collaborators
CanvasRoutes.get("/:id/collaborators", UserMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const userId = req.userId;
    if (!id || !userId) {
      return res.status(400).json({ message: "Invalid parameters" });
    }

    const { drawing, role } = await getDrawingPermission(id, userId);

    if (!drawing || !role) {
      return res.status(404).json({ message: "Drawing not found" });
    }

    const populated: any = await CanvasModel.findById(id)
      .populate("owner", "username email name")
      .populate("collaborators.user", "username email name");

    const pendingInvites: any = await (InvitationModel as any).find({
      drawingId: new Types.ObjectId(id),
      status: "pending",
      expiresAt: { $gt: new Date() },
    });

    return res.status(200).json({
      owner: populated?.owner,
      collaborators: populated?.collaborators,
      pendingInvitations: (pendingInvites || []).map((inv: any) => ({
        id: inv._id.toString(),
        email: inv.inviteeEmail,
        role: inv.role,
        token: inv.token,
        expiresAt: inv.expiresAt,
      })),
      isPublic: drawing.isPublic,
    });
  } catch (e: any) {
    return res.status(500).json({ message: "Failed to fetch collaborators" });
  }
});

// DELETE /:id/collaborators/:targetUserId - Remove collaborator
CanvasRoutes.delete("/:id/collaborators/:targetUserId", UserMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const targetUserId = Array.isArray(req.params.targetUserId) ? req.params.targetUserId[0] : req.params.targetUserId;
    const userId = req.userId;
    if (!id || !targetUserId || !userId) {
      return res.status(400).json({ message: "Invalid parameters" });
    }

    const { drawing, role } = await getDrawingPermission(id, userId);

    if (!drawing) {
      return res.status(404).json({ message: "Drawing not found" });
    }

    if (role !== "owner" && userId !== targetUserId) {
      return res.status(403).json({ message: "Permission denied" });
    }

    drawing.collaborators = drawing.collaborators.filter((c: any) => {
      const cId = c.user?._id ? c.user._id.toString() : c.user?.toString();
      return cId !== targetUserId;
    });

    await drawing.save();

    return res.status(200).json({ message: "Collaborator removed successfully" });
  } catch (e: any) {
    return res.status(500).json({ message: "Failed to remove collaborator" });
  }
});

// POST /invite/accept/:token - Accept an invitation
CanvasRoutes.post("/invite/accept/:token", UserMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const token = Array.isArray(req.params.token) ? req.params.token[0] : req.params.token;
    const userId = req.userId;
    if (!token || !userId) {
      return res.status(400).json({ message: "Invalid invitation token or session" });
    }

    const invitation: any = await (InvitationModel as any).findOne({
      token,
      status: "pending",
      expiresAt: { $gt: new Date() },
    });

    if (!invitation) {
      return res.status(404).json({ message: "Invitation is invalid or has expired" });
    }

    const drawing = await CanvasModel.findById(invitation.drawingId);
    if (!drawing) {
      return res.status(404).json({ message: "Drawing no longer exists" });
    }

    const alreadyCollab = drawing.collaborators.some((c: any) => {
      const cId = c.user?._id ? c.user._id.toString() : c.user?.toString();
      return cId === userId;
    });

    if (!alreadyCollab) {
      drawing.collaborators.push({
        user: new Types.ObjectId(userId),
        role: invitation.role,
        addedAt: new Date(),
      });
      await drawing.save();
    }

    invitation.status = "accepted";
    await invitation.save();

    return res.status(200).json({
      message: "Invitation accepted",
      drawingId: drawing._id.toString(),
    });
  } catch (e: any) {
    return res.status(500).json({ message: "Failed to accept invitation" });
  }
});

// POST /:id/toggle-public - Toggle public access
CanvasRoutes.post("/:id/toggle-public", UserMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const userId = req.userId;
    if (!id || !userId) {
      return res.status(400).json({ message: "Invalid parameters" });
    }

    const { drawing, role } = await getDrawingPermission(id, userId);

    if (!drawing || role !== "owner") {
      return res.status(403).json({ message: "Only the owner can toggle public status" });
    }

    drawing.isPublic = !drawing.isPublic;
    await drawing.save();

    return res.status(200).json({
      message: `Drawing is now ${drawing.isPublic ? "public" : "private"}`,
      isPublic: drawing.isPublic,
    });
  } catch (e: any) {
    return res.status(500).json({ message: "Failed to toggle public status" });
  }
});

export default CanvasRoutes;
