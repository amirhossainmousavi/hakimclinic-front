import type { Role } from "@/lib/types";

export interface AuthUser {
  id: string;
  fullName: string;
  nationalCode: string;
  phone: string;
  role: Role;
}

export interface LoginInput {
  nationalCode: string;
  phone: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}
