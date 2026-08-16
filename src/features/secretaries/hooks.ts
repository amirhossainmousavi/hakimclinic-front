"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { SecretaryPermissionKey } from "@/lib/types";
import {
  createSecretary,
  deleteSecretary,
  fetchSecretaries,
  setSecretaryActive,
  updateSecretary,
  updateSecretaryPermissions,
  updateSecretaryWorkplaces,
} from "@/features/secretaries/api";
import type {
  CreateSecretaryInput,
  Secretary,
  UpdateSecretaryInput,
} from "@/features/secretaries/types";

export function useSecretaries() {
  return useQuery({
    queryKey: ["secretaries"],
    queryFn: fetchSecretaries,
  });
}

export function useCreateSecretary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSecretaryInput) => createSecretary(input),
    onSuccess: () => {
      toast.success("منشی جدید ثبت شد");
      qc.invalidateQueries({ queryKey: ["secretaries"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "خطا در ثبت منشی");
    },
  });
}

export function useUpdateSecretary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateSecretaryInput }) =>
      updateSecretary(id, input),
    onSuccess: () => {
      toast.success("تغییرات ذخیره شد");
      qc.invalidateQueries({ queryKey: ["secretaries"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "خطا در ذخیره تغییرات");
    },
  });
}

export function useUpdateSecretaryWorkplaces() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, workplaceIds }: { id: string; workplaceIds: string[] }) =>
      updateSecretaryWorkplaces(id, workplaceIds),
    onSuccess: () => {
      toast.success("محل‌های کار منشی به‌روزرسانی شد");
      qc.invalidateQueries({ queryKey: ["secretaries"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "خطا در به‌روزرسانی محل‌های کار");
    },
  });
}

export function useUpdateSecretaryPermissions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, permissions }: { id: string; permissions: SecretaryPermissionKey[] }) =>
      updateSecretaryPermissions(id, permissions),
    onSuccess: () => {
      toast.success("دسترسی‌های منشی به‌روزرسانی شد");
      qc.invalidateQueries({ queryKey: ["secretaries"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "خطا در به‌روزرسانی دسترسی‌ها");
    },
  });
}

export function useSetSecretaryActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      setSecretaryActive(id, isActive),
    onSuccess: (_data, vars) => {
      toast.success(vars.isActive ? "منشی فعال شد" : "منشی غیرفعال شد");
      qc.invalidateQueries({ queryKey: ["secretaries"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "خطا در تغییر وضعیت منشی");
    },
  });
}

export function useDeleteSecretary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSecretary(id),
    onSuccess: () => {
      toast.success("منشی حذف شد");
      qc.invalidateQueries({ queryKey: ["secretaries"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "خطا در حذف منشی");
    },
  });
}

export type { Secretary };
