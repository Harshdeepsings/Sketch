import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Share2,
  Download,
  Moon,
  Sun,
  ChevronLeft,
  Cloud,
  LogOut,
  FolderOpen,
  Edit2,
  Check,
  User as UserIcon,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import type { Participant } from "../types/canvas";

interface NavbarProps {
  title?: string;
  onTitleChange?: (newTitle: string) => void;
  saveStatus?: "saved" | "saving" | "unsaved" | "error";
  onShareClick?: () => void;
  onExportClick?: () => void;
  participants?: Participant[];
  drawingRole?: "owner" | "editor" | "viewer";
  showCanvasControls?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  title = "Untitled Drawing",
  onTitleChange,
  saveStatus = "saved",
  onShareClick,
  onExportClick,
  participants = [],
  drawingRole = "owner",
  showCanvasControls = false,
}) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [currentTitle, setCurrentTitle] = useState(title);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (onTitleChange && currentTitle.trim() && currentTitle !== title) {
      onTitleChange(currentTitle.trim());
    } else {
      setCurrentTitle(title);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleTitleSubmit();
    } else if (e.key === "Escape") {
      setCurrentTitle(title);
      setIsEditingTitle(false);
    }
  };

  return (
    <header className="h-12 border-b border-(--border-subtle) bg-(--bg-surface-translucent) backdrop-blur-md px-3.5 flex items-center justify-between z-30 select-none transition-colors">
      {/* Left: Brand or Back + Document Block */}
      <div className="flex items-center gap-3">
        {showCanvasControls ? (
          <Link
            to="/dashboard"
            className="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-mono font-medium text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--border-subtle) transition-colors"
            title="Return to Dashboard"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </Link>
        ) : (
          <Link to="/" className="flex items-center gap-2.5 group">
            {/* Technical drafting compass mark */}
            <div className="w-7 h-7 rounded-lg bg-(--text-primary) text-(--bg-main) flex items-center justify-center font-mono font-bold text-xs tracking-tighter shadow-sm group-hover:scale-105 transition-transform">
              S
            </div>
            <span className="font-bold text-lg tracking-tight text-(--text-primary) font-pencil">
              Sketch
            </span>
            <span className="text-[10px] font-mono text-(--text-muted) px-1.5 py-0.5 rounded border border-(--border-subtle) bg-(--bg-surface-elevated) hidden sm:inline">
              STUDIO
            </span>
          </Link>
        )}

        {showCanvasControls && (
          <div className="flex items-center gap-2 pl-2 border-l border-(--border-subtle)">
            {isEditingTitle && (drawingRole === "owner" || drawingRole === "editor") ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={currentTitle}
                  onChange={(e) => setCurrentTitle(e.target.value)}
                  onBlur={handleTitleSubmit}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  className="bg-(--bg-surface-elevated) border border-(--border-strong) text-(--text-primary) text-xs font-mono rounded px-2 py-0.5 focus-ring"
                />
                <button
                  onClick={handleTitleSubmit}
                  className="p-1 text-emerald-500 hover:bg-(--border-subtle) rounded"
                >
                  <Check className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => {
                  if (drawingRole === "owner" || drawingRole === "editor") {
                    setIsEditingTitle(true);
                  }
                }}
                className={`flex items-center gap-1.5 text-xs font-medium text-(--text-primary) px-2 py-1 rounded transition-colors ${
                  drawingRole === "owner" || drawingRole === "editor"
                    ? "hover:bg-(--border-subtle) cursor-pointer"
                    : "cursor-default"
                }`}
                title={drawingRole === "owner" || drawingRole === "editor" ? "Click to rename" : ""}
              >
                <span>{title}</span>
                {(drawingRole === "owner" || drawingRole === "editor") && (
                  <Edit2 className="w-2.5 h-2.5 text-(--text-muted) opacity-60" />
                )}
              </div>
            )}

            {/* Role indicator */}
            <span className="text-[9px] uppercase font-mono font-medium tracking-wider px-1.5 py-0.5 rounded border border-(--border-subtle) text-(--text-muted)">
              {drawingRole}
            </span>

            {/* Save Status Indicator */}
            <div className="flex items-center gap-1.5 ml-1 text-xs text-(--text-muted)">
              {saveStatus === "saving" && (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                  <span className="text-amber-500 text-[10px] font-mono">saving...</span>
                </>
              )}
              {saveStatus === "saved" && (
                <>
                  <Cloud className="w-3 h-3 text-emerald-500" />
                  <span className="text-emerald-500 text-[10px] font-mono">saved</span>
                </>
              )}
              {saveStatus === "unsaved" && (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  <span className="text-[10px] font-mono">unsaved</span>
                </>
              )}
              {saveStatus === "error" && (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  <span className="text-rose-500 text-[10px] font-mono">error</span>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right: Presence, Actions & Theme Toggle */}
      <div className="flex items-center gap-1.5">
        {/* Collaborative Presence Avatars */}
        {showCanvasControls && participants.length > 0 && (
          <div className="flex items-center -space-x-1.5 mr-2">
            {participants.slice(0, 4).map((p, idx) => (
              <div
                key={p.userId || idx}
                className="w-5.5 h-5.5 rounded-full flex items-center justify-center text-[9px] font-mono font-bold text-white shadow-sm border border-(--bg-surface) uppercase"
                style={{ backgroundColor: p.color || "#064D91" }}
                title={`${p.username} (${p.role})`}
              >
                {p.username.slice(0, 2)}
              </div>
            ))}
            {participants.length > 4 && (
              <div className="w-5.5 h-5.5 rounded-full bg-slate-700 text-white text-[9px] font-mono font-bold flex items-center justify-center border border-(--bg-surface)">
                +{participants.length - 4}
              </div>
            )}
          </div>
        )}

        {/* Export Button */}
        {showCanvasControls && (
          <button
            onClick={onExportClick}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-medium border border-(--border-subtle) bg-(--bg-surface) hover:bg-(--border-subtle) text-(--text-primary) transition-all shadow-sm active:translate-y-px"
            title="Export drawing"
          >
            <Download className="w-3 h-3" />
            <span className="hidden sm:inline">Export</span>
          </button>
        )}

        {/* Share Button */}
        {showCanvasControls && (
          <button
            onClick={onShareClick}
            className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono font-medium bg-(--accent-primary) hover:opacity-90 text-white transition-all shadow-sm active:translate-y-px"
            title="Invite collaborators"
          >
            <Share2 className="w-3 h-3" />
            <span>Share</span>
          </button>
        )}

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="w-7 h-7 rounded flex items-center justify-center text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--border-subtle) transition-colors"
          title={`Switch to ${theme === "dark" ? "Light Mode" : "Dark Mode"}`}
        >
          {theme === "dark" ? <Sun className="w-3.5 h-3.5 text-amber-300" /> : <Moon className="w-3.5 h-3.5 text-sky-700" />}
        </button>

        {/* User Account / Navigation */}
        {user ? (
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded border border-(--border-subtle) bg-(--bg-surface) hover:bg-(--border-subtle) transition-colors"
            >
              <div className="w-4.5 h-4.5 rounded bg-(--accent-primary) text-white text-[9px] font-mono font-bold flex items-center justify-center uppercase">
                {user.username.slice(0, 1)}
              </div>
              <span className="text-xs font-mono text-(--text-primary) hidden md:inline">
                {user.username}
              </span>
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-1.5 w-48 rounded-lg bg-(--bg-surface) border border-(--border-strong) shadow-xl py-1 z-50">
                <div className="px-3 py-2 border-b border-(--border-subtle)">
                  <p className="text-xs font-semibold text-(--text-primary)">{user.name || user.username}</p>
                  <p className="text-[10px] font-mono text-(--text-muted) truncate">{user.email}</p>
                </div>
                <Link
                  to="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--border-subtle)"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>My Drawings</span>
                </Link>
                <Link
                  to="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--border-subtle)"
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  <span>Profile & Settings</span>
                </Link>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                    navigate("/login");
                  }}
                  className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-xs text-rose-500 hover:bg-rose-500/10"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="px-2.5 py-1 rounded text-xs font-mono font-medium border border-(--border-subtle) text-(--text-primary) hover:bg-(--border-subtle) transition-colors"
            >
              Log in
            </Link>
            <Link
              to="/signup"
              className="px-3 py-1 rounded text-xs font-mono font-medium bg-(--accent-primary) text-white hover:opacity-90 transition-opacity shadow-sm"
            >
              Get started
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};
export default Navbar;
