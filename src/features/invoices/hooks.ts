"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createInvoice,
  createProForma,
  fetchInvoices,
  type InvoiceListParams,
} from "@/features/invoices/api";
import type { CreateInvoiceInput } from "@/features/invoices/types";

export function useInvoicesList(params: InvoiceListParams) {
  return useQuery({
    queryKey: ["invoices", params],
    queryFn: () => fetchInvoices(params),
    placeholderData: (prev) => prev,
  });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateInvoiceInput) => createInvoice(input),
    onSuccess: () => {
      toast.success("فاکتور با موفقیت ثبت شد");
      qc.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "خطا در ثبت فاکتور");
    },
  });
}

export function useCreateProForma() {
  return useMutation({
    mutationFn: (input: CreateInvoiceInput) => createProForma(input),
  });
}
