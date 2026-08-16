import { apiFetch, apiFetchRaw, buildQueryString } from "@/lib/api-client";
import type { Paginated } from "@/lib/types";
import type {
  CreateServiceInput,
  Service,
  ServiceListParams,
  UpdateServiceInput,
} from "@/features/services/types";

export async function fetchServices(
  params: ServiceListParams
): Promise<Paginated<Service>> {
  const res = await apiFetchRaw<Service[]>(
    `/services${buildQueryString(params as Record<string, unknown>)}`
  );
  const meta = res.meta ?? { page: 1, limit: 10, total: res.data.length };
  return { items: res.data, ...meta };
}

export async function createService(input: CreateServiceInput): Promise<Service> {
  return apiFetch<Service>("/services", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateService(id: string, input: UpdateServiceInput): Promise<Service> {
  return apiFetch<Service>(`/services/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function deleteService(id: string): Promise<void> {
  await apiFetchRaw(`/services/${id}`, { method: "DELETE" });
}
