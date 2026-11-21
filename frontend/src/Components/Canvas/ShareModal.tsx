import React, { useState, useEffect } from "react";
import {
  X,
  Mail,
  Copy,
  Check,
  Globe,
  Lock,
  Trash2,
} from "lucide-react";
import { api } from "../../services/api";
import { Button } from "../UI/Button";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  drawingId: string;
  isOwner: boolean;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  drawingId,
  isOwner,
}) => {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"editor" | "viewer">("editor");
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);
  const [isPublic, setIsPublic] = useState(false);
  const [owner, setOwner] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [generatedInviteLink, setGeneratedInviteLink] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (isOpen && drawingId) {
      loadCollaborators();
    }
  }, [isOpen, drawingId]);

  const loadCollaborators = async () => {
    setLoading(true);
    try {
      const data = await api.getCollaborators(drawingId);
      setCollaborators(data.collaborators || []);
      setPendingInvites(data.pendingInvitations || []);
      setIsPublic(data.isPublic || false);
      setOwner(data.owner);
    } catch (err: any) {
      console.error("Failed to load collaborators:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setSending(true);
    setFeedback(null);
    setGeneratedInviteLink(null);

    try {
      const res = await api.inviteCollaborator(drawingId, inviteEmail.trim(), inviteRole);
      setFeedback({ type: "success", message: res.message });
      setInviteEmail("");

      if (res.invitationToken) {
        const fullUrl = `${window.location.origin}/invite/${res.invitationToken}`;
        setGeneratedInviteLink(fullUrl);
      }

      await loadCollaborators();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to send invitation" });
    } finally {
      setSending(false);
    }
  };

  const handleRemoveCollaborator = async (targetUserId: string) => {
    try {
      await api.removeCollaborator(drawingId, targetUserId);
      setCollaborators((prev) =>
        prev.filter((c) => (c.user?._id || c.user?.id || c.user) !== targetUserId)
      );
    } catch (err: any) {
      alert("Failed to remove collaborator");
    }
  };

  const handleTogglePublic = async () => {
    if (!isOwner) return;
    try {
      const res = await api.togglePublic(drawingId);
      setIsPublic(res.isPublic);
    } catch (err) {
      alert("Failed to toggle public state");
    }
  };

  const copyDrawingLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in select-none">
      <div className="w-full max-w-md rounded-xl bg-(--bg-surface) border border-(--border-strong) shadow-2xl p-5 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded text-(--text-muted) hover:text-(--text-primary) hover:bg-(--border-subtle) transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mb-4">
          <span className="text-[10px] font-mono uppercase tracking-wider text-(--accent-primary) font-semibold">
            ACCESS & ROLES
          </span>
          <h3 className="text-base font-bold text-(--text-primary)">
            Workspace Collaboration
          </h3>
        </div>

        {/* Invite Form */}
        <form onSubmit={handleInvite} className="mb-4">
          <div className="flex gap-1.5 font-mono">
            <div className="relative flex-1">
              <Mail className="absolute left-2.5 top-2 w-3.5 h-3.5 text-(--text-muted)" />
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@domain.com"
                className="w-full pl-8 pr-2.5 py-1.5 bg-(--bg-surface-elevated) border border-(--border-strong) rounded text-xs text-(--text-primary) placeholder-(--text-muted) focus-ring"
              />
            </div>

            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as any)}
              className="bg-(--bg-surface-elevated) border border-(--border-strong) rounded px-2 py-1.5 text-xs text-(--text-primary) focus-ring"
            >
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>

            <Button type="submit" variant="primary" size="sm" loading={sending}>
              Invite
            </Button>
          </div>

          {feedback && (
            <div
              className={`mt-2 p-2 rounded text-xs font-mono flex items-center gap-2 ${
                feedback.type === "success"
                  ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
              }`}
            >
              <span>{feedback.message}</span>
            </div>
          )}

          {generatedInviteLink && (
            <div className="mt-2.5 p-2.5 rounded bg-(--bg-surface-elevated) border border-(--border-subtle) font-mono">
              <p className="text-[10px] uppercase text-(--text-secondary) mb-1">
                Shareable Invite Link:
              </p>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  readOnly
                  value={generatedInviteLink}
                  className="w-full bg-(--bg-surface) border border-(--border-subtle) rounded px-2 py-1 text-[10px] text-(--text-muted) select-all"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedInviteLink);
                    alert("Invite link copied!");
                  }}
                >
                  Copy
                </Button>
              </div>
            </div>
          )}
        </form>

        {/* Public Access Toggle */}
        {isOwner && (
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-(--bg-surface-elevated) border border-(--border-subtle) mb-4">
            <div className="flex items-center gap-2">
              {isPublic ? (
                <Globe className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-(--text-muted)" />
              )}
              <div>
                <p className="text-xs font-medium text-(--text-primary)">
                  {isPublic ? "Public Access Enabled" : "Private Workspace"}
                </p>
                <p className="text-[10px] text-(--text-muted) font-mono">
                  {isPublic ? "Link viewable by anyone" : "Restricted to invited members"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleTogglePublic}
              className={`px-2 py-0.5 rounded text-[11px] font-mono border transition-colors ${
                isPublic
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                  : "border-(--border-subtle) text-(--text-secondary) hover:bg-(--border-subtle)"
              }`}
            >
              {isPublic ? "Make Private" : "Enable Public"}
            </button>
          </div>
        )}

        {/* Collaborators List */}
        <div className="border-t border-(--border-subtle) pt-3">
          <span className="text-[10px] font-mono uppercase text-(--text-muted) block mb-2">
            Active Collaborators
          </span>

          {loading ? (
            <p className="text-xs text-(--text-muted) py-2 font-mono">Loading members...</p>
          ) : (
            <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 font-mono">
              {/* Owner */}
              {owner && (
                <div className="flex items-center justify-between py-1 px-2 rounded bg-(--bg-surface-elevated)/50">
                  <div className="flex items-center gap-2">
                    <div className="w-4.5 h-4.5 rounded bg-(--accent-primary) text-white text-[9px] font-bold flex items-center justify-center uppercase">
                      {owner.username?.slice(0, 1)}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-(--text-primary)">
                        {owner.name || owner.username}
                      </p>
                      <p className="text-[9px] text-(--text-muted)">{owner.email}</p>
                    </div>
                  </div>
                  <span className="text-[9px] uppercase px-1.5 py-0.2 rounded border border-violet-500/30 text-violet-500">
                    Owner
                  </span>
                </div>
              )}

              {/* Collaborators */}
              {collaborators.map((c, idx) => {
                const cUser = c.user || {};
                const cId = cUser._id || cUser.id;
                return (
                  <div
                    key={cId || idx}
                    className="flex items-center justify-between py-1 px-2 rounded hover:bg-(--bg-surface-elevated) transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-4.5 h-4.5 rounded bg-slate-600 text-white text-[9px] font-bold flex items-center justify-center uppercase">
                        {cUser.username?.slice(0, 1) || "U"}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-(--text-primary)">
                          {cUser.name || cUser.username}
                        </p>
                        <p className="text-[9px] text-(--text-muted)">{cUser.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] uppercase px-1.5 py-0.2 rounded border border-(--border-subtle) text-(--text-secondary)">
                        {c.role}
                      </span>
                      {isOwner && (
                        <button
                          onClick={() => handleRemoveCollaborator(cId)}
                          className="p-1 text-(--text-muted) hover:text-rose-500 rounded"
                          title="Remove collaborator"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Pending Invites */}
              {pendingInvites.map((inv) => (
                <div
                  key={inv.id || inv.token}
                  className="flex items-center justify-between py-1 px-2 rounded bg-amber-500/5 border border-amber-500/10 text-[10px]"
                >
                  <div>
                    <p className="text-[11px] text-(--text-primary)">{inv.email}</p>
                    <p className="text-[9px] text-amber-500">Invited ({inv.role})</p>
                  </div>
                  <button
                    onClick={() => {
                      const url = `${window.location.origin}/invite/${inv.token}`;
                      navigator.clipboard.writeText(url);
                      alert("Invite URL copied!");
                    }}
                    className="text-[10px] text-(--accent-primary) hover:underline"
                  >
                    Copy
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-2.5 border-t border-(--border-subtle) flex items-center justify-between font-mono">
          <button
            type="button"
            onClick={copyDrawingLink}
            className="flex items-center gap-1 text-xs text-(--text-secondary) hover:text-(--text-primary)"
          >
            {copiedLink ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
            <span>{copiedLink ? "Link copied!" : "Copy URL"}</span>
          </button>

          <Button variant="ghost" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
};
export default ShareModal;
