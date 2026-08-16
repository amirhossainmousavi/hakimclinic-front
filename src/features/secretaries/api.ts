import { apiFetch, apiFetchRaw } from "@/lib/api-client";
import type { SecretaryPermissionKey } from "@/lib/types";
import type {
  CreateSecretaryInput,
  Secretary,
  UpdateSecretaryInput,
} from "@/features/secretaries/types";

export async function fetchSecretaries(): Promise<Secretary[]> {
  return apiFetch<Secretary[]>("/secretaries");
}

export async function createSecretary(input: CreateSecretaryInput): Promise<Secretary> {
  return apiFetch<Secretary>("/secretaries", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateSecretary(
  id: string,
  input: UpdateSecretaryInput
): Promise<Secretary> {
  return apiFetch<Secretary>(`/secretaries/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function updateSecretaryWorkplaces(
  id: string,
  workplaceIds: string[]
): Promise<Secretary> {
  return apiFetch<Secretary>(`/secretaries/${id}/workplaces`, {
    method: "PUT",
    body: JSON.stringify({ workplaceIds }),
  });
}

export async function updateSecretaryPermissions(
  id: string,
  permissions: SecretaryPermissionKey[]
): Promise<Secretary> {
  return apiFetch<Secretary>(`/secretaries/${id}/permissions`, {
    method: "PUT",
    body: JSON.stringify({ permissions }),
  });
}

export async function setSecretaryActive(
  id: string,
  isActive: boolean
): Promise<Secretary> {
  return apiFetch<Secretary>(`/secretaries/${id}/active`, {
    method: "PATCH",
    body: JSON.stringify({ isActive }),
  });
}

export async function deleteSecretary(id: string): Promise<void> {
  await apiFetchRaw(`/secretaries/${id}`, { method: "DELETE" });
}
