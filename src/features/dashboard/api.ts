import { apiFetch } from "@/lib/api-client";
import type { DashboardSummary } from "@/features/dashboard/types";

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  return apiFetch<DashboardSummary>("/dashboard/summary");
}
