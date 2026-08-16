import { apiFetch, apiFetchRaw, buildQueryString } from "@/lib/api-client";
import type { Paginated } from "@/lib/types";
import type {
  CreateTariffInput,
  Tariff,
  TariffListParams,
  UpdateTariffInput,
} from "@/features/tariffs/types";

export async function fetchTariffs(
  params: TariffListParams
): Promise<Paginated<Tariff>> {
  const res = await apiFetchRaw<Tariff[]>(
    `/tariffs${buildQueryString(params as Record<string, unknown>)}`
  );
  const meta = res.meta ?? { page: 1, limit: 10, total: res.data.length };
  return { items: res.data, ...meta };
}

export async function createTariff(input: CreateTariffInput): Promise<Tariff> {
  return apiFetch<Tariff>("/tariffs", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateTariff(id: string, input: UpdateTariffInput): Promise<Tariff> {
  return apiFetch<Tariff>(`/tariffs/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function deleteTariff(id: string): Promise<void> {
  await apiFetchRaw(`/tariffs/${id}`, { method: "DELETE" });
}
