import http from "http";
import { Server, Socket } from "socket.io";
import { UserModel, CanvasModel } from "./db";
import { getDrawingPermission } from "./Routes/CanvasRoutes";

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

export function setupSocketIO(server: http.Server, sessionMiddleware: any): Server {
  const io = new Server(server, {
    cors: {
      origin: [process.env.CLIENT_URL || "http://localhost:8080", "http://127.0.0.1:8080"],
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 30000,
    pingInterval: 10000,
  });

  // Share session middleware with Socket.IO engine
  io.engine.use(sessionMiddleware);

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

  // Socket session authentication middleware
  io.use(async (socket: Socket, next) => {
    try {
      const req = socket.request as any;
      const userId = req.session?.passport?.user;

      if (!userId) {
        return next(new Error("Authentication required"));
      }

      const user = await UserModel.findById(userId).select("-password").lean();
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

        if (!roomParticipants.has(drawingId)) {
          roomParticipants.set(drawingId, new Map());
        }
        roomParticipants.get(drawingId)!.set(socket.id, userInfo);

        const activeUsers = Array.from(roomParticipants.get(drawingId)!.values());
        io.to(drawingId).emit("collaborators-update", { users: activeUsers });

        socket.emit("room-joined", {
          drawingId,
          role,
          revision: drawing.revision,
          activeUsers,
        });
      } catch (err) {
        console.error("Socket join error:", err);
      }
    });

    // Handle cursor movement broadcast
    socket.on("cursor-move", ({ drawingId, x, y }: { drawingId: string; x: number; y: number }) => {
      if (!socket.data.drawingId || socket.data.drawingId !== drawingId) return;

      socket.to(drawingId).emit("user-cursor", {
        userId,
        username: user.username,
        name: user.name || user.username,
        color: getRandomColor(userId),
        x,
        y,
      });
    });

    // Handle element updates from active drawing
    socket.on(
      "elements-update",
      ({
        drawingId,
        elements,
        revision,
      }: {
        drawingId: string;
        elements: any[];
        revision: number;
      }) => {
        // Enforce that user can only update the drawing room they were authorized to join
        if (!socket.data.drawingId || socket.data.drawingId !== drawingId) {
          socket.emit("error-message", { message: "Unauthorized drawing room update" });
          return;
        }

        if (socket.data.role === "viewer") {
          socket.emit("error-message", { message: "Viewers cannot modify drawings" });
          return;
        }

        roomElementsBuffer.set(drawingId, elements);

        socket.to(drawingId).emit("elements-sync", {
          elements,
          revision,
          userId,
        });

        scheduleAutoSave(drawingId);
      }
    );

    // Handle drawing clear
    socket.on("canvas-clear", ({ drawingId }: { drawingId: string }) => {
      if (!socket.data.drawingId || socket.data.drawingId !== drawingId) {
        return;
      }

      if (socket.data.role === "viewer") {
        socket.emit("error-message", { message: "Viewers cannot clear drawings" });
        return;
      }

      roomElementsBuffer.set(drawingId, []);
      socket.to(drawingId).emit("canvas-cleared", { userId });
      scheduleAutoSave(drawingId);
    });

    // Handle explicit drawing save
    socket.on("save-drawing", async ({ drawingId }: { drawingId: string }) => {
      if (!socket.data.drawingId || socket.data.drawingId !== drawingId) return;
      if (socket.data.role === "viewer") return;
      await flushAutoSave(drawingId);
    });

    // Handle user disconnect
    socket.on("disconnect", () => {
      const drawingId = socket.data.drawingId;
      if (drawingId && roomParticipants.has(drawingId)) {
        roomParticipants.get(drawingId)!.delete(socket.id);
        const activeUsers = Array.from(roomParticipants.get(drawingId)!.values());

        io.to(drawingId).emit("collaborators-update", { users: activeUsers });
        io.to(drawingId).emit("user-disconnected", { userId });

        if (roomParticipants.get(drawingId)!.size === 0) {
          roomParticipants.delete(drawingId);
          flushAutoSave(drawingId);
        }
      }
    });
  });

  return io;
}
