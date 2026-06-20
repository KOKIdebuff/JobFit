import { apiRequest } from "@/lib/api/client";
import type { AuthSession, LoginPayload, RegisterPayload } from "@/lib/auth/types";

export const DEMO_PASSWORD = "HireLinkDemo2026!";
export const DEMO_ACCOUNTS = {
  hr: {
    label: "HR 账号",
    identifier: "hr.demo@hirelink.local",
    password: DEMO_PASSWORD,
  },
  candidate: {
    label: "求职者账号",
    identifier: "candidate.demo@hirelink.local",
    password: DEMO_PASSWORD,
  },
} as const;

export const authService = {
  me() {
    return apiRequest<AuthSession>("/api/v1/auth/me");
  },
  login(payload: LoginPayload) {
    return apiRequest<AuthSession>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  register(payload: RegisterPayload) {
    return apiRequest<AuthSession>("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  logout() {
    return apiRequest<{ logged_out: boolean }>("/api/v1/auth/logout", {
      method: "POST",
    });
  },
};
