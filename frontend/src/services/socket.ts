import { io, Socket } from "socket.io-client";
import { getAuthToken } from "./api";

let socket: Socket | null = null;

const WS_BASE = import.meta.env.VITE_WS_URL || "http://localhost:5000";

export function getSocket(): Socket {
  if (!socket) {
    const token = getAuthToken();
    socket = io(WS_BASE, {
      auth: { token },
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
  }
  return socket;
}

export function connectSocket(): Socket {
  const s = getSocket();
  const token = getAuthToken();

  if (s.auth) {
    (s.auth as any).token = token;
  }

  if (!s.connected) {
    s.connect();
  }
  return s;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
