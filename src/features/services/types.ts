export type ServiceType = "orthosis" | "prosthesis";

export interface Service {
  id: string;
  serviceType: ServiceType;
  serviceName: string | null;
  regionOrSection: string | null;
  treatmentProcess: string | null;
  serviceCode: string;
  price: number;
  description: string | null;
  createdAt: string;
}

/** نام نمایشی خدمت — serviceName، و در غیابش کد خدمت */
export function serviceDisplayName(svc: Pick<Service, "serviceName" | "serviceCode">): string {
  return svc.serviceName?.trim() ? svc.serviceName : svc.serviceCode;
}

export interface ServiceListParams {
  search?: string;
  serviceType?: ServiceType;
  page?: number;
  limit?: number;
}

export interface CreateServiceInput {
  serviceType: ServiceType;
  serviceName: string;
  serviceCode: string;
  price: number;
  description?: string;
  regionOrSection?: string | null;
  treatmentProcess?: string | null;
}

export interface UpdateServiceInput extends Partial<CreateServiceInput> {}

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  orthosis: "ارتز (Orthosis)",
  prosthesis: "پروتز (Prosthesis)",
};
