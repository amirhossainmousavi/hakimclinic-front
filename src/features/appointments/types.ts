export type AppointmentStatus = "scheduled" | "postponed" | "cancelled" | "done";

export interface Appointment {
  id: string;
  patientId: string | null;
  fullName: string;
  nationalCode: string;
  phone: string;
  birthDate: string | null;
  admissionType: "free" | "insured";
  appointmentDate: string;
  appointmentTime: string | null;
  admissionPlaceId: string | null;
  admissionPlaceName: string | null;
  status: AppointmentStatus;
  createdAt: string;
}

export interface AppointmentListParams {
  status?: AppointmentStatus;
  from?: string;
  to?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateAppointmentInput {
  patientId?: string;
  fullName: string;
  nationalCode: string;
  phone: string;
  birthDate?: string;
  admissionType: "free" | "insured";
  appointmentDate: string;
  appointmentTime?: string;
  admissionPlaceId?: string;
}

export interface UpdateAppointmentInput {
  patientId?: string;
  fullName?: string;
  nationalCode?: string;
  phone?: string;
  birthDate?: string | null;
  admissionType?: "free" | "insured";
  appointmentDate?: string;
  appointmentTime?: string | null;
  admissionPlaceId?: string | null;
  status?: AppointmentStatus;
}

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  scheduled: "نوبت‌دار",
  postponed: "به تعویق افتاده",
  cancelled: "لغو شده",
  done: "انجام شده",
};
