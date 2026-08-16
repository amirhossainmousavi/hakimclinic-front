import { delay, http, HttpResponse } from "msw";
import { tariffsFixture } from "@/mocks/fixtures/tariffs";

const LATENCY = () => Math.floor(Math.random() * 500) + 300;

const error = (code: string, message: string, status: number, details: unknown = null) =>
  HttpResponse.json({ success: false, error: { code, message, details } }, { status });

export const tariffHandlers = [
  http.get("/api/v1/tariffs", async ({ request }) => {
    await delay(LATENCY());
    const url = new URL(request.url);
    const search = url.searchParams.get("search")?.trim();
    const page = Number(url.searchParams.get("page") ?? 1);
    const limit = Number(url.searchParams.get("limit") ?? 10);

    let rows = tariffsFixture;
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((t) => t.itemCode.toLowerCase().includes(q));
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

  http.post("/api/v1/tariffs", async ({ request }) => {
    await delay(LATENCY());
    const body = (await request.json()) as Record<string, unknown>;
    const missing: Record<string, string> = {};
    for (const key of ["itemCode", "itemDescription", "price"]) {
      if (body[key] === undefined || body[key] === null || body[key] === "") {
        missing[key] = "این فیلد الزامی است";
      }
    }
    if (Object.keys(missing).length) {
      return error("VALIDATION_ERROR", "داده ورودی معتبر نیست", 400, missing);
    }
    const exists = tariffsFixture.some(
      (t) => String(t.itemCode).toLowerCase() === String(body.itemCode).toLowerCase()
    );
    if (exists) {
      return error("TARIFF_ITEM_CODE_EXISTS", "کد قطعه تکراری است", 409);
    }

    const newTariff = {
      id: crypto.randomUUID(),
      itemCode: String(body.itemCode),
      itemDescription: String(body.itemDescription),
      price: Number(body.price),
      description: (body.description as string) ?? null,
      createdAt: new Date().toISOString(),
    };
    tariffsFixture.unshift(newTariff);
    return HttpResponse.json({ success: true, data: newTariff }, { status: 201 });
  }),

  http.patch("/api/v1/tariffs/:id", async ({ params, request }) => {
    await delay(LATENCY());
    const trf = tariffsFixture.find((t) => t.id === params.id);
    if (!trf) return error("TARIFF_NOT_FOUND", "تعرفه مورد نظر یافت نشد", 404);
    const body = (await request.json()) as Record<string, unknown>;
    Object.assign(trf, body);
    return HttpResponse.json({ success: true, data: trf });
  }),

  http.delete("/api/v1/tariffs/:id", async ({ params }) => {
    await delay(LATENCY());
    const idx = tariffsFixture.findIndex((t) => t.id === params.id);
    if (idx === -1) return error("TARIFF_NOT_FOUND", "تعرفه مورد نظر یافت نشد", 404);
    tariffsFixture.splice(idx, 1);
    return HttpResponse.json({ success: true, data: null });
  }),
];
