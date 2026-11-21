import { Request, Response, NextFunction, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { UserModel } from "./db";

export interface AuthRequest extends Request {
  userId?: string;
  user?: any;
}

interface JwtPayload {
  id: string;
}

export const getJwtSecret = (): string => {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) {
    throw new Error("FATAL: JWT_ACCESS_SECRET is not configured in environment variables");
  }
  return secret;
};

export const getJwtRefreshSecret = (): string => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error("FATAL: JWT_REFRESH_SECRET is not configured in environment variables");
  }
  return secret;
};

export const UserMiddleware: RequestHandler = async (req: any, res: Response, next: NextFunction): Promise<any> => {
  try {
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
      token = authHeader.substring(7).trim();
    } else if (req.cookies && req.cookies.AccessToken) {
      token = req.cookies.AccessToken;
    }

    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret) as JwtPayload;

    if (!decoded || !decoded.id) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    const user = await UserModel.findById(decoded.id).select("-password").lean();
    if (!user) {
      return res.status(401).json({ message: "User account not found" });
    }

    req.userId = decoded.id;
    req.user = user;
    next();
  } catch (e: any) {
    if (e.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token has expired", expired: true });
    }
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
