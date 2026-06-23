import { useRouter } from "next/router";
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
import { clearToken, getToken } from "@/services/api";
import {
  getCurrentUser,
  login as loginService,
  logout as logoutService,
  refreshSession,
} from "@/services/auth";
import {
  clearSessionActivity,
  initializeSessionActivity,
  isSessionIdle,
  markSessionActivity,
  SESSION_ACTIVITY_KEY,
} from "@/services/sessionActivity";
import { readJwt } from "@/utils/jwt";
import type { LoginPayload, SessionUser } from "@/types/auth";

type AuthContextValue = {
  user: SessionUser | null;
  loading: boolean;
  isAdmin: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const lastRefreshAt = useRef(0);

  const refreshUser = useCallback(async () => {
    const token = getToken();
    if (token) {
      initializeSessionActivity(token);
    }
    if (!token || isSessionIdle()) {
      clearToken();
      clearSessionActivity();
      setUser(null);
      return;
    }

    const session = token ? readJwt(token) : null;
    setUser(session);

    if (!session) {
      return;
    }

    try {
      const currentUser = await getCurrentUser();
      setUser({
        id: currentUser.id,
        role: currentUser.role,
        email: currentUser.email,
        first_name: currentUser.first_name,
        last_name: currentUser.last_name,
      });
    } catch {
      logoutService();
      clearSessionActivity();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  const login = useCallback(async (payload: LoginPayload) => {
    const response = await loginService(payload);
    markSessionActivity();
    lastRefreshAt.current = Date.now();
    setUser({
      id: response.user.id,
      role: response.user.role,
      email: response.user.email,
      first_name: response.user.first_name,
      last_name: response.user.last_name,
    });
  }, []);

  const logout = useCallback(() => {
    logoutService();
    clearSessionActivity();
    setUser(null);
    router.replace("/login");
  }, [router]);

  useEffect(() => {
    if (!user) return;

    const refreshDelayMs = 5 * 60 * 1000;

    const renewActiveSession = async () => {
      if (isSessionIdle()) {
        logout();
        return;
      }
      if (Date.now() - lastRefreshAt.current < refreshDelayMs) return;

      lastRefreshAt.current = Date.now();
      try {
        await refreshSession();
      } catch {
        logout();
      }
    };

    const handleActivity = () => {
      if (isSessionIdle()) {
        logout();
        return;
      }
      markSessionActivity();
      void renewActiveSession();
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        handleActivity();
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === SESSION_ACTIVITY_KEY && !event.newValue) {
        logout();
      }
    };

    const events: Array<keyof WindowEventMap> = [
      "pointerdown",
      "keydown",
      "touchstart",
      "scroll",
    ];
    events.forEach((eventName) =>
      window.addEventListener(eventName, handleActivity, { passive: true }),
    );
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("storage", handleStorage);

    const idleCheck = window.setInterval(() => {
      if (isSessionIdle()) {
        logout();
      }
    }, 30_000);

    return () => {
      events.forEach((eventName) => window.removeEventListener(eventName, handleActivity));
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("storage", handleStorage);
      window.clearInterval(idleCheck);
    };
  }, [logout, user]);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAdmin: user?.role === "admin",
      login,
      logout,
      refreshUser,
    }),
    [loading, login, logout, refreshUser, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit etre utilise dans AuthProvider");
  }
  return context;
}
