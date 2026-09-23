"use client";

import {
  clearSession,
  homePathForRole,
  readSession,
  writeSession,
  type AuthRole,
  type AuthSession,
} from "@/lib/auth";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type AuthContextValue = {
  session: AuthSession | null;
  ready: boolean;
  login: (role: AuthRole, name: string, phone: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSession(readSession());
    setReady(true);
  }, []);

  const login = useCallback((role: AuthRole, name: string, phone: string) => {
    const next: AuthSession = {
      role,
      name: name.trim() || (role === "owner" ? "Pump owner" : "Rentee"),
      phone: phone.trim(),
      loggedInAt: new Date().toISOString(),
    };
    writeSession(next);
    setSession(next);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({ session, ready, login, logout }),
    [session, ready, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}

export function useAuthHomePath(): string {
  const { session } = useAuth();
  if (!session) return "/login";
  return homePathForRole(session.role);
}
