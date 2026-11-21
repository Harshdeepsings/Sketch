import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User,
  Lock,
  Trash2,
  ChevronLeft,
  Save,
  ShieldAlert,
  Calendar,
  Layers,
  Share2,
  Check,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { Navbar } from "../Components/Navbar";
import { Button } from "../Components/UI/Button";
import { SketchParticles } from "../Components/UI/SketchParticles";

export const Profile: React.FC = () => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  // Profile fields
  const [name, setName] = useState(user?.name || "");
  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Stats
  const [stats, setStats] = useState<{ ownedDrawings: number; sharedDrawings: number; totalDrawings: number }>({
    ownedDrawings: 0,
    sharedDrawings: 0,
    totalDrawings: 0,
  });
  const [memberSince, setMemberSince] = useState<string>("");

  // Feedback states
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Delete account confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await api.getMe();
        if (res.user) {
          setName(res.user.name || "");
          setUsername(res.user.username || "");
          setEmail(res.user.email || "");
          if (res.user.createdAt) {
            setMemberSince(new Date(res.user.createdAt).toLocaleDateString());
          }
        }
        if (res.stats) {
          setStats(res.stats);
        }
      } catch (err) {
        console.error("Failed to load user profile statistics:", err);
      }
    }
    fetchStats();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg(null);

    try {
      const res = await api.updateProfile({
        name: name.trim(),
        username: username.trim(),
        email: email.trim(),
      });
      if (res.user) {
        updateUser(res.user);
      }
      setProfileMsg({ type: "success", text: "Profile updated successfully." });
    } catch (err: any) {
      setProfileMsg({ type: "error", text: err.message || "Failed to update profile." });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "New passwords do not match." });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg({ type: "error", text: "New password must be at least 6 characters long." });
      return;
    }

    setPasswordLoading(true);
    setPasswordMsg(null);

    try {
      await api.changePassword({
        currentPassword,
        newPassword,
      });
      setPasswordMsg({ type: "success", text: "Password changed successfully." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordMsg({ type: "error", text: err.message || "Failed to change password." });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmationInput.trim().toUpperCase() !== "DELETE") {
      setDeleteError("Please type DELETE to confirm permanent account removal.");
      return;
    }

    setDeleteLoading(true);
    setDeleteError(null);

    try {
      await api.deleteAccount();
      await logout();
      alert("Your account and all associated drawings have been permanently deleted.");
      navigate("/");
    } catch (err: any) {
      setDeleteError(err.message || "Failed to delete account. Please try again.");
      setDeleteLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-(--bg-main) text-(--text-primary) flex flex-col relative transition-colors selection:bg-(--accent-primary) selection:text-white">
      <SketchParticles />
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 md:p-8 relative z-10">
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-(--border-strong) bg-(--bg-surface) text-xs font-mono text-(--text-secondary) hover:text-(--text-primary) hover:border-(--accent-primary) transition-colors shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
        </div>

        {/* User Profile Card */}
        <div className="rounded-2xl border-2 border-(--border-strong) bg-(--bg-surface) shadow-2xl p-6 sm:p-8 relative mb-8">
          <div className="drafting-tape-tl" />
          <div className="drafting-tape-tr" />

          {/* Header Title */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-(--border-subtle) mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-(--accent-primary) text-white flex items-center justify-center font-bold text-2xl shadow-md font-pencil">
                {username ? username.charAt(0).toUpperCase() : "S"}
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-(--accent-primary) font-bold">
                  USER PROFILE
                </div>
                <h1 className="text-3xl font-bold font-pencil text-(--text-primary)">
                  {name || username || "Your Profile"}
                </h1>
                <p className="text-xs font-mono text-(--text-muted)">
                  @{username} • {email}
                </p>
              </div>
            </div>

            {memberSince && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-(--bg-surface-elevated) border border-(--border-subtle) text-xs font-mono text-(--text-muted) self-start sm:self-auto">
                <Calendar className="w-3.5 h-3.5 text-(--accent-primary)" />
                <span>MEMBER SINCE: {memberSince}</span>
              </div>
            )}
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="p-4 rounded-xl border border-(--border-subtle) bg-(--bg-surface-elevated) flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-(--bg-surface) border border-(--border-subtle) text-(--accent-primary)">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <div className="text-lg font-bold font-mono text-(--text-primary)">
                  {stats.ownedDrawings}
                </div>
                <div className="text-[11px] font-mono text-(--text-muted)">My Drawings</div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-(--border-subtle) bg-(--bg-surface-elevated) flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-(--bg-surface) border border-(--border-subtle) text-emerald-500">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-lg font-bold font-mono text-(--text-primary)">
                  {stats.sharedDrawings}
                </div>
                <div className="text-[11px] font-mono text-(--text-muted)">Shared with Me</div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-(--border-subtle) bg-(--bg-surface-elevated) flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-(--bg-surface) border border-(--border-subtle) text-amber-500">
                <User className="w-5 h-5" />
              </div>
              <div>
                <div className="text-lg font-bold font-mono text-(--text-primary)">
                  {stats.totalDrawings}
                </div>
                <div className="text-[11px] font-mono text-(--text-muted)">Total Drawings</div>
              </div>
            </div>
          </div>

          {/* Form 1: Edit Profile Information */}
          <div className="mb-10 pb-8 border-b border-(--border-subtle)">
            <h2 className="text-xl font-bold font-pencil text-(--text-primary) mb-1">
              Personal Information
            </h2>
            <p className="text-xs font-mono text-(--text-muted) mb-5">
              Update your display name, username handle, and email address
            </p>

            {profileMsg && (
              <div
                className={`mb-4 p-3 rounded-lg text-xs font-mono flex items-center gap-2 ${
                  profileMsg.type === "success"
                    ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/30"
                    : "bg-rose-500/10 text-rose-500 border border-rose-500/30"
                }`}
              >
                {profileMsg.type === "success" ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                <span>{profileMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4 font-mono text-xs max-w-xl">
              <div>
                <label className="block text-xs font-semibold text-(--text-secondary) mb-1">
                  FULL DISPLAY NAME
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Leonardo da Vinci"
                  className="w-full px-3.5 py-2 bg-(--bg-surface-elevated) border border-(--border-strong) rounded-lg text-xs text-(--text-primary) placeholder-(--text-muted) focus:outline-none focus:border-(--accent-primary) transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-(--text-secondary) mb-1">
                  USERNAME
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="alexm"
                  className="w-full px-3.5 py-2 bg-(--bg-surface-elevated) border border-(--border-strong) rounded-lg text-xs text-(--text-primary) placeholder-(--text-muted) focus:outline-none focus:border-(--accent-primary) transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-(--text-secondary) mb-1">
                  EMAIL ADDRESS
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="alex@example.com"
                  className="w-full px-3.5 py-2 bg-(--bg-surface-elevated) border border-(--border-strong) rounded-lg text-xs text-(--text-primary) placeholder-(--text-muted) focus:outline-none focus:border-(--accent-primary) transition-colors"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={profileLoading}
                startIcon={<Save className="w-3.5 h-3.5" />}
              >
                Save Profile Changes
              </Button>
            </form>
          </div>

          {/* Form 2: Change Password */}
          <div className="mb-10 pb-8 border-b border-(--border-subtle)">
            <h2 className="text-xl font-bold font-pencil text-(--text-primary) mb-1">
              Security & Credentials
            </h2>
            <p className="text-xs font-mono text-(--text-muted) mb-5">
              Change your password to maintain account security
            </p>

            {passwordMsg && (
              <div
                className={`mb-4 p-3 rounded-lg text-xs font-mono flex items-center gap-2 ${
                  passwordMsg.type === "success"
                    ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/30"
                    : "bg-rose-500/10 text-rose-500 border border-rose-500/30"
                }`}
              >
                {passwordMsg.type === "success" ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                <span>{passwordMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4 font-mono text-xs max-w-xl">
              <div>
                <label className="block text-xs font-semibold text-(--text-secondary) mb-1">
                  CURRENT PASSWORD
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 bg-(--bg-surface-elevated) border border-(--border-strong) rounded-lg text-xs text-(--text-primary) placeholder-(--text-muted) focus:outline-none focus:border-(--accent-primary) transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-(--text-secondary) mb-1">
                    NEW PASSWORD
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="Min 6 characters"
                    className="w-full px-3.5 py-2 bg-(--bg-surface-elevated) border border-(--border-strong) rounded-lg text-xs text-(--text-primary) placeholder-(--text-muted) focus:outline-none focus:border-(--accent-primary) transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-(--text-secondary) mb-1">
                    CONFIRM NEW PASSWORD
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Repeat new password"
                    className="w-full px-3.5 py-2 bg-(--bg-surface-elevated) border border-(--border-strong) rounded-lg text-xs text-(--text-primary) placeholder-(--text-muted) focus:outline-none focus:border-(--accent-primary) transition-colors"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="secondary"
                size="md"
                loading={passwordLoading}
                startIcon={<Lock className="w-3.5 h-3.5" />}
              >
                Update Password
              </Button>
            </form>
          </div>

          {/* Section 3: Danger Zone (Delete Account) */}
          <div>
            <div className="flex items-center gap-2 mb-2 text-rose-500">
              <ShieldAlert className="w-5 h-5" />
              <h2 className="text-xl font-bold font-pencil">
                Danger Zone
              </h2>
            </div>
            <p className="text-xs font-mono text-(--text-muted) mb-4">
              Permanently delete your account and all owned drawings.
            </p>

            <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold text-rose-500 font-mono mb-1">
                  DELETE ACCOUNT
                </div>
                <div className="text-xs text-(--text-secondary)">
                  Once deleted, your account and all drawings cannot be recovered.
                </div>
              </div>

              <Button
                variant="danger"
                size="md"
                onClick={() => {
                  setShowDeleteModal(true);
                  setDeleteError(null);
                  setDeleteConfirmationInput("");
                }}
                startIcon={<Trash2 className="w-3.5 h-3.5" />}
              >
                Delete Account
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Delete Account Modal Dialog */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-(--bg-surface) border-2 border-rose-500/50 shadow-2xl p-6 relative font-mono text-xs">
            <div className="flex items-center gap-2 text-rose-500 mb-3">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-bold font-pencil">Confirm Permanent Deletion</h3>
            </div>

            <p className="text-xs text-(--text-secondary) mb-4 leading-relaxed">
              This action will permanently delete user <strong>@{username}</strong>, along with all {stats.ownedDrawings} owned drawings and canvas elements.
            </p>

            <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400">
              Please type <strong className="underline">DELETE</strong> to confirm:
            </div>

            <input
              type="text"
              value={deleteConfirmationInput}
              onChange={(e) => setDeleteConfirmationInput(e.target.value)}
              placeholder="DELETE"
              className="w-full px-3.5 py-2.5 bg-(--bg-surface-elevated) border border-rose-500/50 rounded-lg text-xs font-mono text-(--text-primary) mb-3 focus:outline-none focus:border-rose-500"
            />

            {deleteError && (
              <div className="mb-4 text-rose-500 text-xs">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-(--border-subtle)">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteLoading}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDeleteAccount}
                loading={deleteLoading}
                disabled={deleteConfirmationInput.trim().toUpperCase() !== "DELETE"}
              >
                Permanently Delete Account
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Profile;
