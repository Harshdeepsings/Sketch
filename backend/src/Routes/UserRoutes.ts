import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { SignupSchema, LoginSchema } from "../UserValidation";
import { UserModel, CanvasModel, InvitationModel } from "../db";
import { UserMiddleware, AuthRequest, getJwtSecret, getJwtRefreshSecret } from "../Middleware";

const UserRoutes = Router();

// POST /signup
UserRoutes.post("/signup", async (req, res: Response) => {
  const parsed = SignupSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: "Validation failed",
      errors: parsed.error.issues.map((i) => i.message),
    });
  }

  const { username, password, email, name } = parsed.data;

  try {
    const existing = await UserModel.findOne({
      $or: [{ username: username.toLowerCase() }, { email: email.toLowerCase() }],
    });

    if (existing) {
      if (existing.email.toLowerCase() === email.toLowerCase()) {
        return res.status(409).json({ message: "An account with this email already exists" });
      }
      return res.status(409).json({ message: "Username is already taken" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await UserModel.create({
      username: username.toLowerCase(),
      password: hashedPassword,
      email: email.toLowerCase(),
      name: name || username,
    });

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

    return res.status(201).json({
      message: "Account created successfully",
      accessToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
      },
    });
  } catch (e: any) {
    console.error("Signup error:", e);
    return res.status(500).json({ message: "Internal server error during registration" });
  }
});

// POST /login
const handleLogin = async (req: any, res: Response) => {
  const parsed = LoginSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid login credentials provided",
      errors: parsed.error.issues.map((i) => i.message),
    });
  }

  const { username, email, password } = parsed.data;

  try {
    const query = email ? { email: email.toLowerCase() } : { username: (username || "").toLowerCase() };
    const user = await UserModel.findOne(query).lean();

    if (!user) {
      return res.status(401).json({ message: "Invalid email/username or password" });
    }

    if (!user.password) {
      return res.status(401).json({
        message: "This account was created with Google sign-in. Please log in with Google.",
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid email/username or password" });
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

    return res.status(200).json({
      message: "Logged in successfully",
      accessToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
      },
    });
  } catch (e: any) {
    console.error("Login error:", e);
    return res.status(500).json({ message: "Internal server error during login" });
  }
};

UserRoutes.post("/login", handleLogin);

// GET /me (Profile details & statistics)
UserRoutes.get("/me", UserMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const ownedCount = await CanvasModel.countDocuments({ ownerId: user._id });
    const sharedCount = await CanvasModel.countDocuments({
      ownerId: { $ne: user._id },
      "collaborators.userId": user._id,
    });

    return res.status(200).json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      stats: {
        ownedDrawings: ownedCount,
        sharedDrawings: sharedCount,
        totalDrawings: ownedCount + sharedCount,
      },
    });
  } catch (e: any) {
    return res.status(500).json({ message: "Error fetching user profile" });
  }
});

// PUT /profile (Update user display name, username, or email)
UserRoutes.put("/profile", UserMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { name, username, email } = req.body;
    const updates: Partial<{ name: string; username: string; email: string }> = {};

    if (name !== undefined) {
      updates.name = String(name).trim();
    }

    if (username && username.trim().toLowerCase() !== user.username) {
      const cleanUsername = username.trim().toLowerCase();
      if (cleanUsername.length < 3) {
        return res.status(400).json({ message: "Username must be at least 3 characters long" });
      }
      const existing = await UserModel.findOne({ username: cleanUsername, _id: { $ne: user._id } });
      if (existing) {
        return res.status(409).json({ message: "Username is already taken by another account" });
      }
      updates.username = cleanUsername;
    }

    if (email && email.trim().toLowerCase() !== user.email) {
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail.includes("@")) {
        return res.status(400).json({ message: "Please enter a valid email address" });
      }
      const existing = await UserModel.findOne({ email: cleanEmail, _id: { $ne: user._id } });
      if (existing) {
        return res.status(409).json({ message: "Email is already associated with another account" });
      }
      updates.email = cleanEmail;
    }

    const updatedUser = await UserModel.findByIdAndUpdate(user._id, updates, { new: true }).select("-password");

    return res.status(200).json({
      message: "Profile updated successfully",
      user: {
        id: updatedUser?._id,
        username: updatedUser?.username,
        email: updatedUser?.email,
        name: updatedUser?.name,
      },
    });
  } catch (e: any) {
    console.error("Profile update error:", e);
    return res.status(500).json({ message: "Failed to update profile information" });
  }
});

// PUT /password (Change password securely)
UserRoutes.put("/password", UserMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await UserModel.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Both current password and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters long" });
    }

    if (!user.password) {
      return res.status(400).json({
        message: "This account uses Google sign-in and does not have a local password set.",
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password does not match" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.status(200).json({ message: "Password updated successfully" });
  } catch (e: any) {
    console.error("Password change error:", e);
    return res.status(500).json({ message: "Failed to change password" });
  }
});

// DELETE /account (Permanently delete user account and associated workspaces)
UserRoutes.delete("/account", UserMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // 1. Delete all drawing workspaces owned by this user
    await CanvasModel.deleteMany({ ownerId: userId });

    // 2. Remove user from collaborator arrays on shared drawings
    await CanvasModel.updateMany(
      { "collaborators.userId": userId },
      { $pull: { collaborators: { userId } } }
    );

    // 3. Remove pending invitations created by this user
    await InvitationModel.deleteMany({ createdBy: userId });

    // 4. Delete the user record
    await UserModel.findByIdAndDelete(userId);

    // 5. Clear authentication cookies
    res.clearCookie("RefreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return res.status(200).json({
      message: "Account and all associated blueprints have been permanently deleted",
    });
  } catch (e: any) {
    console.error("Delete account error:", e);
    return res.status(500).json({ message: "Failed to delete account" });
  }
});

// POST /refresh
UserRoutes.post("/refresh", async (req, res: Response) => {
  const token = req.cookies?.RefreshToken || req.body?.refreshToken;

  if (!token) {
    return res.status(401).json({ message: "Refresh token required" });
  }

  try {
    const refreshSecret = getJwtRefreshSecret();
    const decoded = jwt.verify(token, refreshSecret) as { id: string };

    const user = await UserModel.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ message: "Invalid user for token" });
    }

    const accessSecret = getJwtSecret();
    const newAccessToken = jwt.sign({ id: user._id.toString() }, accessSecret, {
      expiresIn: "7d",
    });

    return res.status(200).json({
      accessToken: newAccessToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
      },
    });
  } catch (e) {
    return res.status(401).json({ message: "Expired or invalid refresh token" });
  }
});

// POST /logout
UserRoutes.post("/logout", (req, res: Response) => {
  res.clearCookie("RefreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  return res.status(200).json({ message: "Logged out successfully" });
});

export default UserRoutes;
