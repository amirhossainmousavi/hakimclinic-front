"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createAppointment,
  deleteAppointment,
  fetchAppointments,
  updateAppointment,
} from "@/features/appointments/api";
import type {
  AppointmentListParams,
  AppointmentStatus,
  CreateAppointmentInput,
  UpdateAppointmentInput,
} from "@/features/appointments/types";

export function useAppointmentsList(params: AppointmentListParams) {
  return useQuery({
    queryKey: ["appointments", params],
    queryFn: () => fetchAppointments(params),
    placeholderData: (prev) => prev,
  });
}

export function useCreateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAppointmentInput) => createAppointment(input),
    onSuccess: () => {
      toast.success("نوبت با موفقیت ثبت شد");
      qc.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "خطا در ثبت نوبت");
    },
  });
}

export function useUpdateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateAppointmentInput }) =>
      updateAppointment(id, input),
    onSuccess: () => {
      toast.success("نوبت با موفقیت به‌روزرسانی شد");
      qc.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "خطا در به‌روزرسانی نوبت");
    },
  });
}

export function useUpdateAppointmentStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: AppointmentStatus }) =>
      updateAppointment(id, { status }),
    onSuccess: () => {
      toast.success("وضعیت نوبت به‌روزرسانی شد");
      qc.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "خطا در به‌روزرسانی نوبت");
    },
  });
}

export function useDeleteAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAppointment(id),
    onSuccess: () => {
      toast.success("نوبت حذف شد");
      qc.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "خطا در حذف نوبت");
    },
  });
}
