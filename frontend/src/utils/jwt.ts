import type { SessionUser } from "@/types/auth";

type JwtPayload = {
  sub?: string;
  role?: SessionUser["role"];
  exp?: number;
  email?: string;
  first_name?: string;
  last_name?: string;
};

export function readJwt(token: string): SessionUser | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1])) as JwtPayload;
    if (!payload.sub || !payload.role) {
      return null;
    }
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      return null;
    }
    return {
      id: payload.sub,
      role: payload.role,
      email: payload.email,
      first_name: payload.first_name,
      last_name: payload.last_name,
    };
  } catch {
    return null;
  }
}
