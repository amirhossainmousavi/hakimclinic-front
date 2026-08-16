"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createTariff,
  deleteTariff,
  fetchTariffs,
  updateTariff,
} from "@/features/tariffs/api";
import type {
  CreateTariffInput,
  TariffListParams,
  UpdateTariffInput,
} from "@/features/tariffs/types";

export function useTariffsList(params: TariffListParams) {
  return useQuery({
    queryKey: ["tariffs", params],
    queryFn: () => fetchTariffs(params),
    placeholderData: (prev) => prev,
  });
}

export function useCreateTariff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTariffInput) => createTariff(input),
    onSuccess: () => {
      toast.success("تعرفه با موفقیت ثبت شد");
      qc.invalidateQueries({ queryKey: ["tariffs"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "خطا در ثبت تعرفه");
    },
  });
}

export function useUpdateTariff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTariffInput }) =>
      updateTariff(id, input),
    onSuccess: () => {
      toast.success("تعرفه به‌روزرسانی شد");
      qc.invalidateQueries({ queryKey: ["tariffs"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "خطا در به‌روزرسانی تعرفه");
    },
  });
}

export function useDeleteTariff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTariff(id),
    onSuccess: () => {
      toast.success("تعرفه حذف شد");
      qc.invalidateQueries({ queryKey: ["tariffs"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "خطا در حذف تعرفه");
    },
  });
}
