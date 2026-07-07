import { apiRequest } from "@/services/api";
import type { Volunteer, VolunteerPayload } from "@/types/auth";

export function listUsers() {
  return apiRequest<Volunteer[]>("/users");
}

export function createUser(payload: Required<VolunteerPayload>) {
  return apiRequest<Volunteer>("/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateUser(id: string, payload: VolunteerPayload) {
  return apiRequest<Volunteer>(`/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function resetUserPassword(id: string, password: string) {
  return apiRequest<Volunteer>(`/users/${id}/password`, {
    method: "POST",
    body: JSON.stringify({ password }),
  });
}
