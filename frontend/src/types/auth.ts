export type UserRole = "admin" | "volunteer";

export type SessionUser = {
  id: string;
  role: UserRole;
  email?: string;
  first_name?: string;
  last_name?: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type TokenResponse = {
  access_token: string;
  token_type: "bearer";
  user: Volunteer;
};

export type Volunteer = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
};

export type VolunteerPayload = {
  first_name: string;
  last_name: string;
  email: string;
  password?: string;
  role: UserRole;
};
