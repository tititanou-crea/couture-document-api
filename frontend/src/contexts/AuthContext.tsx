import { useRouter } from "next/router";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getToken } from "@/services/api";
import { getCurrentUser, login as loginService, logout as logoutService } from "@/services/auth";
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

  const refreshUser = useCallback(async () => {
    const token = getToken();
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
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  const login = useCallback(async (payload: LoginPayload) => {
    const response = await loginService(payload);
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
    setUser(null);
    router.replace("/login");
  }, [router]);

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
