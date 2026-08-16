import { apiFetch, apiFetchRaw, buildQueryString, BASE_URL, getAccessToken } from "@/lib/api-client";
import { ApiError } from "@/lib/api-error";
import type { Paginated } from "@/lib/types";
import type {
  CreatePatientInput,
  Patient,
  PatientFile,
  PatientListParams,
  PatientService,
  PatientStatus,
  UpdatePatientInput,
  AttachPatientServiceInput,
} from "@/features/patients/types";

export async function fetchPatients(
  params: PatientListParams
): Promise<Paginated<Patient>> {
  const res = await apiFetchRaw<Patient[]>(
    `/patients${buildQueryString(params as Record<string, unknown>)}`
  );
  const meta = res.meta ?? { page: 1, limit: 10, total: res.data.length };
  return { items: res.data, ...meta };
}

export async function createPatient(input: CreatePatientInput): Promise<Patient> {
  return apiFetch<Patient>("/patients", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function fetchPatient(id: string): Promise<Patient> {
  return apiFetch<Patient>(`/patients/${id}`);
}

export async function updatePatient(
  id: string,
  input: UpdatePatientInput
): Promise<Patient> {
  return apiFetch<Patient>(`/patients/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function updatePatientStatus(
  id: string,
  status: PatientStatus
): Promise<Patient> {
  return apiFetch<Patient>(`/patients/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

/** Multipart upload — no Content-Type header so the browser sets its own boundary */
export async function uploadPatientFile(
  patientId: string,
  file: File
): Promise<PatientFile> {
  const headers = new Headers();
  const token = getAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const fd = new FormData();
  fd.append("file", file);

  const res = await fetch(`${BASE_URL}/patients/${patientId}/files`, {
    method: "POST",
    headers,
    body: fd,
  });
  const body = (await res.json().catch(() => null)) as
    | { success: true; data: PatientFile }
    | { success: false; error: { message: string } }
    | null;
  if (!res.ok || !body || body.success !== true) {
    const msg =
      body && "error" in body ? body.error.message : "خطا در آپلود فایل";
    throw new ApiError(res.status, {
      code: "UPLOAD_ERROR",
      message: msg,
      details: null,
    });
  }
  return body.data;
}

export async function fetchPatientFiles(patientId: string): Promise<PatientFile[]> {
  return apiFetch<PatientFile[]>(`/patients/${patientId}/files`);
}

export async function deletePatientFile(id: string): Promise<void> {
  await apiFetch<{ message: string }>(`/files/${id}`, { method: "DELETE" });
}

export async function fetchPatientServices(
  patientId: string
): Promise<PatientService[]> {
  return apiFetch<PatientService[]>(`/patients/${patientId}/services`);
}

export async function attachPatientService(
  patientId: string,
  input: AttachPatientServiceInput
): Promise<PatientService> {
  return apiFetch<PatientService>(`/patients/${patientId}/services`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function removePatientService(id: string): Promise<void> {
  await apiFetch<{ message: string }>(`/patients/services/${id}`, {
    method: "DELETE",
  });
}
