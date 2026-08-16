"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createService,
  deleteService,
  fetchServices,
  updateService,
} from "@/features/services/api";
import type {
  CreateServiceInput,
  ServiceListParams,
  UpdateServiceInput,
} from "@/features/services/types";

export function useServicesList(params: ServiceListParams) {
  return useQuery({
    queryKey: ["services", params],
    queryFn: () => fetchServices(params),
    placeholderData: (prev) => prev,
  });
}

export function useCreateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateServiceInput) => createService(input),
    onSuccess: () => {
      toast.success("خدمت با موفقیت ثبت شد");
      qc.invalidateQueries({ queryKey: ["services"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "خطا در ثبت خدمت");
    },
  });
}

export function useUpdateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateServiceInput }) =>
      updateService(id, input),
    onSuccess: () => {
      toast.success("خدمت به‌روزرسانی شد");
      qc.invalidateQueries({ queryKey: ["services"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "خطا در به‌روزرسانی خدمت");
    },
  });
}

export function useDeleteService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteService(id),
    onSuccess: () => {
      toast.success("خدمت حذف شد");
      qc.invalidateQueries({ queryKey: ["services"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "خطا در حذف خدمت");
    },
  });
}
