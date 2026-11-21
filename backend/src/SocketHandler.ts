import http from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { UserModel, CanvasModel } from "./db";
import { getDrawingPermission } from "./Routes/CanvasRoutes";
import { getJwtSecret } from "./Middleware";

interface SocketUser {
  userId: string;
  username: string;
  name: string;
  color: string;
  role: "owner" | "editor" | "viewer";
}

const COLLABORATOR_COLORS = [
  "#A855F7",
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EC4899",
  "#06B6D4",
  "#8B5CF6",
  "#EF4444",
];

function getRandomColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % COLLABORATOR_COLORS.length;
  return COLLABORATOR_COLORS[index] ?? "#A855F7";
}

export function setupSocketIO(server: http.Server): Server {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 30000,
    pingInterval: 10000,
  });

  const roomParticipants = new Map<string, Map<string, any>>();
  const saveDebounceTimers = new Map<string, NodeJS.Timeout>();
  const roomElementsBuffer = new Map<string, any[]>();

  // Debounced auto-save mechanism
  function scheduleAutoSave(drawingId: string) {
    if (saveDebounceTimers.has(drawingId)) {
      clearTimeout(saveDebounceTimers.get(drawingId)!);
    }

    const timer = setTimeout(() => {
      flushAutoSave(drawingId);
    }, 2000);

    saveDebounceTimers.set(drawingId, timer);
  }

  async function flushAutoSave(drawingId: string) {
    try {
      const elements = roomElementsBuffer.get(drawingId);
      if (!elements) return;

      await CanvasModel.findByIdAndUpdate(drawingId, {
        elements,
        $inc: { revision: 1 },
        updatedAt: new Date(),
      });

      io.to(drawingId).emit("drawing-saved", {
        drawingId,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error("AutoSave persistence error:", err);
    }
  }

  // Socket authentication middleware
  io.use(async (socket: Socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, "") ||
        socket.handshake.query?.token;

      if (!token) {
        return next(new Error("Authentication token required"));
      }

      const secret = getJwtSecret();
      const decoded = jwt.verify(token as string, secret) as { id: string };

      if (!decoded || !decoded.id) {
        return next(new Error("Invalid token"));
      }

      const user = await UserModel.findById(decoded.id).select("-password");
      if (!user) {
        return next(new Error("User not found"));
      }

      socket.data.user = user;
      socket.data.userId = user._id.toString();
      next();
    } catch (err: any) {
      return next(new Error("Unauthorized socket connection"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const user = socket.data.user;
    const userId = socket.data.userId;

    // Handle joining a drawing room
    socket.on("join-drawing", async ({ drawingId }: { drawingId: string }) => {
      try {
        if (!drawingId) return;

        const { drawing, role } = await getDrawingPermission(drawingId, userId);

        if (!drawing || !role) {
          socket.emit("error-message", { message: "Access denied to drawing" });
          return;
        }

        socket.join(drawingId);
        socket.data.drawingId = drawingId;
        socket.data.role = role;

        const userInfo: SocketUser = {
          userId,
          username: user.username,
          name: user.name || user.username,
          color: getRandomColor(userId),
          role,
        };
        socket.data.userInfo = userInfo;

        if (!roomParticipants.has(drawingId)) {
          roomParticipants.set(drawingId, new Map());
        }
        roomParticipants.get(drawingId)!.set(socket.id, {
          ...userInfo,
          cursor: null,
        });

        if (!roomElementsBuffer.has(drawingId)) {
          roomElementsBuffer.set(drawingId, drawing.elements || []);
        }

        socket.emit("room-joined", {
          drawingId,
          role,
          elements: roomElementsBuffer.get(drawingId),
          revision: drawing.revision,
          participants: Array.from(roomParticipants.get(drawingId)!.values()),
        });

        socket.to(drawingId).emit("participant-joined", {
          ...userInfo,
          cursor: null,
        });

        console.log(`User ${user.username} joined drawing ${drawingId} as ${role}`);
      } catch (err) {
        console.error("Error joining drawing:", err);
        socket.emit("error-message", { message: "Failed to join drawing session" });
      }
    });

    // Cursor movement broadcast
    socket.on("cursor-move", ({ x, y }: { x: number; y: number }) => {
      const drawingId = socket.data.drawingId;
      if (!drawingId) return;

      const participants = roomParticipants.get(drawingId);
      if (participants && participants.has(socket.id)) {
        participants.get(socket.id).cursor = { x, y };
      }

      socket.to(drawingId).emit("cursor-update", {
        userId,
        x,
        y,
        username: user.username,
        color: socket.data.userInfo?.color,
      });
    });

    // Element created / added
    socket.on("element-create", (element: any) => {
      const drawingId = socket.data.drawingId;
      const role = socket.data.role;

      if (!drawingId || (role !== "owner" && role !== "editor")) return;
      if (!element || !element.id) return;

      let elements = roomElementsBuffer.get(drawingId) || [];
      elements = [...elements, element];
      roomElementsBuffer.set(drawingId, elements);

      socket.to(drawingId).emit("element-created", element);
      scheduleAutoSave(drawingId);
    });

    // Element updated
    socket.on("element-update", (element: any) => {
      const drawingId = socket.data.drawingId;
      const role = socket.data.role;

      if (!drawingId || (role !== "owner" && role !== "editor")) return;
      if (!element || !element.id) return;

      let elements = roomElementsBuffer.get(drawingId) || [];
      const index = elements.findIndex((el) => el.id === element.id);

      if (index !== -1) {
        elements[index] = { ...elements[index], ...element };
      } else {
        elements.push(element);
      }
      roomElementsBuffer.set(drawingId, elements);

      socket.to(drawingId).emit("element-updated", element);
      scheduleAutoSave(drawingId);
    });

    // Batch elements update
    socket.on("elements-batch-update", (updatedElements: any[]) => {
      const drawingId = socket.data.drawingId;
      const role = socket.data.role;

      if (!drawingId || (role !== "owner" && role !== "editor")) return;
      if (!Array.isArray(updatedElements)) return;

      let elements = roomElementsBuffer.get(drawingId) || [];
      const updateMap = new Map(updatedElements.map((el) => [el.id, el]));

      elements = elements.map((el) => {
        if (updateMap.has(el.id)) {
          return { ...el, ...updateMap.get(el.id) };
        }
        return el;
      });

      roomElementsBuffer.set(drawingId, elements);
      socket.to(drawingId).emit("elements-batch-updated", updatedElements);
      scheduleAutoSave(drawingId);
    });

    // Element deleted
    socket.on("element-delete", ({ id }: { id: string }) => {
      const drawingId = socket.data.drawingId;
      const role = socket.data.role;

      if (!drawingId || (role !== "owner" && role !== "editor")) return;

      let elements = roomElementsBuffer.get(drawingId) || [];
      elements = elements.filter((el) => el.id !== id);
      roomElementsBuffer.set(drawingId, elements);

      socket.to(drawingId).emit("element-deleted", { id });
      scheduleAutoSave(drawingId);
    });

    // Full canvas reset / clear
    socket.on("canvas-clear", () => {
      const drawingId = socket.data.drawingId;
      const role = socket.data.role;

      if (!drawingId || (role !== "owner" && role !== "editor")) return;

      roomElementsBuffer.set(drawingId, []);
      socket.to(drawingId).emit("canvas-cleared");
      scheduleAutoSave(drawingId);
    });

    // Disconnect cleanup
    socket.on("disconnect", () => {
      const drawingId = socket.data.drawingId;
      if (drawingId && roomParticipants.has(drawingId)) {
        const participants = roomParticipants.get(drawingId)!;
        participants.delete(socket.id);

        socket.to(drawingId).emit("participant-left", { userId });

        if (participants.size === 0) {
          flushAutoSave(drawingId);
        }
      }
    });
  });

  return io;
}
