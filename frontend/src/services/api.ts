import { decodeJwtPayload } from "@/utils/jwt";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  (process.env.NODE_ENV === "development" ? "http://localhost:8000/api/v1" : "");
export const API_ORIGIN = API_URL.replace(/\/api\/v\d+\/?$/, "");
export const TOKEN_COOKIE = "bibliocouture_token";

export function getToken() {
  if (typeof window === "undefined") return null;
  const cookie = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${TOKEN_COOKIE}=`));
  return cookie ? decodeURIComponent(cookie.split("=")[1]) : null;
}

export function setToken(token: string) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  const maxAge = getTokenMaxAge(token);
  document.cookie = `${TOKEN_COOKIE}=${encodeURIComponent(token)}; Path=/; SameSite=Strict; Max-Age=${maxAge}${secure}`;
}

export function clearToken() {
  document.cookie = `${TOKEN_COOKIE}=; Path=/; SameSite=Strict; Max-Age=0`;
}

type RequestOptions = RequestInit & {
  auth?: boolean;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  if (!API_URL) {
    throw new Error(
      "Connexion impossible à l'API. La variable NEXT_PUBLIC_API_URL doit être configurée sur le site déployé."
    );
  }

  const headers = new Headers(options.headers);
  const token = getToken();

  if (
    !headers.has("Content-Type") &&
    options.body &&
    !(options.body instanceof Blob) &&
    !(options.body instanceof FormData)
  ) {
    headers.set("Content-Type", "application/json");
  }
  if (options.auth !== false && token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error(
      "Connexion impossible à l'API déployée. Vérifiez l'URL NEXT_PUBLIC_API_URL et les origines CORS autorisées."
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  const body = text ? safeJsonParse(text) : null;

  if (!response.ok) {
    if (response.status === 401) {
      clearToken();
    }
    const detail = body?.detail ?? body?.message ?? "Une erreur est survenue. Merci de réessayer.";
    throw new Error(Array.isArray(detail) ? "Certaines informations sont à vérifier." : detail);
  }

  return body as T;
}

function safeJsonParse(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

function getTokenMaxAge(token: string) {
  try {
    const payload = decodeJwtPayload<{ exp?: number }>(token);
    if (!payload.exp) return 60 * 60;
    return Math.max(0, Math.floor(payload.exp - Date.now() / 1000));
  } catch {
    return 60 * 60;
  }
}
