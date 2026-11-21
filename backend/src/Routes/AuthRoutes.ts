import { Router } from "express";
import passport from "../passport";

const AuthRoutes = Router();

// GET /api/v1/auth/google - Start Google OAuth login
AuthRoutes.get(
  "/google",
  (req, res, next) => {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      const clientUrl = process.env.CLIENT_URL || "http://localhost:8080";
      return res.redirect(`${clientUrl}/login?error=google_oauth_not_configured`);
    }
    next();
  },
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// GET /api/v1/auth/google/callback - Handle Google Callback
AuthRoutes.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.CLIENT_URL || "http://localhost:8080"}/login?error=oauth_authentication_failed`,
  }),
  (req, res) => {
    // Explicitly wait for session to persist in MongoDB before redirecting!
    req.session.save((err) => {
      const clientUrl = process.env.CLIENT_URL || "http://localhost:8080";
      if (err) {
        console.error("Google session save error:", err);
        return res.redirect(`${clientUrl}/login?error=session_save_failed`);
      }
      res.redirect(`${clientUrl}/dashboard`);
    });
  }
);

export default AuthRoutes;
