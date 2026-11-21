import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";

// Lazy-loaded hero section / landing page
const LandingPage = lazy(() => import("./Pages/LandingPage"));

// Static page imports
import Login from "./Pages/Login";
import Signup from "./Pages/Signup";
import Dashboard from "./Pages/Dashboard";
import CanvasEditor from "./Pages/CanvasEditor";
import InviteAccept from "./Pages/InviteAccept";
import Terms from "./Pages/Terms";
import Privacy from "./Pages/Privacy";
import Profile from "./Pages/Profile";
import AuthCallback from "./Pages/AuthCallback";

// Fallback spinner while hero/landing loads
const PageLoader: React.FC = () => (
  <div className="min-h-screen bg-(--bg-main) flex items-center justify-center">
    <div className="w-8 h-8 rounded-full border-2 border-(--accent-primary) border-t-transparent animate-spin" />
  </div>
);

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={
                <Suspense fallback={<PageLoader />}>
                  <LandingPage />
                </Suspense>
              }
            />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/auth/callback" element={<AuthCallback />} />

            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/canvas/:id"
              element={
                <ProtectedRoute>
                  <CanvasEditor />
                </ProtectedRoute>
              }
            />

            <Route
              path="/invite/:token"
              element={
                <ProtectedRoute>
                  <InviteAccept />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
