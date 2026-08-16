export interface DashboardAlert {
  type: "insurance_overdue";
  count: number;
}

export interface DashboardSummary {
  todayRevenue: number;
  todayAdmissions: number;
  todayAppointments: number;
  readyForDelivery: number;
  /** Total final revenue per day — last 30 days */
  revenue30d: { date: string; total: number }[];
  /** Growth/decline percent vs the previous 30 days; signed. null when there is no earlier data */
  revenueGrowthPercent: number | null;
  alerts: DashboardAlert[];
}
