import { apiFetch, apiFetchRaw } from "@/lib/api-client";
import type {
  AdmissionPlace,
  CreateAdmissionPlaceInput,
  UpdateAdmissionPlaceInput,
} from "@/features/admission-places/types";

export async function fetchAdmissionPlaces(): Promise<AdmissionPlace[]> {
  return apiFetch<AdmissionPlace[]>("/admission-places");
}

export async function createAdmissionPlace(
  input: CreateAdmissionPlaceInput
): Promise<AdmissionPlace> {
  return apiFetch<AdmissionPlace>("/admission-places", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateAdmissionPlace(
  id: string,
  input: UpdateAdmissionPlaceInput
): Promise<AdmissionPlace> {
  return apiFetch<AdmissionPlace>(`/admission-places/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function deleteAdmissionPlace(id: string): Promise<void> {
  await apiFetchRaw(`/admission-places/${id}`, { method: "DELETE" });
}
