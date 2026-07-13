import { decodeJwtPayload } from "@/utils/jwt";

const RAW_API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  (process.env.NODE_ENV === "development" ? "http://localhost:8000/api/v1" : "");
export const API_URL = normalizeApiUrl(RAW_API_URL);
export const API_ORIGIN = API_URL.replace(/\/api\/v\d+\/?$/, "");
export const TOKEN_COOKIE = "bibliocouture_token";
const GET_CACHE_TTL_MS = 15_000;
const DEFAULT_TIMEOUT_MS = 25_000;
const responseCache = new Map<string, { expiresAt: number; value: unknown }>();
const pendingRequests = new Map<string, Promise<unknown>>();

export function getToken() {
  if (typeof window === "undefined") return null;
  const cookie = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${TOKEN_COOKIE}=`));
  return cookie ? decodeURIComponent(cookie.split("=")[1]) : null;
}

export function setToken(token: string) {
  clearRequestCache();
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  const maxAge = getTokenMaxAge(token);
  document.cookie = `${TOKEN_COOKIE}=${encodeURIComponent(token)}; Path=/; SameSite=Strict; Max-Age=${maxAge}${secure}`;
}

export function clearToken() {
  clearRequestCache();
  document.cookie = `${TOKEN_COOKIE}=; Path=/; SameSite=Strict; Max-Age=0`;
}

type RequestOptions = RequestInit & {
  auth?: boolean;
  timeoutMs?: number;
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

  const method = (options.method ?? "GET").toUpperCase();
  const cacheKey = method === "GET" ? `${token ?? "anonymous"}:${path}` : null;
  if (cacheKey) {
    const cached = responseCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value as T;
    }
    responseCache.delete(cacheKey);

    const pending = pendingRequests.get(cacheKey);
    if (pending) {
      return pending as Promise<T>;
    }
  } else {
    clearRequestCache();
  }

  const request = performRequest<T>(path, options, headers);
  if (cacheKey) {
    pendingRequests.set(cacheKey, request);
  }

  try {
    const result = await request;
    if (cacheKey) {
      responseCache.set(cacheKey, {
        expiresAt: Date.now() + GET_CACHE_TTL_MS,
        value: result,
      });
    }
    return result;
  } finally {
    if (cacheKey) {
      pendingRequests.delete(cacheKey);
    }
  }
}

async function performRequest<T>(
  path: string,
  options: RequestOptions,
  headers: Headers,
): Promise<T> {
  let response: Response;
  const { auth: _auth, signal, timeoutMs = DEFAULT_TIMEOUT_MS, ...fetchOptions } = options;
  const controller = new AbortController();
  const abortRequest = () => controller.abort();
  if (signal?.aborted) {
    abortRequest();
  } else {
    signal?.addEventListener("abort", abortRequest, { once: true });
  }
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...fetchOptions,
      headers,
      signal: controller.signal,
    });
  } catch (error) {
    if (isAbortError(error)) {
      throw new Error(
        "Le serveur met trop longtemps à répondre. Il est peut-être en train de se réveiller : réessayez dans quelques instants."
      );
    }
    throw new Error(
      "Connexion impossible à l'API déployée. Vérifiez l'URL NEXT_PUBLIC_API_URL et les origines CORS autorisées."
    );
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", abortRequest);
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
    throw new Error(formatApiErrorDetail(detail));
  }

  return body as T;
}

function clearRequestCache() {
  responseCache.clear();
  pendingRequests.clear();
}

function safeJsonParse(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

type ApiValidationError = {
  loc?: Array<string | number>;
  msg?: string;
};

function formatApiErrorDetail(detail: unknown) {
  if (!Array.isArray(detail)) {
    return typeof detail === "string" ? detail : "Une erreur est survenue. Merci de réessayer.";
  }

  const messages = detail
    .map((item) => {
      if (!isValidationError(item)) return null;
      const field = formatErrorLocation(item.loc);
      return field ? `${field} : ${item.msg}` : item.msg;
    })
    .filter(Boolean);

  return messages.length
    ? `Informations à vérifier : ${messages.join(" ; ")}`
    : "Certaines informations sont à vérifier.";
}

function isValidationError(value: unknown): value is ApiValidationError {
  return Boolean(
    value &&
      typeof value === "object" &&
      "msg" in value &&
      typeof (value as ApiValidationError).msg === "string"
  );
}

function formatErrorLocation(location: ApiValidationError["loc"]) {
  if (!location?.length) return "";
  const visibleParts = location.filter((part) => part !== "body");
  return visibleParts.map(formatErrorLocationPart).join(" > ");
}

function formatErrorLocationPart(part: string | number) {
  if (typeof part === "number") return String(part + 1);
  return fieldLabels[part] ?? part;
}

const fieldLabels: Record<string, string> = {
  available_size_ranges: "intervalles de tailles",
  available_sizes: "tailles",
  cover_url: "photo principale",
  description: "description",
  designer_name: "créateur / éditeur",
  ean: "EAN",
  format: "format",
  isbn: "ISBN",
  magazine_patterns: "patrons du magazine",
  measurement_chart_url: "tableau des mensurations",
  model_name: "nom du modèle",
  page_count: "nombre de pages",
  pattern_sheet_second_url: "deuxième photo de planche",
  pattern_sheet_url: "photo de planche",
  published_date: "année de publication",
  second_cover_url: "deuxième photo",
  title: "titre",
};

function isAbortError(error: unknown) {
  return (
    error instanceof DOMException && error.name === "AbortError"
  ) || (
    error instanceof Error && error.name === "AbortError"
  );
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

function normalizeApiUrl(value: string) {
  const trimmed = value.trim().replace(/\/+$/, "");
  if (!trimmed) return "";

  try {
    const url = new URL(trimmed);
    if (
      typeof window !== "undefined" &&
      window.location.hostname.endsWith(".vercel.app") &&
      url.hostname.endsWith(".onrender.com")
    ) {
      return "/api/v1";
    }
    if (url.hostname.endsWith(".onrender.com") && url.protocol === "http:") {
      url.protocol = "https:";
    }
    if (!/\/api\/v\d+$/.test(url.pathname)) {
      url.pathname = `${url.pathname.replace(/\/+$/, "")}/api/v1`;
    }
    return url.toString().replace(/\/+$/, "");
  } catch {
    return trimmed;
  }
}
