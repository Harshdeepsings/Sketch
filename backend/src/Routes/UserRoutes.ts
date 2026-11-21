import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import { SignupSchema, LoginSchema } from "../UserValidation";
import { UserModel, CanvasModel, InvitationModel } from "../db";
import { UserMiddleware, AuthRequest } from "../Middleware";

const UserRoutes = Router();

// Helper: Format user object for safe public response
function formatUser(user: any) {
  return {
    id: user._id?.toString() || user.id?.toString(),
    username: user.username,
    email: user.email,
    name: user.name,
  };
}

// POST /signup - Register new account and establish session
UserRoutes.post("/signup", async (req: any, res: Response) => {
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

    req.login(user, (err: any) => {
      if (err) {
        console.error("Session login error after signup:", err);
        return res.status(500).json({ message: "Failed to establish user session" });
      }

      return res.status(201).json({
        message: "Account created successfully",
        user: formatUser(user),
      });
    });
  } catch (e: any) {
    console.error("Signup error:", e);
    return res.status(500).json({ message: "Internal server error during registration" });
  }
});

// POST /login - Authenticate with email/username & password
UserRoutes.post("/login", async (req: any, res: Response) => {
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
    const user = await UserModel.findOne(query);

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

    req.login(user, (err: any) => {
      if (err) {
        console.error("Session login error:", err);
        return res.status(500).json({ message: "Failed to establish user session" });
      }

      return res.status(200).json({
        message: "Logged in successfully",
        user: formatUser(user),
      });
    });
  } catch (e: any) {
    console.error("Login error:", e);
    return res.status(500).json({ message: "Internal server error during login" });
  }
});

// GET /me - Profile details & drawing statistics
UserRoutes.get("/me", UserMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const userId = user._id || user.id;
    const ownedCount = await CanvasModel.countDocuments({ owner: userId });
    const sharedCount = await CanvasModel.countDocuments({
      owner: { $ne: userId },
      "collaborators.user": userId,
    });

    return res.status(200).json({
      user: {
        ...formatUser(user),
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

// PUT /profile - Update display name, username, or email
UserRoutes.put("/profile", UserMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const userId = user._id || user.id;
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
      const existing = await UserModel.findOne({ username: cleanUsername, _id: { $ne: userId } });
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
      const existing = await UserModel.findOne({ email: cleanEmail, _id: { $ne: userId } });
      if (existing) {
        return res.status(409).json({ message: "Email is already associated with another account" });
      }
      updates.email = cleanEmail;
    }

    const updatedUser = await UserModel.findByIdAndUpdate(userId, updates, { new: true }).select("-password");

    return res.status(200).json({
      message: "Profile updated successfully",
      user: formatUser(updatedUser),
    });
  } catch (e: any) {
    console.error("Profile update error:", e);
    return res.status(500).json({ message: "Failed to update profile information" });
  }
});

// PUT /password - Change password securely
UserRoutes.put("/password", UserMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const user = await UserModel.findById(userId);
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

// DELETE /account - Permanently delete account and associated drawings
UserRoutes.delete("/account", UserMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    await CanvasModel.deleteMany({ owner: userId });
    await CanvasModel.updateMany(
      { "collaborators.user": userId },
      { $pull: { collaborators: { user: userId } } }
    );
    await InvitationModel.deleteMany({ inviterId: userId });
    await UserModel.findByIdAndDelete(userId);

    req.logout?.(() => {});
    req.session?.destroy?.(() => {});
    res.clearCookie("connect.sid");

    return res.status(200).json({
      message: "Account and all associated blueprints have been permanently deleted",
    });
  } catch (e: any) {
    console.error("Delete account error:", e);
    return res.status(500).json({ message: "Failed to delete account" });
  }
});

// POST /logout - Log out and destroy session
UserRoutes.post("/logout", (req: any, res: Response) => {
  req.logout((err: any) => {
    if (req.session) {
      req.session.destroy(() => {
        res.clearCookie("connect.sid");
        return res.status(200).json({ message: "Logged out successfully" });
      });
    } else {
      res.clearCookie("connect.sid");
      return res.status(200).json({ message: "Logged out successfully" });
    }
  });
});

export default UserRoutes;
