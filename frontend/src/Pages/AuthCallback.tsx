import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api, setAuthToken } from "../services/api";

export const AuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const status = "Completing authentication...";

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      navigate("/login?error=oauth_missing_token");
      return;
    }

    async function finishAuth() {
      try {
        setAuthToken(token!);
        const res = await api.getMe();
        if (res.user) {
          updateUser(res.user);
        }
        navigate("/dashboard");
      } catch (err) {
        console.error("Auth callback verification error:", err);
        navigate("/login?error=oauth_verification_failed");
      }
    }

    finishAuth();
  }, [searchParams, navigate, updateUser]);

  return (
    <div className="min-h-screen bg-(--bg-main) text-(--text-primary) flex flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-(--accent-primary) border-t-transparent animate-spin" />
        <span className="text-xs font-mono text-(--text-muted)">{status}</span>
      </div>
    </div>
  );
};

export default AuthCallback;
