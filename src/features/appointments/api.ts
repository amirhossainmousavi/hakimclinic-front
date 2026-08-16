import { apiFetch, apiFetchRaw, buildQueryString } from "@/lib/api-client";
import type { Paginated } from "@/lib/types";
import type {
  Appointment,
  AppointmentListParams,
  CreateAppointmentInput,
  UpdateAppointmentInput,
} from "@/features/appointments/types";

export async function fetchAppointments(
  params: AppointmentListParams
): Promise<Paginated<Appointment>> {
  const res = await apiFetchRaw<Appointment[]>(
    `/appointments${buildQueryString(params as Record<string, unknown>)}`
  );
  const meta = res.meta ?? { page: 1, limit: 10, total: res.data.length };
  return { items: res.data, ...meta };
}

export async function createAppointment(input: CreateAppointmentInput): Promise<Appointment> {
  return apiFetch<Appointment>("/appointments", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateAppointment(
  id: string,
  input: UpdateAppointmentInput
): Promise<Appointment> {
  return apiFetch<Appointment>(`/appointments/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function deleteAppointment(id: string): Promise<void> {
  await apiFetchRaw(`/appointments/${id}`, { method: "DELETE" });
}
