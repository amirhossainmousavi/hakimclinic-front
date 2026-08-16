export type Role = "manager" | "secretary";

/** قابلیت‌های پنل که مدیر برای هر منشی فعال/غیرفعال می‌کند */
export type SecretaryPermissionKey =
  | "dashboard"
  | "patients"
  | "appointments"
  | "invoices"
  | "expenses";

export type PaginationParams = {
  page?: number;
  limit?: number;
};

export interface Paginated<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
}
