import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

const WS_BASE = import.meta.env.VITE_WS_URL || "http://localhost:5000";

export function getSocket(): Socket {
  if (!socket) {
    socket = io(WS_BASE, {
      withCredentials: true, // Send session cookies automatically with websocket connection
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
