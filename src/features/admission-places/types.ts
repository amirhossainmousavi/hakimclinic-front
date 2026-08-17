import type { Insurance } from "@/features/insurances/types";

export type AdmissionPlaceType = "free_only" | "insured_only" | "both";

export interface AdmissionPlace {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  centerNumbers: string[];
  description: string | null;
  admissionType: AdmissionPlaceType;
  insurances: Array<{
    id: string;
    insuranceId: string;
    insurance: Insurance;
  }>;
  createdAt: string;
}

export interface CreateAdmissionPlaceInput {
  name: string;
  address: string;
  phone?: string | null;
  centerNumbers?: string[];
  description?: string;
  admissionType: AdmissionPlaceType;
  insuranceIds?: string[];
}

export type UpdateAdmissionPlaceInput = Partial<CreateAdmissionPlaceInput>;

export const ADMISSION_PLACE_TYPE_LABELS: Record<AdmissionPlaceType, string> = {
  free_only: "آزاد",
  insured_only: "بیمه‌ای",
  both: "هر دو",
};
