export interface DailyExpense {
  id: string;
  type: "daily";
  title: string;
  amount: number;
  expenseDate: string;
  admissionPlaceId: string | null;
  admissionPlaceName: string | null;
  description: string | null;
  createdAt: string;
}

export interface CompanyInvoice {
  id: string;
  type: "company";
  title: string;
  companyName: string;
  amount: number;
  invoiceDate: string;
  partName: string;
  quantity: number;
  unitAmount: number;
  description: string | null;
  createdAt: string;
}

export type Expense = DailyExpense | CompanyInvoice;

export interface ExpenseListParams {
  type?: "daily" | "company";
  from?: string;
  to?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateDailyExpenseInput {
  title: string;
  amount: number;
  expenseDate: string;
  admissionPlaceId?: string;
  description?: string;
}

export interface CreateCompanyInvoiceInput {
  title: string;
  companyName: string;
  amount: number;
  invoiceDate: string;
  partName?: string;
  quantity?: number;
  unitAmount?: number;
  description?: string;
}

export interface MonthlyComparisonEntry {
  month: string;
  dailyTotal: number;
  companyTotal: number;
}

export interface MonthlyChartPoint {
  date: string;
  current: number;
  previous: number;
}
