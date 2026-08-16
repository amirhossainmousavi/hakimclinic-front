import { getAccessToken } from "@/lib/api-client";
import type { Role, SecretaryPermissionKey } from "@/lib/types";

export interface DecodedToken {
  sub: string;
  role: Role;
  clinicId?: string;
  /** آیدی محل‌های پذیرش که منشی در آن‌ها کار می‌کند (برای manager خالی است) */
  scopes?: string[];
  /** قابلیت‌های پنل فعال برای منشی (برای manager خالی است) */
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

/** اگر لیست دسترسی مشخص شده، فقط وقتی مجاز است که منشی آن را داشته باشد یا مدیر باشد */
export function hasPermission(
  permission: SecretaryPermissionKey | undefined,
  role: Role | undefined,
  permissions: SecretaryPermissionKey[] | undefined
): boolean {
  if (!permission) return true;
  if (role === "manager") return true;
  return !!permissions?.includes(permission);
}
