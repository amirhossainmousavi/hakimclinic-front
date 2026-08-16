export type ServiceType = "orthosis" | "prosthesis";

export interface Service {
  id: string;
  serviceType: ServiceType;
  treatmentProcess: string;
  serviceCode: string;
  price: number;
  description: string | null;
  createdAt: string;
}

export interface ServiceListParams {
  search?: string;
  serviceType?: ServiceType;
  page?: number;
  limit?: number;
}

export interface CreateServiceInput {
  serviceType: ServiceType;
  treatmentProcess: string;
  serviceCode: string;
  price: number;
  description?: string;
}

export interface UpdateServiceInput extends Partial<CreateServiceInput> {}

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  orthosis: "ارتز (Orthosis)",
  prosthesis: "پروتز (Prosthesis)",
};
