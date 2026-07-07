import { apiRequest, clearToken, setToken } from "@/services/api";
import type { LoginPayload, TokenResponse } from "@/types/auth";

export async function login(payload: LoginPayload) {
  const response = await apiRequest<TokenResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
    auth: false,
  });
  setToken(response.access_token);
  return response;
}

export function getCurrentUser() {
  return apiRequest<TokenResponse["user"]>("/auth/me");
}

export async function refreshSession() {
  const response = await apiRequest<TokenResponse>("/auth/refresh", {
    method: "POST",
  });
  setToken(response.access_token);
  return response;
}

export async function forgotPassword(email: string) {
  return apiRequest<{ message?: string }>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
    auth: false,
  });
}

export async function resetPassword(token: string, password: string) {
  return apiRequest<{ message?: string }>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, password }),
    auth: false,
  });
}

export async function changePassword(currentPassword: string, newPassword: string) {
  return apiRequest<{ message?: string }>("/auth/change-password", {
    method: "POST",
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
    }),
  });
}

export function logout() {
  clearToken();
}
