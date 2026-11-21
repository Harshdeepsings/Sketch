import React, { createContext, useContext, useState, useEffect } from "react";
import { api, getAuthToken, setAuthToken, removeAuthToken } from "../services/api";

export interface User {
  id: string;
  username: string;
  email: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (credentials: { username?: string; email?: string; password: string }) => Promise<void>;
  signup: (payload: { username: string; email: string; password: string; name?: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  login: async () => {},
  signup: async () => {},
  logout: async () => {},
  updateUser: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getAuthToken());
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadUser() {
      const storedToken = getAuthToken();
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.getMe();
        if (res.user) {
          setUser(res.user);
        } else {
          removeAuthToken();
          setToken(null);
        }
      } catch {
        console.warn("Session check failed, clearing token");
        removeAuthToken();
        setToken(null);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  const login = async (credentials: { username?: string; email?: string; password: string }) => {
    const res = await api.login(credentials);
    if (res.accessToken && res.user) {
      setAuthToken(res.accessToken);
      setToken(res.accessToken);
      setUser(res.user);
    }
  };

  const signup = async (payload: { username: string; email: string; password: string; name?: string }) => {
    const res = await api.signup(payload);
    if (res.accessToken && res.user) {
      setAuthToken(res.accessToken);
      setToken(res.accessToken);
      setUser(res.user);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // Ignore network errors on logout
    }
    removeAuthToken();
    setToken(null);
    setUser(null);
  };

  const updateUser = (updates: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : null));
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
