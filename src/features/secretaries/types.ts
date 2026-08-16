import type { SecretaryPermissionKey } from "@/lib/types";

export interface SecretaryWorkplace {
  place: { id: string; name: string };
}

export interface SecretaryPermission {
  id: string;
  permissionKey: SecretaryPermissionKey;
}

export interface Secretary {
  id: string;
  nationalCode: string;
  phone: string;
  fullName: string;
  isActive: boolean;
  secretaryScopes: SecretaryWorkplace[];
  secretaryPermissions: SecretaryPermission[];
  createdAt: string;
}

export interface CreateSecretaryInput {
  nationalCode: string;
  phone: string;
  fullName: string;
  workplaceIds?: string[];
  permissions?: SecretaryPermissionKey[];
}

export interface UpdateSecretaryInput {
  nationalCode?: string;
  phone?: string;
  fullName?: string;
}

export const SECRETARY_PERMISSION_LABELS: Record<SecretaryPermissionKey, string> = {
  dashboard: "داشبورد منشی",
  patients: "بیماران",
  appointments: "نوبت‌دهی",
  invoices: "فاکتور",
  expenses: "هزینه‌ها",
};

/** Default permissions for each secretary — matching the backend */
export const DEFAULT_SECRETARY_PERMISSIONS: SecretaryPermissionKey[] = [
  "dashboard",
  "patients",
  "invoices",
];
