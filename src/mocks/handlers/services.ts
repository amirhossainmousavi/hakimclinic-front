import { delay, http, HttpResponse } from "msw";
import { servicesFixture } from "@/mocks/fixtures/services";

const LATENCY = () => Math.floor(Math.random() * 500) + 300;

const error = (code: string, message: string, status: number, details: unknown = null) =>
  HttpResponse.json({ success: false, error: { code, message, details } }, { status });

export const serviceHandlers = [
  http.get("/api/v1/services", async ({ request }) => {
    await delay(LATENCY());
    const url = new URL(request.url);
    const search = url.searchParams.get("search")?.trim();
    const serviceType = url.searchParams.get("serviceType");
    const page = Number(url.searchParams.get("page") ?? 1);
    const limit = Number(url.searchParams.get("limit") ?? 10);

    let rows = servicesFixture;
    if (serviceType) rows = rows.filter((s) => s.serviceType === serviceType);
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((s) => s.serviceCode.toLowerCase().includes(q));
    }

    const total = rows.length;
    const start = (page - 1) * limit;
    const items = rows.slice(start, start + limit);

    return HttpResponse.json({
      success: true,
      data: items,
      meta: { page, limit, total },
    });
  }),

  http.post("/api/v1/services", async ({ request }) => {
    await delay(LATENCY());
    const body = (await request.json()) as Record<string, unknown>;
    const missing: Record<string, string> = {};
    for (const key of ["serviceType", "treatmentProcess", "serviceCode", "price"]) {
      if (body[key] === undefined || body[key] === null || body[key] === "") {
        missing[key] = "این فیلد الزامی است";
      }
    }
    if (Object.keys(missing).length) {
      return error("VALIDATION_ERROR", "داده ورودی معتبر نیست", 400, missing);
    }
    const exists = servicesFixture.some(
      (s) => String(s.serviceCode).toLowerCase() === String(body.serviceCode).toLowerCase()
    );
    if (exists) {
      return error("SERVICE_CODE_EXISTS", "کد خدمت تکراری است", 409);
    }

    const newService = {
      id: crypto.randomUUID(),
      serviceType: body.serviceType as never,
      treatmentProcess: String(body.treatmentProcess),
      serviceCode: String(body.serviceCode),
      price: Number(body.price),
      description: (body.description as string) ?? null,
      createdAt: new Date().toISOString(),
    };
    servicesFixture.unshift(newService);
    return HttpResponse.json({ success: true, data: newService }, { status: 201 });
  }),

  http.patch("/api/v1/services/:id", async ({ params, request }) => {
    await delay(LATENCY());
    const svc = servicesFixture.find((s) => s.id === params.id);
    if (!svc) return error("SERVICE_NOT_FOUND", "خدمت مورد نظر یافت نشد", 404);
    const body = (await request.json()) as Record<string, unknown>;
    Object.assign(svc, body);
    return HttpResponse.json({ success: true, data: svc });
  }),

  http.delete("/api/v1/services/:id", async ({ params }) => {
    await delay(LATENCY());
    const idx = servicesFixture.findIndex((s) => s.id === params.id);
    if (idx === -1) return error("SERVICE_NOT_FOUND", "خدمت مورد نظر یافت نشد", 404);
    servicesFixture.splice(idx, 1);
    return HttpResponse.json({ success: true, data: null });
  }),
];
