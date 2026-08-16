"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createCompanyInvoice,
  createDailyExpense,
  fetchExpenses,
  fetchMonthlyChart,
  fetchMonthlyComparison,
} from "@/features/expenses/api";
import type {
  CreateCompanyInvoiceInput,
  CreateDailyExpenseInput,
  ExpenseListParams,
} from "@/features/expenses/types";

export function useExpensesList(params: ExpenseListParams) {
  return useQuery({
    queryKey: ["expenses", params],
    queryFn: () => fetchExpenses(params),
    placeholderData: (prev) => prev,
  });
}

export function useMonthlyComparison() {
  return useQuery({
    queryKey: ["expenses", "monthly-comparison"],
    queryFn: fetchMonthlyComparison,
  });
}

export function useExpensesMonthlyChart(params: { admissionPlaceId?: string } = {}) {
  return useQuery({
    queryKey: ["expenses", "monthly-chart", params],
    queryFn: () => fetchMonthlyChart(params),
    placeholderData: (prev) => prev,
  });
}

export function useCreateDailyExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateDailyExpenseInput) => createDailyExpense(input),
    onSuccess: () => {
      toast.success("هزینه روزانه ثبت شد");
      qc.invalidateQueries({ queryKey: ["expenses"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "خطا در ثبت هزینه");
    },
  });
}

export function useCreateCompanyInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCompanyInvoiceInput) => createCompanyInvoice(input),
    onSuccess: () => {
      toast.success("فاکتور خرید ثبت شد");
      qc.invalidateQueries({ queryKey: ["expenses"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "خطا در ثبت فاکتور خرید");
    },
  });
}
