import { apiFetch, apiFetchRaw, buildQueryString } from "@/lib/api-client";
import type { Paginated } from "@/lib/types";
import type {
  CreateCompanyInvoiceInput,
  CreateDailyExpenseInput,
  Expense,
  ExpenseListParams,
  MonthlyChartPoint,
  MonthlyComparisonEntry,
} from "@/features/expenses/types";

export async function fetchExpenses(
  params: ExpenseListParams
): Promise<Paginated<Expense>> {
  const res = await apiFetchRaw<Expense[]>(
    `/expenses${buildQueryString(params as Record<string, unknown>)}`
  );
  const meta = res.meta ?? { page: 1, limit: 10, total: res.data.length };
  return { items: res.data, ...meta };
}

export async function createDailyExpense(input: CreateDailyExpenseInput): Promise<Expense> {
  return apiFetch<Expense>("/expenses/daily", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function createCompanyInvoice(input: CreateCompanyInvoiceInput): Promise<Expense> {
  return apiFetch<Expense>("/expenses/company", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function fetchMonthlyComparison(): Promise<MonthlyComparisonEntry[]> {
  return apiFetch<MonthlyComparisonEntry[]>("/expenses/monthly-comparison");
}

export async function fetchMonthlyChart(
  params: { admissionPlaceId?: string } = {}
): Promise<MonthlyChartPoint[]> {
  const qs = buildQueryString(params as Record<string, unknown>);
  return apiFetch<MonthlyChartPoint[]>(`/expenses/monthly-chart${qs}`);
}
