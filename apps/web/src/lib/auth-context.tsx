"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  clearAuthTokens,
  completeInstructorOnboardingRequest,
  getAccessToken,
  getApiErrorMessage,
  getRefreshToken,
  loginRequest,
  logoutRequest,
  meRequest,
  registerRequest,
  setAuthTokens,
  type AuthUser,
} from "@/lib/api";

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  /** Always false once demo login fallbacks were removed. Kept for shell UI. */
  usingDemo: boolean;
  onboardingCompleted: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (input: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
  }) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function portalPathForRole(role: string) {
  if (role === "Instructor") return "/instructor/dashboard";
  if (role === "Academic") return "/academic/dashboard";
  if (role === "Admin") return "/admin/dashboard";
  if (role === "Super Admin" || role === "SuperAdmin") {
    return "/super-admin/dashboard";
  }
  if (role === "Finance") return "/finance/dashboard";
  if (role === "Research" || role === "Researcher") return "/research/dashboard";
  return "/student/dashboard";
}

function applyOnboarding(user: AuthUser) {
  if (user.role === "Instructor") {
    if (typeof user.onboardingCompleted === "boolean") {
      return user.onboardingCompleted;
    }
    return localStorage.getItem(`qa_onboarding_${user._id}`) === "done";
  }
  return true;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState(true);

  const refresh = useCallback(async () => {
    const token = getAccessToken();
    if (!token || token.startsWith("demo")) {
      if (token?.startsWith("demo")) clearAuthTokens();
      setUser(null);
      setOnboardingCompleted(true);
      setLoading(false);
      return;
    }
    try {
      const me = await Promise.race([
        meRequest(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Auth timeout")), 12_000),
        ),
      ]);
      setUser(me);
      setOnboardingCompleted(applyOnboarding(me));
    } catch {
      clearAuthTokens();
      setUser(null);
      setOnboardingCompleted(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const data = await loginRequest(email, password);
      setAuthTokens(data.accessToken, data.refreshToken);
      setUser(data.user);
      setOnboardingCompleted(applyOnboarding(data.user));
      return data.user;
    } catch (err) {
      throw new Error(getApiErrorMessage(err, "Login failed"));
    }
  }, []);

  const register = useCallback(
    async (input: {
      email: string;
      password: string;
      fullName: string;
      phone?: string;
    }) => {
      try {
        const data = await registerRequest(input);
        setAuthTokens(data.accessToken, data.refreshToken);
        setUser(data.user);
        setOnboardingCompleted(applyOnboarding(data.user));
        return data.user;
      } catch (err) {
        throw new Error(getApiErrorMessage(err, "Registration failed"));
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken();
    if (refreshToken && !refreshToken.startsWith("demo")) {
      try {
        await logoutRequest(refreshToken);
      } catch {
        // Still clear local session if revoke fails
      }
    }
    clearAuthTokens();
    setUser(null);
    setOnboardingCompleted(true);
  }, []);

  const completeOnboarding = useCallback(async () => {
    if (!user?._id) return;
    try {
      if (user.role === "Instructor") {
        const updated = await completeInstructorOnboardingRequest();
        setUser(updated);
        setOnboardingCompleted(true);
        localStorage.setItem(`qa_onboarding_${user._id}`, "done");
        return;
      }
    } catch {
      // fall through to local mark so UI is not stuck
    }
    localStorage.setItem(`qa_onboarding_${user._id}`, "done");
    setOnboardingCompleted(true);
  }, [user?._id, user?.role]);

  const value = useMemo(
    () => ({
      user,
      loading,
      usingDemo: false,
      onboardingCompleted,
      login,
      register,
      logout,
      refresh,
      completeOnboarding,
    }),
    [
      user,
      loading,
      onboardingCompleted,
      login,
      register,
      logout,
      refresh,
      completeOnboarding,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
