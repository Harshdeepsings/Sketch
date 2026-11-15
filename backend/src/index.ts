import path from "path";
import dotenv from "dotenv";
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import express from "express";
import http from "http";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";

import UserRoutes from "./Routes/UserRoutes";
import CanvasRoutes from "./Routes/CanvasRoutes";
import HealthRoutes from "./Routes/HealthRoutes";
import AuthRoutes from "./Routes/AuthRoutes";
import { setupSocketIO } from "./SocketHandler";
import { configurePassport } from "./passport";

const app = express();
const server = http.createServer(app);

// Initialize Passport authentication
const passport = configurePassport();
app.use(passport.initialize());

// Cross-Origin Resource Sharing
const allowedOrigins = [
  process.env.CLIENT_URL || "http://localhost:8080",
  "http://127.0.0.1:8080",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Dev permissive
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "20mb" }));
app.use(cookieParser());

// Mount API Route Modules
app.use("/api/v1/auth", AuthRoutes);
app.use("/api/v1/user", UserRoutes);
app.use("/api/v1/canvas", CanvasRoutes);
app.use("/api/health", HealthRoutes);

// Initialize Real-time Socket.IO Subsystem
const io = setupSocketIO(server);

// Database Connection & Server Startup
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error("FATAL: MONGODB_URI environment variable is not defined");
    }

    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(uri);
    console.log("Connected to MongoDB Atlas successfully");

    server.on("error", (e: any) => {
      if (e.code === "EADDRINUSE") {
        console.log(`Port ${PORT} is already in active use.`);
      } else {
        console.error("Server network error:", e);
      }
    });

    server.listen(PORT, () => {
      console.log(`Backend server running on http://localhost:${PORT}`);
    });
  } catch (err: any) {
    console.error("Server startup error:", err.message);
  }
}

startServer();

export { app, server, io };
