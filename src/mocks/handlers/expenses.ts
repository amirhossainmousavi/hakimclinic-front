import { delay, http, HttpResponse } from "msw";
import { expensesFixture } from "@/mocks/fixtures/expenses";
import { admissionPlacesFixture } from "@/mocks/fixtures/admission-places";
import { getCurrentUser } from "@/lib/auth";
import { shiftMonth, toGregorian, toJalali } from "@/lib/jalali";
import type { MonthlyComparisonEntry, MonthlyChartPoint } from "@/features/expenses/types";

const LATENCY = () => Math.floor(Math.random() * 500) + 300;

const error = (code: string, message: string, status: number, details: unknown = null) =>
  HttpResponse.json({ success: false, error: { code, message, details } }, { status });

const MONTHS_FA = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور"];

/** مراکزی که منشی به آن‌ها دسترسی دارد؛ برای مدیر null (همه مراکز) */
function allowedPlaces(): string[] | null {
  const user = getCurrentUser();
  if (!user || user.role === "manager") return null;
  return user.scopes ?? [];
}

/** کلید روز شمسی «ماه/روز» برای نقطهٔ نمودار */
function monthDayKey(date: Date): string {
  const j = toJalali(date);
  return `${j.month + 1}/${j.day}`;
}

/** طول ماه شمسی (ماه ۰-پایه) */
function jalaliMonthLength(year: number, month: number): number {
  const next = toGregorian({ year, month: month + 1, day: 1 });
  const cur = toGregorian({ year, month, day: 1 });
  return Math.round((next.getTime() - cur.getTime()) / 86400000);
}

export const expenseHandlers = [
  http.get("/api/v1/expenses", async ({ request }) => {
    await delay(LATENCY());
    const url = new URL(request.url);
    const type = url.searchParams.get("type");
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const search = url.searchParams.get("search")?.trim();
    const admissionPlaceId = url.searchParams.get("admissionPlaceId");
    const page = Number(url.searchParams.get("page") ?? 1);
    const limit = Number(url.searchParams.get("limit") ?? 10);

    let rows = expensesFixture;
    if (type) rows = rows.filter((e) => e.type === type);
    if (from) rows = rows.filter((e) => e.createdAt >= from);
    if (to) rows = rows.filter((e) => e.createdAt <= to);
    const scopes = allowedPlaces();
    if (admissionPlaceId) {
      rows = rows.filter((e) => e.type === "daily" && e.admissionPlaceId === admissionPlaceId);
    } else if (scopes) {
      rows = rows.filter((e) => e.type !== "daily" || (e.admissionPlaceId && scopes.includes(e.admissionPlaceId)));
    }
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((e) => {
        const title = e.title.toLowerCase();
        const company = e.type === "company" ? e.companyName.toLowerCase() : "";
        const part = e.type === "company" ? e.partName.toLowerCase() : "";
        return title.includes(q) || company.includes(q) || part.includes(q);
      });
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

  http.post("/api/v1/expenses/daily", async ({ request }) => {
    await delay(LATENCY());
    const body = (await request.json()) as Record<string, unknown>;
    const missing: Record<string, string> = {};
    for (const key of ["title", "amount", "expenseDate"]) {
      if (body[key] === undefined || body[key] === null || body[key] === "") missing[key] = "این فیلد الزامی است";
    }
    if (Object.keys(missing).length) return error("VALIDATION_ERROR", "داده ورودی معتبر نیست", 400, missing);

    const placeId = typeof body.admissionPlaceId === "string" ? body.admissionPlaceId : null;
    const place = admissionPlacesFixture.find((p) => p.id === placeId);
    const scopes = allowedPlaces();
    // منشی فقط برای مراکز خودش می‌تواند ثبت کند
    if (scopes && (!placeId || !scopes.includes(placeId))) {
      return error("FORBIDDEN", "دسترسی به این مرکز ندارید", 403);
    }

    const newExpense = {
      id: crypto.randomUUID(),
      type: "daily" as const,
      title: String(body.title),
      amount: Number(body.amount),
      expenseDate: String(body.expenseDate),
      admissionPlaceId: placeId,
      admissionPlaceName: place?.name ?? null,
      description: typeof body.description === "string" ? body.description : null,
      createdAt: new Date().toISOString(),
    };
    expensesFixture.unshift(newExpense);
    return HttpResponse.json({ success: true, data: newExpense }, { status: 201 });
  }),

  http.post("/api/v1/expenses/company", async ({ request }) => {
    await delay(LATENCY());
    const body = (await request.json()) as Record<string, unknown>;
    const missing: Record<string, string> = {};
    for (const key of ["title", "companyName", "amount", "invoiceDate"]) {
      if (body[key] === undefined || body[key] === null || body[key] === "") missing[key] = "این فیلد الزامی است";
    }
    if (Object.keys(missing).length) return error("VALIDATION_ERROR", "داده ورودی معتبر نیست", 400, missing);

    const quantity = Number(body.quantity ?? 1);
    const unitAmount = Number(body.unitAmount ?? 0);
    const newExpense = {
      id: crypto.randomUUID(),
      type: "company" as const,
      title: String(body.title),
      companyName: String(body.companyName),
      amount: Number(body.amount),
      invoiceDate: String(body.invoiceDate),
      partName: String(body.partName ?? ""),
      quantity,
      unitAmount,
      description: typeof body.description === "string" ? body.description : null,
      createdAt: new Date().toISOString(),
    };
    expensesFixture.unshift(newExpense);
    return HttpResponse.json({ success: true, data: newExpense }, { status: 201 });
  }),

  http.get("/api/v1/expenses/monthly-comparison", async () => {
    await delay(LATENCY());
    const data: MonthlyComparisonEntry[] = MONTHS_FA.map((month, i) => ({
      month,
      dailyTotal: Math.round(30_000_000 + i * 9_000_000 + Math.random() * 5_000_000),
      companyTotal: Math.round(60_000_000 + i * 15_000_000 + Math.random() * 20_000_000),
    }));
    return HttpResponse.json({ success: true, data });
  }),

  // نمودار هزینه‌ها — دو خط: ماه جاری + ماه قبل (فقط مدیر)
  http.get("/api/v1/expenses/monthly-chart", async ({ request }) => {
    await delay(LATENCY());
    const url = new URL(request.url);
    const admissionPlaceId = url.searchParams.get("admissionPlaceId");

    let rows = expensesFixture.filter((e) => e.type === "daily");
    if (admissionPlaceId) rows = rows.filter((e) => e.admissionPlaceId === admissionPlaceId);

    const now = new Date();
    const j = toJalali(now);
    const currentStart = toGregorian({ year: j.year, month: j.month, day: 1 });
    const currentLen = jalaliMonthLength(j.year, j.month);
    const prev = shiftMonth(j.year, j.month, -1);
    const previousStart = toGregorian({ year: prev.year, month: prev.month, day: 1 });

    const bucketize = (from: Date, len: number) => {
      const map = new Map<string, number>();
      for (let i = 0; i < len; i++) {
        map.set(monthDayKey(new Date(from.getTime() + i * 86400000)), 0);
      }
      for (const r of rows) {
        const key = monthDayKey(new Date(r.expenseDate));
        if (map.has(key)) map.set(key, (map.get(key) ?? 0) + r.amount);
      }
      return map;
    };

    const current = bucketize(currentStart, currentLen);
    const previous = bucketize(previousStart, currentLen);

    const chart: MonthlyChartPoint[] = Array.from({ length: currentLen }, (_, i) => {
      const date = new Date(currentStart.getTime() + i * 86400000);
      const key = monthDayKey(date);
      return {
        date: key,
        current: current.get(key) ?? 0,
        previous: previous.get(key) ?? 0,
      };
    });

    return HttpResponse.json({ success: true, data: chart });
  }),
];
