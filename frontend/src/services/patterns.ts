import { apiRequest } from "@/services/api";
import type { PaginatedPatterns, Pattern, PatternPayload } from "@/types/pattern";

export function listPatterns(params = { limit: 20, offset: 0 }) {
  return apiRequest<PaginatedPatterns>(`/patterns?limit=${params.limit}&offset=${params.offset}`);
}

export function searchPatterns(query: string, params = { limit: 20, offset: 0 }) {
  const search = new URLSearchParams({
    q: query,
    limit: String(params.limit),
    offset: String(params.offset),
  });
  return apiRequest<PaginatedPatterns>(`/patterns/search?${search.toString()}`);
}

export function getPattern(id: string) {
  return apiRequest<Pattern>(`/patterns/${id}`);
}

export function createPattern(payload: PatternPayload) {
  return apiRequest<Pattern>("/patterns", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updatePattern(id: string, payload: Partial<PatternPayload>) {
  return apiRequest<Pattern>(`/patterns/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deletePattern(id: string) {
  return apiRequest<void>(`/patterns/${id}`, { method: "DELETE" });
}
