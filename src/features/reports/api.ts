import { apiFetch, buildQueryString } from "@/lib/api-client";
import type { RevenueReport, RevenueReportParams } from "@/features/reports/types";

export async function fetchRevenueReport(
  params: RevenueReportParams = {}
): Promise<RevenueReport> {
  return apiFetch<RevenueReport>(
    `/reports/revenue${buildQueryString(params as Record<string, unknown>)}`
  );
}
