"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
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
import { authLoginHref } from "@/lib/auth-routes";

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

function normalizeRole(role: string) {
  if (role === "SuperAdmin") return "Super Admin";
  if (role === "Researcher") return "Research";
  return role;
}

function roleAllowed(userRole: string, allowed: string[]) {
  const normalized = normalizeRole(userRole);
  return allowed.some((r) => normalizeRole(r) === normalized);
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
  /** Bumps to invalidate in-flight /me refresh after login/register/logout. */
  const authEpochRef = useRef(0);

  const refresh = useCallback(async () => {
    const epoch = ++authEpochRef.current;
    const tokenAtStart = getAccessToken();
    if (!tokenAtStart || tokenAtStart.startsWith("demo")) {
      if (tokenAtStart?.startsWith("demo")) clearAuthTokens();
      if (epoch !== authEpochRef.current) return;
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
      if (epoch !== authEpochRef.current) return;
      setUser(me);
      setOnboardingCompleted(applyOnboarding(me));
    } catch {
      if (epoch !== authEpochRef.current) return;
      // Only clear if this request still owns the session (avoids wiping a newer login).
      if (getAccessToken() === tokenAtStart) {
        clearAuthTokens();
        setUser(null);
        setOnboardingCompleted(true);
      }
    } finally {
      if (epoch === authEpochRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const data = await loginRequest(email, password);
      // Invalidate any in-flight /me so a stale failure cannot wipe this session.
      authEpochRef.current += 1;
      setAuthTokens(data.accessToken, data.refreshToken);
      setUser(data.user);
      setOnboardingCompleted(applyOnboarding(data.user));
      setLoading(false);
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
        authEpochRef.current += 1;
        setAuthTokens(data.accessToken, data.refreshToken);
        setUser(data.user);
        setOnboardingCompleted(applyOnboarding(data.user));
        setLoading(false);
        return data.user;
      } catch (err) {
        throw new Error(getApiErrorMessage(err, "Registration failed"));
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    authEpochRef.current += 1;
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
    setLoading(false);
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

/**
 * Gate portal shells: wait for auth, then allow only matching roles.
 * Unauthenticated → login (with return path). Wrong role → that role's portal.
 */
export function useRequireAuth(allowedRoles: string | string[]) {
  const allowed = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  const { user, loading, logout, usingDemo, onboardingCompleted } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const authorized = !!user && roleAllowed(user.role, allowed);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(authLoginHref(pathname || "/"));
      return;
    }
    if (!authorized) {
      router.replace(portalPathForRole(user.role));
    }
  }, [loading, user, authorized, router, pathname]);

  return {
    user: authorized ? user : null,
    /** True until session is known and role matches (includes redirect wait). */
    loading: loading || !authorized,
    ready: !loading && authorized,
    logout,
    usingDemo,
    onboardingCompleted,
  };
}
