import { Request, Response, NextFunction, RequestHandler } from "express";

export interface AuthRequest extends Request {
  userId?: string;
  user?: any;
}

// Simple and readable authentication middleware using Passport sessions
export const UserMiddleware: RequestHandler = (req: any, res: Response, next: NextFunction): any => {
  if (req.isAuthenticated && req.isAuthenticated() && req.user) {
    req.userId = req.user._id?.toString() || req.user.id?.toString();
    return next();
  }
  return res.status(401).json({ message: "Authentication required" });
};
