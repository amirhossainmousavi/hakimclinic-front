"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { approveInsurance, createInsurance, deleteInsurance, fetchInsurances } from "@/features/insurances/api";
import type { CreateInsuranceInput } from "@/features/insurances/types";

export function useInsurances() {
  return useQuery({
    queryKey: ["insurances"],
    queryFn: fetchInsurances,
  });
}

export function useCreateInsurance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateInsuranceInput) => createInsurance(input),
    onSuccess: () => {
      toast.success("بیمه جدید ثبت شد");
      qc.invalidateQueries({ queryKey: ["insurances"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "خطا در ثبت بیمه");
    },
  });
}

export function useApproveInsurance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => approveInsurance(id),
    onSuccess: () => {
      toast.success("بیمه تأیید شد");
      qc.invalidateQueries({ queryKey: ["insurances"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "خطا در تأیید بیمه");
    },
  });
}

export function useDeleteInsurance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteInsurance(id),
    onSuccess: () => {
      toast.success("بیمه حذف شد");
      qc.invalidateQueries({ queryKey: ["insurances"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "خطا در حذف بیمه");
    },
  });
}
