import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, Compass, Lock, Mail, User, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Navbar } from "../Components/Navbar";
import { Button } from "../Components/UI/Button";
import { SketchParticles } from "../Components/UI/SketchParticles";

export const Signup: React.FC = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !email.trim() || !password) {
      setError("Please fill in all required fields");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await signup({
        username: username.trim(),
        email: email.trim(),
        name: name.trim() || undefined,
        password,
      });
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-(--bg-main) text-(--text-primary) flex flex-col relative transition-colors selection:bg-(--accent-primary) selection:text-white">
      {/* Floating drafting particles */}
      <SketchParticles />

      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 relative z-10">
        {/* Architect Registration Sheet */}
        <div className="w-full max-w-md rounded-2xl bg-(--bg-surface) border-2 border-(--border-strong) shadow-2xl p-8 relative">
          {/* Corner Drafting Tape */}
          <div className="drafting-tape-tl" />
          <div className="drafting-tape-tr" />

          {/* Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-10 h-10 rounded-lg bg-(--bg-surface-elevated) border border-(--border-subtle) text-(--accent-primary) flex items-center justify-center font-bold mb-3 shadow-sm">
              <Compass className="w-5 h-5" />
            </div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-(--accent-primary) font-bold mb-1">
              GET STARTED FREE
            </div>
            <h1 className="text-3xl font-bold font-pencil tracking-tight text-(--text-primary)">
              Create your Sketchh account
            </h1>
            <p className="text-xs text-(--text-muted) mt-1">
              Free real-time whiteboarding for you and your team
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-mono">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-xs font-semibold text-(--text-secondary) mb-1 flex items-center gap-1.5 font-mono">
                <User className="w-3.5 h-3.5 text-(--accent-primary)" />
                <span>USERNAME *</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="alexm"
                required
                className="w-full px-3.5 py-2 bg-(--bg-surface-elevated) border border-(--border-strong) rounded-lg text-xs text-(--text-primary) placeholder-(--text-muted) focus:outline-none focus:border-(--accent-primary) transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-(--text-secondary) mb-1 flex items-center gap-1.5 font-mono">
                <Mail className="w-3.5 h-3.5 text-(--accent-primary)" />
                <span>EMAIL ADDRESS *</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-3.5 py-2 bg-(--bg-surface-elevated) border border-(--border-strong) rounded-lg text-xs text-(--text-primary) placeholder-(--text-muted) focus:outline-none focus:border-(--accent-primary) transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-(--text-secondary) mb-1 flex items-center gap-1.5 font-mono">
                <ShieldCheck className="w-3.5 h-3.5 text-(--accent-primary)" />
                <span>YOUR NAME (OPTIONAL)</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Morgan"
                className="w-full px-3.5 py-2 bg-(--bg-surface-elevated) border border-(--border-strong) rounded-lg text-xs text-(--text-primary) placeholder-(--text-muted) focus:outline-none focus:border-(--accent-primary) transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-(--text-secondary) mb-1 flex items-center gap-1.5 font-mono">
                <Lock className="w-3.5 h-3.5 text-(--accent-primary)" />
                <span>PASSWORD * (MIN 6 CHARACTERS)</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-3.5 py-2 bg-(--bg-surface-elevated) border border-(--border-strong) rounded-lg text-xs text-(--text-primary) placeholder-(--text-muted) focus:outline-none focus:border-(--accent-primary) transition-colors pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-(--text-muted) hover:text-(--text-primary) transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full mt-3 font-semibold"
              endIcon={<ArrowRight className="w-4 h-4" />}
            >
              Create Account
            </Button>

            {/* Divider */}
            <div className="relative my-4 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-(--border-subtle)" />
              </div>
              <div className="relative bg-(--bg-surface) px-3 text-[10px] font-mono uppercase text-(--text-muted)">
                Or sign up with
              </div>
            </div>

            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={() => {
                window.location.href = "http://localhost:5000/api/v1/auth/google";
              }}
              className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl border border-(--border-strong) bg-(--bg-surface-elevated) hover:bg-(--border-subtle) text-(--text-primary) font-semibold text-xs transition-colors shadow-sm cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Sign up with Google</span>
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-(--border-subtle) text-center text-xs text-(--text-muted)">
            <span>Already have an account? </span>
            <Link
              to="/login"
              className="font-bold text-(--accent-primary) hover:underline ml-1"
            >
              Log in here
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};
export default Signup;
