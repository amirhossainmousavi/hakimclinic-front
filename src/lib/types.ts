export type Role = "manager" | "secretary";

/** Panel capabilities the manager enables/disables for each secretary */
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
