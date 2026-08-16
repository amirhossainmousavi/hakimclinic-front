export interface RevenueSummary {
  totalAmount: number;
  count: number;
  proFormaCount: number;
  finalCount: number;
  byPaymentType: Record<"card_to_card" | "pos" | "bank_transfer", { count: number; total: number }>;
}

export interface RevenueChartPoint {
  date: string;
  total: number;
}

export interface RevenueReport {
  summary: RevenueSummary;
  chart: RevenueChartPoint[];
}

export interface RevenueReportParams {
  from?: string;
  to?: string;
  paymentType?: "card_to_card" | "pos" | "bank_transfer";
  admissionPlaceId?: string;
  min?: number;
  max?: number;
}
