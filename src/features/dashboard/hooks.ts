"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchDashboardSummary } from "@/features/dashboard/api";

export function useDashboardSummary() {
  return useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: fetchDashboardSummary,
  });
}
