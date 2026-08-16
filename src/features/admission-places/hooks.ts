"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createAdmissionPlace,
  deleteAdmissionPlace,
  fetchAdmissionPlaces,
  updateAdmissionPlace,
} from "@/features/admission-places/api";
import type {
  CreateAdmissionPlaceInput,
  UpdateAdmissionPlaceInput,
} from "@/features/admission-places/types";

export function useAdmissionPlaces() {
  return useQuery({
    queryKey: ["admission-places"],
    queryFn: fetchAdmissionPlaces,
  });
}

export function useCreateAdmissionPlace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAdmissionPlaceInput) => createAdmissionPlace(input),
    onSuccess: () => {
      toast.success("محل پذیرش جدید ثبت شد");
      qc.invalidateQueries({ queryKey: ["admission-places"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "خطا در ثبت محل پذیرش");
    },
  });
}

export function useUpdateAdmissionPlace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateAdmissionPlaceInput }) =>
      updateAdmissionPlace(id, input),
    onSuccess: () => {
      toast.success("تغییرات محل پذیرش ذخیره شد");
      qc.invalidateQueries({ queryKey: ["admission-places"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "خطا در ذخیره تغییرات");
    },
  });
}

export function useDeleteAdmissionPlace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAdmissionPlace(id),
    onSuccess: () => {
      toast.success("محل پذیرش حذف شد");
      qc.invalidateQueries({ queryKey: ["admission-places"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "خطا در حذف محل پذیرش");
    },
  });
}
