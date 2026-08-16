import { delay, http, HttpResponse } from "msw";
import { insurancesFixture } from "@/mocks/fixtures/insurances";
import type { CreateInsuranceInput, Insurance } from "@/features/insurances/types";

const LATENCY = () => Math.floor(Math.random() * 500) + 300;

const error = (code: string, message: string, status: number, details: unknown = null) =>
  HttpResponse.json({ success: false, error: { code, message, details } }, { status });

export const insuranceHandlers = [
  http.get("/api/v1/insurances", async () => {
    await delay(LATENCY());
    return HttpResponse.json({ success: true, data: insurancesFixture });
  }),

  http.post("/api/v1/insurances", async ({ request }) => {
    await delay(LATENCY());
    const body = (await request.json()) as CreateInsuranceInput;
    if (!body.name?.trim()) return error("VALIDATION_ERROR", "نام بیمه الزامی است", 400);
    const exists = insurancesFixture.some((i) => i.name === body.name.trim());
    if (exists) return error("INSURANCE_EXISTS", "این بیمه قبلاً ثبت شده است", 409);

    const newInsurance: Insurance = {
      id: crypto.randomUUID(),
      name: body.name.trim(),
      isApproved: false,
      createdAt: new Date().toISOString(),
    };
    insurancesFixture.push(newInsurance);
    return HttpResponse.json({ success: true, data: newInsurance }, { status: 201 });
  }),

  http.patch("/api/v1/insurances/:id/approve", async ({ params }) => {
    await delay(LATENCY());
    const ins = insurancesFixture.find((i) => i.id === params.id);
    if (!ins) return error("INSURANCE_NOT_FOUND", "بیمه مورد نظر یافت نشد", 404);
    ins.isApproved = true;
    return HttpResponse.json({ success: true, data: ins });
  }),

  http.delete("/api/v1/insurances/:id", async ({ params }) => {
    await delay(LATENCY());
    const index = insurancesFixture.findIndex((i) => i.id === params.id);
    if (index === -1) return error("INSURANCE_NOT_FOUND", "بیمه مورد نظر یافت نشد", 404);
    insurancesFixture.splice(index, 1);
    return HttpResponse.json({ success: true, data: null });
  }),
];
