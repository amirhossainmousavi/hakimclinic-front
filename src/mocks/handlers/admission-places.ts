import { delay, http, HttpResponse } from "msw";
import { admissionPlacesFixture } from "@/mocks/fixtures/admission-places";
import { insurancesFixture } from "@/mocks/fixtures/insurances";
import type {
  AdmissionPlace,
  AdmissionPlaceType,
  CreateAdmissionPlaceInput,
} from "@/features/admission-places/types";

const LATENCY = () => Math.floor(Math.random() * 500) + 300;

const error = (code: string, message: string, status: number, details: unknown = null) =>
  HttpResponse.json({ success: false, error: { code, message, details } }, { status });

/** ورودی میانی — آیدی‌های بیمه که بعد از بازسازی به رابطه‌های کامل تبدیل می‌شوند */
interface BuildPlaceInput {
  id?: string;
  name: string;
  address: string;
  description: string | null;
  admissionType: AdmissionPlaceType;
  insuranceIds?: string[];
}

/** بازسازی شیء کامل محل از داده ساده — آیدی/نام بیمه را به هم وصل می‌کند */
function buildPlace(partial: BuildPlaceInput): AdmissionPlace {
  const place = admissionPlacesFixture.find((p) => p.id === partial.id);
  const insuranceIds = partial.insuranceIds ?? place?.insurances.map((i) => i.insuranceId) ?? [];

  return {
    id: partial.id ?? crypto.randomUUID(),
    name: partial.name,
    address: partial.address,
    description: partial.description ?? null,
    admissionType: partial.admissionType,
    insurances: insuranceIds.map((insuranceId, j) => {
      const ins = insurancesFixture.find((i) => i.id === insuranceId);
      return {
        id: `${partial.id ?? "new"}-ins-${j + 1}`,
        insuranceId,
        insurance: {
          id: insuranceId,
          name: ins?.name ?? insuranceId,
          isApproved: ins?.isApproved ?? false,
          createdAt: ins?.createdAt ?? "",
        },
      };
    }),
    createdAt: place?.createdAt ?? new Date().toISOString(),
  };
}

export const admissionPlaceHandlers = [
  http.get("/api/v1/admission-places", async () => {
    await delay(LATENCY());
    return HttpResponse.json({ success: true, data: admissionPlacesFixture });
  }),

  http.post("/api/v1/admission-places", async ({ request }) => {
    await delay(LATENCY());
    const body = (await request.json()) as CreateAdmissionPlaceInput;
    if (!body.name?.trim() || !body.address?.trim()) {
      return error("VALIDATION_ERROR", "نام و آدرس محل پذیرش الزامی است", 400);
    }
    const place = buildPlace({
      name: body.name.trim(),
      address: body.address.trim(),
      description: body.description ?? null,
      admissionType: body.admissionType,
      insuranceIds: body.insuranceIds ?? [],
    });
    admissionPlacesFixture.unshift(place);
    return HttpResponse.json({ success: true, data: place }, { status: 201 });
  }),

  http.patch("/api/v1/admission-places/:id", async ({ params, request }) => {
    await delay(LATENCY());
    const idx = admissionPlacesFixture.findIndex((p) => p.id === params.id);
    if (idx === -1) return error("ADMISSION_PLACE_NOT_FOUND", "محل پذیرش مورد نظر یافت نشد", 404);
    const body = (await request.json()) as CreateAdmissionPlaceInput;
    const prev = admissionPlacesFixture[idx];
    const next = buildPlace({
      id: prev.id,
      name: body.name ?? prev.name,
      address: body.address ?? prev.address,
      description: body.description ?? prev.description,
      admissionType: body.admissionType ?? prev.admissionType,
      insuranceIds: body.insuranceIds,
    });
    admissionPlacesFixture[idx] = next;
    return HttpResponse.json({ success: true, data: next });
  }),

  http.delete("/api/v1/admission-places/:id", async ({ params }) => {
    await delay(LATENCY());
    const idx = admissionPlacesFixture.findIndex((p) => p.id === params.id);
    if (idx === -1) return error("ADMISSION_PLACE_NOT_FOUND", "محل پذیرش مورد نظر یافت نشد", 404);
    admissionPlacesFixture.splice(idx, 1);
    return HttpResponse.json({ success: true, data: null });
  }),
];
