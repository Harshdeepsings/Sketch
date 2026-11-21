import { Router, Request, Response } from "express";
import mongoose from "mongoose";

const HealthRoutes = Router();

// GET /api/health
HealthRoutes.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
});

export default HealthRoutes;
