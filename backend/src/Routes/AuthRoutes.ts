import { Router } from "express";
import jwt from "jsonwebtoken";
import passport from "../passport";
import { getJwtSecret, getJwtRefreshSecret } from "../Middleware";

const AuthRoutes = Router();

// GET /api/v1/auth/google - Initiate Google OAuth
AuthRoutes.get(
  "/google",
  (req, res, next) => {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      const clientUrl = process.env.CLIENT_URL || "http://localhost:8080";
      return res.redirect(`${clientUrl}/login?error=google_oauth_not_configured`);
    }
    next();
  },
  passport.authenticate("google", { scope: ["profile", "email"], session: false })
);

// GET /api/v1/auth/google/callback - Handle Google Callback
AuthRoutes.get(
  "/google/callback",
  (req, res, next) => {
    passport.authenticate("google", {
      session: false,
      failureRedirect: `${process.env.CLIENT_URL || "http://localhost:8080"}/login?error=oauth_failed`,
    }, (err: any, user: any) => {
      if (err || !user) {
        console.error("Google OAuth callback error:", err);
        const clientUrl = process.env.CLIENT_URL || "http://localhost:8080";
        return res.redirect(`${clientUrl}/login?error=oauth_authentication_failed`);
      }

      const accessSecret = getJwtSecret();
      const refreshSecret = getJwtRefreshSecret();

      const accessToken = jwt.sign({ id: user._id.toString() }, accessSecret, {
        expiresIn: "7d",
      });

      const refreshToken = jwt.sign({ id: user._id.toString() }, refreshSecret, {
        expiresIn: "30d",
      });

      res.cookie("RefreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      const clientUrl = process.env.CLIENT_URL || "http://localhost:8080";
      return res.redirect(`${clientUrl}/auth/callback?token=${accessToken}`);
    })(req, res, next);
  }
);

export default AuthRoutes;
