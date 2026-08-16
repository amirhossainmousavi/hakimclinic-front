import { delay, http, HttpResponse } from "msw";
import { secretariesFixture } from "@/mocks/fixtures/secretaries";
import { admissionPlacesFixture } from "@/mocks/fixtures/admission-places";
import type { SecretaryPermissionKey } from "@/lib/types";
import type {
  CreateSecretaryInput,
  Secretary,
  SecretaryWorkplace,
} from "@/features/secretaries/types";

function placeName(id: string): string {
  return admissionPlacesFixture.find((p) => p.id === id)?.name ?? id;
}

function workplacesFromPlaceIds(placeIds: string[]): SecretaryWorkplace[] {
  return placeIds.map((placeId) => ({ place: { id: placeId, name: placeName(placeId) } }));
}

const LATENCY = () => Math.floor(Math.random() * 500) + 300;

const error = (code: string, message: string, status: number, details: unknown = null) =>
  HttpResponse.json({ success: false, error: { code, message, details } }, { status });

export const secretaryHandlers = [
  http.get("/api/v1/secretaries", async () => {
    await delay(LATENCY());
    return HttpResponse.json({ success: true, data: secretariesFixture });
  }),

  http.post("/api/v1/secretaries", async ({ request }) => {
    await delay(LATENCY());
    const body = (await request.json()) as CreateSecretaryInput;
    const missing: Record<string, string> = {};
    for (const key of ["nationalCode", "phone", "fullName"]) {
      if (!body[key as keyof CreateSecretaryInput]) missing[key] = "این فیلد الزامی است";
    }
    if (Object.keys(missing).length) return error("VALIDATION_ERROR", "داده ورودی معتبر نیست", 400, missing);

    const exists = secretariesFixture.some((s) => s.nationalCode === body.nationalCode);
    if (exists) return error("SECRETARY_EXISTS", "این کدملی قبلاً ثبت شده است", 409);

    const newSecretary: Secretary = {
      id: crypto.randomUUID(),
      nationalCode: body.nationalCode,
      phone: body.phone,
      fullName: body.fullName,
      isActive: true,
      secretaryScopes: workplacesFromPlaceIds(body.workplaceIds ?? []),
      secretaryPermissions: (body.permissions ?? ["dashboard", "patients", "invoices"]).map(
        (permissionKey) => ({ id: crypto.randomUUID(), permissionKey })
      ),
      createdAt: new Date().toISOString(),
    };
    secretariesFixture.push(newSecretary);
    return HttpResponse.json({ success: true, data: newSecretary }, { status: 201 });
  }),

  http.patch("/api/v1/secretaries/:id", async ({ params, request }) => {
    await delay(LATENCY());
    const sec = secretariesFixture.find((s) => s.id === params.id);
    if (!sec) return error("SECRETARY_NOT_FOUND", "منشی مورد نظر یافت نشد", 404);
    const body = (await request.json()) as { fullName?: string; nationalCode?: string; phone?: string };
    if (body.fullName !== undefined) sec.fullName = body.fullName;
    if (body.nationalCode !== undefined) sec.nationalCode = body.nationalCode;
    if (body.phone !== undefined) sec.phone = body.phone;
    return HttpResponse.json({ success: true, data: sec });
  }),

  http.put("/api/v1/secretaries/:id/workplaces", async ({ params, request }) => {
    await delay(LATENCY());
    const sec = secretariesFixture.find((s) => s.id === params.id);
    if (!sec) return error("SECRETARY_NOT_FOUND", "منشی مورد نظر یافت نشد", 404);
    const body = (await request.json()) as { workplaceIds: string[] };
    sec.secretaryScopes = workplacesFromPlaceIds(body.workplaceIds ?? []);
    return HttpResponse.json({ success: true, data: sec });
  }),

  http.put("/api/v1/secretaries/:id/permissions", async ({ params, request }) => {
    await delay(LATENCY());
    const sec = secretariesFixture.find((s) => s.id === params.id);
    if (!sec) return error("SECRETARY_NOT_FOUND", "منشی مورد نظر یافت نشد", 404);
    const body = (await request.json()) as { permissions: SecretaryPermissionKey[] };
    sec.secretaryPermissions = (body.permissions ?? []).map((permissionKey) => ({
      id: crypto.randomUUID(),
      permissionKey,
    }));
    return HttpResponse.json({ success: true, data: sec });
  }),

  http.patch("/api/v1/secretaries/:id/active", async ({ params, request }) => {
    await delay(LATENCY());
    const sec = secretariesFixture.find((s) => s.id === params.id);
    if (!sec) return error("SECRETARY_NOT_FOUND", "منشی مورد نظر یافت نشد", 404);
    const body = (await request.json()) as { isActive: boolean };
    sec.isActive = body.isActive;
    return HttpResponse.json({ success: true, data: sec });
  }),

  http.delete("/api/v1/secretaries/:id", async ({ params }) => {
    await delay(LATENCY());
    const idx = secretariesFixture.findIndex((s) => s.id === params.id);
    if (idx === -1) return error("SECRETARY_NOT_FOUND", "منشی مورد نظر یافت نشد", 404);
    secretariesFixture.splice(idx, 1);
    return HttpResponse.json({ success: true, data: null });
  }),
];
