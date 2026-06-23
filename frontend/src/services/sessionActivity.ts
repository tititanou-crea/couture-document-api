import { decodeJwtPayload } from "@/utils/jwt";

export const SESSION_IDLE_TIMEOUT_MS = 3 * 60 * 60 * 1000;
export const SESSION_ACTIVITY_KEY = "bibliocouture_last_activity";

export function initializeSessionActivity(token: string) {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(SESSION_ACTIVITY_KEY)) return;

  try {
    const payload = decodeJwtPayload<{ iat?: number }>(token);
    const initialActivity = payload.iat ? payload.iat * 1000 : Date.now();
    window.localStorage.setItem(SESSION_ACTIVITY_KEY, String(initialActivity));
  } catch {
    markSessionActivity();
  }
}

export function markSessionActivity(now = Date.now()) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_ACTIVITY_KEY, String(now));
}

export function clearSessionActivity() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_ACTIVITY_KEY);
}

export function isSessionIdle(now = Date.now()) {
  if (typeof window === "undefined") return false;
  const storedValue = window.localStorage.getItem(SESSION_ACTIVITY_KEY);
  if (!storedValue) return true;

  const lastActivity = Number(storedValue);
  return !Number.isFinite(lastActivity) || now - lastActivity >= SESSION_IDLE_TIMEOUT_MS;
}
