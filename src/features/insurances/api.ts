import { apiFetch, apiFetchRaw } from "@/lib/api-client";
import type { CreateInsuranceInput, Insurance } from "@/features/insurances/types";

export async function fetchInsurances(): Promise<Insurance[]> {
  return apiFetch<Insurance[]>("/insurances");
}

export async function createInsurance(input: CreateInsuranceInput): Promise<Insurance> {
  return apiFetch<Insurance>("/insurances", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function approveInsurance(id: string): Promise<Insurance> {
  return apiFetch<Insurance>(`/insurances/${id}/approve`, { method: "PATCH" });
}

export async function deleteInsurance(id: string): Promise<void> {
  await apiFetchRaw(`/insurances/${id}`, { method: "DELETE" });
}
