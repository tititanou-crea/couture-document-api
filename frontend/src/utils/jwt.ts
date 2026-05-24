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
    const payload = decodeJwtPayload<JwtPayload>(token);
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

export function decodeJwtPayload<T>(token: string): T {
  const payload = token.split(".")[1];
  const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  return JSON.parse(atob(padded)) as T;
}
