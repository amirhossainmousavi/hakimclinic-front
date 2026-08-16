import { delay, http, HttpResponse } from "msw";
import { patientsFixture } from "@/mocks/fixtures/patients";
import { appointmentsFixture } from "@/mocks/fixtures/appointments";
import { invoicesFixture } from "@/mocks/fixtures/invoices";
import type { DashboardSummary } from "@/features/dashboard/types";

const LATENCY = () => Math.floor(Math.random() * 500) + 300;

function startOfToday(): number {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

const DAY = 24 * 60 * 60 * 1000;

/** Total final invoices per day within a date range. No zero days */
function revenueByDay(rows: typeof invoicesFixture, from: number): { date: string; total: number }[] {
  const byDay = new Map<string, number>();
  for (const iv of rows) {
    const t = new Date(iv.createdAt).getTime();
    if (t < from) continue;
    const day = new Date(t);
    const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
    byDay.set(key, (byDay.get(key) ?? 0) + iv.totalAmount);
  }
  return [...byDay.entries()]
    .map(([date, total]) => ({ date, total }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function sumRevenue(rows: typeof invoicesFixture, from: number, to: number): number {
  return rows.reduce((s, iv) => {
    const t = new Date(iv.createdAt).getTime();
    return t >= from && t <= to ? s + iv.totalAmount : s;
  }, 0);
}

export const dashboardHandlers = [
  http.get("/api/v1/dashboard/summary", async () => {
    await delay(LATENCY());

    const todayStart = startOfToday();
    const todayEnd = todayStart + DAY - 1;

    const finalInvoices = invoicesFixture.filter((iv) => iv.invoiceType === "final");

    const todayAdmissions = patientsFixture.filter(
      (p) => new Date(p.createdAt).getTime() >= todayStart
    ).length;

    const todayAppointments = appointmentsFixture.filter((a) => {
      const t = new Date(a.appointmentDate).getTime();
      return t >= todayStart && t <= todayEnd;
    }).length;

    const todayRevenue = sumRevenue(finalInvoices, todayStart, todayEnd);
    const readyForDelivery = patientsFixture.filter(
      (p) => p.status === "ready_for_delivery"
    ).length;

    const revenue30d = revenueByDay(finalInvoices, todayStart - 29 * DAY);
    const current30 = sumRevenue(finalInvoices, todayStart - 29 * DAY, todayEnd);
    const prev30 = sumRevenue(finalInvoices, todayStart - 59 * DAY, todayStart - DAY);
    const revenueGrowthPercent =
      prev30 > 0 ? Math.round(((current30 - prev30) / prev30) * 100) : null;

    // Alert: patients waiting for insurance approval with a record older than 48 hours.
    // The mock uses createdAt — the real backend should use patient_status_history.changedAt
    const insuranceOverdue = patientsFixture.filter((p) => {
      if (p.status !== "pending_insurance_approval") return false;
      return todayStart - new Date(p.createdAt).getTime() > 48 * 60 * 60 * 1000;
    }).length;

    const summary: DashboardSummary = {
      todayRevenue,
      todayAdmissions,
      todayAppointments,
      readyForDelivery,
      revenue30d,
      revenueGrowthPercent,
      alerts: [{ type: "insurance_overdue", count: insuranceOverdue }],
    };

    return HttpResponse.json({ success: true, data: summary });
  }),
];
