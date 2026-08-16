import { getAccessToken } from "@/lib/api-client";
import type { Role, SecretaryPermissionKey } from "@/lib/types";

export interface DecodedToken {
  sub: string;
  role: Role;
  clinicId?: string;
  /** Ids of the admission places the secretary works in (empty for manager) */
  scopes?: string[];
  /** Active panel permissions for the secretary (empty for manager) */
  permissions?: SecretaryPermissionKey[];
  exp?: number;
}

export function decodeToken(token: string | null): DecodedToken | null {
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload as DecodedToken;
  } catch {
    return null;
  }
}

export function getCurrentUser(): DecodedToken | null {
  if (typeof window === "undefined") return null;
  return decodeToken(getAccessToken());
}

export function hasRole(allowed: Role[] | undefined, role: Role | undefined): boolean {
  if (!allowed || allowed.length === 0) return true;
  if (!role) return false;
  return allowed.includes(role);
}

/** If a permission list is given, only allowed when the secretary has it or is a manager */
export function hasPermission(
  permission: SecretaryPermissionKey | undefined,
  role: Role | undefined,
  permissions: SecretaryPermissionKey[] | undefined
): boolean {
  if (!permission) return true;
  if (role === "manager") return true;
  return !!permissions?.includes(permission);
}
