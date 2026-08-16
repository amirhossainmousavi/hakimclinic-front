export type PatientStatus =
  | "admitted"
  | "pending_insurance_approval"
  | "in_production"
  | "ready_for_delivery"
  | "delivered";

export type AdmissionType = "free" | "insured";

export interface Patient {
  id: string;
  nationalCode: string;
  fullName: string;
  phone: string;
  birthDate: string | null;
  fileNumber: string;
  admissionPlaceId: string | null;
  admissionPlaceName: string | null;
  /** آیدی کاربری که بیمار را پذیرش کرده (در mock از توکن؛ در بک‌اند از sub) */
  admittedByUserId: string | null;
  admissionType: AdmissionType;
  insuranceId: string | null;
  insuranceName: string | null;
  status: PatientStatus;
  suggestedDoctor: string | null;
  description: string | null;
  createdAt: string;
}

export interface PatientListParams {
  search?: string;
  status?: PatientStatus;
  placeId?: string;
  page?: number;
  limit?: number;
}

export interface CreatePatientInput {
  nationalCode: string;
  fullName: string;
  phone: string;
  birthDate: string;
  admissionPlaceId?: string;
  admissionType: AdmissionType;
  insuranceId?: string;
  suggestedDoctor?: string;
  description?: string;
  services?: AttachPatientServiceInput[];
}

export interface UpdatePatientInput {
  nationalCode?: string;
  fullName?: string;
  phone?: string;
  birthDate?: string | null;
  admissionPlaceId?: string | null;
  admissionType?: AdmissionType;
  insuranceId?: string | null;
  suggestedDoctor?: string | null;
  description?: string | null;
  status?: PatientStatus;
}

export interface PatientService {
  id: string;
  patientId: string;
  serviceId: string;
  serviceDate: string;
  unitPrice: number;
  createdAt: string;
  service: {
    id: string;
    serviceType: "orthosis" | "prosthesis";
    treatmentProcess: string;
    serviceCode: string;
    price: number;
    description: string | null;
    createdAt: string;
  };
}

export interface AttachPatientServiceInput {
  serviceId: string;
  serviceDate?: string;
  /** فقط برای نمایش در UI؛ به سرور ارسال نمی‌شود */
  serviceName?: string;
  serviceCode?: string;
  unitPrice?: number;
}

export type PatientFileType = "image" | "video";

export interface PatientFile {
  id: string;
  patientId: string;
  type: PatientFileType;
  mimeType: string;
  fileName: string;
  fileSize: number;
  url: string;
  createdAt: string;
}

export interface PatientStatusHistory {
  id: string;
  fromStatus: PatientStatus | null;
  toStatus: PatientStatus;
  changedAt: string;
  changedByUserName: string;
}

export const PATIENT_STATUS_LABELS: Record<PatientStatus, string> = {
  admitted: "پذیرش شده",
  pending_insurance_approval: "در انتظار تاییدیه بیمه",
  in_production: "در حال ساخت",
  ready_for_delivery: "آماده تحویل",
  delivered: "تحویل داده شده",
};

export const ADMISSION_TYPE_LABELS: Record<AdmissionType, string> = {
  free: "آزاد",
  insured: "بیمه‌ای",
};
