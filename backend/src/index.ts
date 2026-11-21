import path from "path";
import dotenv from "dotenv";
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import express from "express";
import http from "http";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";
import MongoStore from "connect-mongo";
import mongoose from "mongoose";

import UserRoutes from "./Routes/UserRoutes";
import CanvasRoutes from "./Routes/CanvasRoutes";
import HealthRoutes from "./Routes/HealthRoutes";
import AuthRoutes from "./Routes/AuthRoutes";
import { setupSocketIO } from "./SocketHandler";
import { configurePassport } from "./passport";

const app = express();
const server = http.createServer(app);

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

// Express Session Configuration using MongoDB Store
export const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || "sketch-session-secret-key-2026",
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI as string,
    collectionName: "sessions",
    ttl: 14 * 24 * 60 * 60, // 14 days
  }),
  cookie: {
    maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  },
});

app.use(sessionMiddleware);

// Initialize Passport authentication and session handling
const passport = configurePassport();
app.use(passport.initialize());
app.use(passport.session());

// Mount API Route Modules
app.use("/api/v1/auth", AuthRoutes);
app.use("/api/v1/user", UserRoutes);
app.use("/api/v1/canvas", CanvasRoutes);
app.use("/api/health", HealthRoutes);

// Initialize Real-time Socket.IO Subsystem with shared session
const io = setupSocketIO(server, sessionMiddleware);

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
