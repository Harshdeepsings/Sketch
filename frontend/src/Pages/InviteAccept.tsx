import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Navbar } from "../Components/Navbar";

export const InviteAccept: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      // User must be logged in to accept an invitation
      navigate(`/login?redirect=/invite/${token}`);
      return;
    }

    async function accept() {
      try {
        const res = await api.acceptInvitation(token!);
        setStatus("success");
        setTimeout(() => {
          navigate(`/canvas/${res.drawingId}`);
        }, 1500);
      } catch (err: any) {
        setStatus("error");
        setErrorMessage(err.message || "Invitation is invalid or has expired.");
      }
    }

    accept();
  }, [token, user, authLoading, navigate]);

  return (
    <div className="min-h-screen bg-(--bg-main) text-(--text-primary) flex flex-col transition-colors">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full p-8 rounded-3xl bg-(--bg-surface) border border-(--border-strong) shadow-2xl backdrop-blur-xl">
          {status === "processing" && (
            <div>
              <div className="w-10 h-10 rounded-full border-2 border-violet-500 border-t-transparent animate-spin mx-auto mb-4" />
              <h2 className="text-lg font-bold text-(--text-primary)">Accepting Invitation...</h2>
              <p className="text-xs text-(--text-muted) mt-1">Connecting to workspace...</p>
            </div>
          )}

          {status === "success" && (
            <div>
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-4">
                ✓
              </div>
              <h2 className="text-lg font-bold text-(--text-primary)">Invitation Accepted!</h2>
              <p className="text-xs text-(--text-muted) mt-1">Redirecting to collaborative canvas...</p>
            </div>
          )}

          {status === "error" && (
            <div>
              <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto mb-4">
                ✕
              </div>
              <h2 className="text-lg font-bold text-(--text-primary)">Invitation Error</h2>
              <p className="text-xs text-rose-400 mt-1 mb-6">{errorMessage}</p>
              <button
                onClick={() => navigate("/dashboard")}
                className="px-5 py-2.5 rounded-full bg-(--accent-primary) text-white text-xs font-semibold"
              >
                Go to Dashboard
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
export default InviteAccept;
