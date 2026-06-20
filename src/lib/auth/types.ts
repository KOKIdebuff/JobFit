export type UserRole = "candidate" | "hr";

export type AuthUser = {
  id: string;
  email: string;
  username: string;
  display_name: string;
  role: UserRole;
  organization_id: string | null;
  organization_name: string | null;
  created_at: string;
};

export type AuthSession = {
  user: AuthUser;
};

export type LoginPayload = {
  identifier: string;
  password: string;
};

export type RegisterPayload = {
  email: string;
  username: string;
  password: string;
  display_name: string;
  role: UserRole;
  organization_name?: string | null;
};
