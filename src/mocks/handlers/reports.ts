import { delay, http, HttpResponse } from "msw";
import { invoicesFixture } from "@/mocks/fixtures/invoices";
import { patientsFixture } from "@/mocks/fixtures/patients";
import type { RevenueChartPoint, RevenueReport, RevenueSummary } from "@/features/reports/types";

const LATENCY = () => Math.floor(Math.random() * 500) + 300;

export const reportHandlers = [
  http.get("/api/v1/reports/revenue", async ({ request }) => {
    await delay(LATENCY());
    const url = new URL(request.url);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const paymentType = url.searchParams.get("paymentType");
    const admissionPlaceId = url.searchParams.get("admissionPlaceId");
    const min = url.searchParams.get("min");
    const max = url.searchParams.get("max");

    const placeByPatient = new Map(patientsFixture.map((p) => [p.id, p.admissionPlaceId]));

    let rows = invoicesFixture.filter((iv) => iv.invoiceType === "final");
    if (from) rows = rows.filter((iv) => iv.createdAt >= from);
    if (to) rows = rows.filter((iv) => iv.createdAt <= to);
    if (paymentType) rows = rows.filter((iv) => iv.paymentType === paymentType);
    if (admissionPlaceId) {
      rows = rows.filter((iv) => placeByPatient.get(iv.patientId) === admissionPlaceId);
    }
    if (min) rows = rows.filter((iv) => iv.totalAmount >= Number(min));
    if (max) rows = rows.filter((iv) => iv.totalAmount <= Number(max));

    const proFormaRows = invoicesFixture.filter(
      (iv) => iv.invoiceType === "pro_forma" && (!admissionPlaceId || placeByPatient.get(iv.patientId) === admissionPlaceId)
    );

    const summary: RevenueSummary = {
      totalAmount: rows.reduce((s, iv) => s + iv.totalAmount, 0),
      count: rows.length,
      proFormaCount: proFormaRows.length,
      finalCount: rows.length,
      byPaymentType: {
        card_to_card: {
          count: rows.filter((iv) => iv.paymentType === "card_to_card").length,
          total: rows.filter((iv) => iv.paymentType === "card_to_card").reduce((s, iv) => s + iv.totalAmount, 0),
        },
        pos: {
          count: rows.filter((iv) => iv.paymentType === "pos").length,
          total: rows.filter((iv) => iv.paymentType === "pos").reduce((s, iv) => s + iv.totalAmount, 0),
        },
        bank_transfer: {
          count: rows.filter((iv) => iv.paymentType === "bank_transfer").length,
          total: rows.filter((iv) => iv.paymentType === "bank_transfer").reduce((s, iv) => s + iv.totalAmount, 0),
        },
      },
    };

    // Chart points by day (from the existing invoices)
    const byDay = new Map<string, number>();
    for (const iv of rows) {
      const day = iv.createdAt.slice(0, 10);
      byDay.set(day, (byDay.get(day) ?? 0) + iv.totalAmount);
    }
    const chart: RevenueChartPoint[] = [...byDay.entries()]
      .map(([date, total]) => ({ date, total }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-12);

    const report: RevenueReport = { summary, chart };
    return HttpResponse.json({ success: true, data: report });
  }),
];
