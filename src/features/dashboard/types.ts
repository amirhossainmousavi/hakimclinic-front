export interface DashboardAlert {
  type: "insurance_overdue";
  count: number;
}

export interface DashboardSummary {
  todayRevenue: number;
  todayAdmissions: number;
  todayAppointments: number;
  readyForDelivery: number;
  /** مجموع درآمد نهایی هر روز — ۳۰ روز اخیر */
  revenue30d: { date: string; total: number }[];
  /** درصد رشد/افت نسبت به ۳۰ روز قبل؛ علامت‌دار. null وقتی داده قبلی نباشد */
  revenueGrowthPercent: number | null;
  alerts: DashboardAlert[];
}
