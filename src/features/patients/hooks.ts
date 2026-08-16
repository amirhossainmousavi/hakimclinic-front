"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createPatient,
  deletePatientFile,
  fetchPatient,
  fetchPatientFiles,
  fetchPatientServices,
  fetchPatients,
  attachPatientService,
  removePatientService,
  updatePatient,
  updatePatientStatus,
  uploadPatientFile,
} from "@/features/patients/api";
import type {
  CreatePatientInput,
  PatientListParams,
  PatientStatus,
  UpdatePatientInput,
  AttachPatientServiceInput,
} from "@/features/patients/types";

export function usePatientsList(params: PatientListParams) {
  return useQuery({
    queryKey: ["patients", params],
    queryFn: () => fetchPatients(params),
    placeholderData: (prev) => prev,
  });
}

export function usePatient(id: string | null) {
  return useQuery({
    queryKey: ["patient", id],
    queryFn: () => fetchPatient(id!),
    enabled: !!id,
  });
}

export function useUpdatePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePatientInput }) =>
      updatePatient(id, input),
    onSuccess: (patient) => {
      toast.success(`اطلاعات بیمار «${patient.fullName}» به‌روزرسانی شد`);
      qc.invalidateQueries({ queryKey: ["patients"] });
      qc.invalidateQueries({ queryKey: ["patient"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "خطا در به‌روزرسانی بیمار");
    },
  });
}

export function usePatientFiles(patientId: string | null) {
  return useQuery({
    queryKey: ["patient-files", patientId],
    queryFn: () => fetchPatientFiles(patientId!),
    enabled: !!patientId,
  });
}

export function useUploadPatientFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ patientId, file }: { patientId: string; file: File }) =>
      uploadPatientFile(patientId, file),
    onSuccess: () => {
      toast.success("فایل با موفقیت آپلود شد");
      qc.invalidateQueries({ queryKey: ["patient-files"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "خطا در آپلود فایل");
    },
  });
}

export function useDeletePatientFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePatientFile(id),
    onSuccess: () => {
      toast.success("فایل حذف شد");
      qc.invalidateQueries({ queryKey: ["patient-files"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "خطا در حذف فایل");
    },
  });
}

export function useCreatePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePatientInput) => createPatient(input),
    onSuccess: (patient) => {
      toast.success(`بیمار «${patient.fullName}» با موفقیت ثبت شد`);
      qc.invalidateQueries({ queryKey: ["patients"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "خطا در ثبت بیمار");
    },
  });
}

export function useUpdatePatientStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: PatientStatus }) =>
      updatePatientStatus(id, status),
    onSuccess: () => {
      toast.success("وضعیت بیمار به‌روزرسانی شد");
      qc.invalidateQueries({ queryKey: ["patients"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "خطا در به‌روزرسانی وضعیت");
    },
  });
}

export function usePatientServices(patientId: string | null) {
  return useQuery({
    queryKey: ["patient-services", patientId],
    queryFn: () => fetchPatientServices(patientId!),
    enabled: !!patientId,
  });
}

export function useAttachPatientService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      patientId,
      input,
    }: {
      patientId: string;
      input: AttachPatientServiceInput;
    }) => attachPatientService(patientId, input),
    onSuccess: () => {
      toast.success("خدمت با موفقیت ثبت شد");
      qc.invalidateQueries({ queryKey: ["patient-services"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "خطا در ثبت خدمت");
    },
  });
}

export function useRemovePatientService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => removePatientService(id),
    onSuccess: () => {
      toast.success("خدمت حذف شد");
      qc.invalidateQueries({ queryKey: ["patient-services"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "خطا در حذف خدمت");
    },
  });
}
