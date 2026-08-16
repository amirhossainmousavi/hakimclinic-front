"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Banknote,
  BellRing,
  Building2,
  CalendarDays,
  ChevronLeft,
  FileText,
  Package,
  Send,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard } from "@/components/design-system/StatCard";
import { PatientListItem } from "@/components/design-system/PatientListItem";
import { EmptyState } from "@/components/design-system/EmptyState";
import { RevenueAreaChart } from "@/features/dashboard/components/RevenueAreaChart";
import { useDashboardSummary } from "@/features/dashboard/hooks";
import { usePatientsList } from "@/features/patients/hooks";
import { useNotifications } from "@/features/notifications/hooks";
import { useAdmissionPlaces } from "@/features/admission-places/hooks";
import { NewPatientDialog } from "@/features/patients/components/NewPatientDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { formatToman } from "@/lib/utils";

const DAY = 24 * 60 * 60 * 1000;

export function ManagerDashboard() {
  const router = useRouter();
  const [newPatientOpen, setNewPatientOpen] = useState(false);
  const [placeFilter, setPlaceFilter] = useState<string>("all");

  const { data: summary, isLoading, isError } = useDashboardSummary();

  // ===== Section 4 — Recent patients + admission place filter (places the manager entered) =====
  const { data: patientsData, isLoading: isLoadingPatients } = usePatientsList({ limit: 50 });
  const { data: placesData, isLoading: isLoadingPlaces } = useAdmissionPlaces();
  const places = placesData ?? [];

  const recent7 = useMemo(() => {
    const cutoff = new Date(Date.now() - 7 * DAY).getTime();
    return (patientsData?.items ?? [])
      .filter((p) => new Date(p.createdAt).getTime() >= cutoff)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [patientsData]);
  const placePatients = useMemo(
    () =>
      recent7.filter(
        (p) => placeFilter === "all" || p.admissionPlaceId === placeFilter
      ),
    [recent7, placeFilter]
  );

  // ===== Section 5 — Notifications + secretaries =====
  const { data: notifications, isLoading: isLoadingNotifications } = useNotifications();
  const latestNotifications = useMemo(
    () => [...(notifications ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4),
    [notifications]
  );
  // Secretaries column — COMMENTED OUT: the last_active_at field does not exist on User/Secretary.
  // The code for this column is commented out further down the page; it requires a backend last_active_at field.

  const goPatients = (status?: string) => {
    router.push(status ? `/patients?status=${status}` : "/patients");
  };

  const growth = summary?.revenueGrowthPercent;

  return (
    <div className="space-y-6">
      {/* ===== Section 1 — Today's KPI ===== */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="درآمد امروز"
          value={isLoading ? "…" : `${formatToman(summary?.todayRevenue ?? 0)}`}
          icon={Banknote}
          hint="تومان"
          tone="blue"
        />
        <StatCard
          label="پذیرش امروز"
          value={isLoading ? "…" : String(summary?.todayAdmissions ?? 0)}
          icon={Users}
          hint="بیمار جدید"
          tone="green"
        />
        <StatCard
          label="نوبت امروز"
          value={isLoading ? "…" : String(summary?.todayAppointments ?? 0)}
          icon={CalendarDays}
          hint="نوبت‌های ثبت‌شده"
          tone="amber"
        />
        <div onClick={() => goPatients("ready_for_delivery")} className="cursor-pointer">
          <StatCard
            label="آماده تحویل"
            value={isLoading ? "…" : String(summary?.readyForDelivery ?? 0)}
            icon={Package}
            hint="تحویل نشده — کلیک کنید"
            tone="indigo"
          />
        </div>
      </div>

      {/* ===== Section 2 — 30-day revenue chart ===== */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-base">درآمد ۳۰ روز اخیر</CardTitle>
            {!isLoading && growth !== null && growth !== undefined && (
              <span
                className={
                  "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium " +
                  (growth >= 0
                    ? "bg-success/10 text-success"
                    : "bg-destructive/10 text-destructive")
                }
              >
                {growth >= 0 ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
                {growth >= 0 ? "▲" : "▼"} {Math.abs(growth)}٪ نسبت به دوره قبل
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isError ? (
            <p className="py-10 text-center text-sm text-muted-foreground">خطا در دریافت داده</p>
          ) : isLoading ? (
            <Skeleton className="h-64 w-full rounded-xl" />
          ) : (
            <RevenueAreaChart data={summary?.revenue30d ?? []} />
          )}
        </CardContent>
      </Card>

      {/* ===== Section 3 + 4 — Items needing follow-up (right) + recent patients (left) in one row ===== */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="size-5 text-warning" />
              موارد نیازمند پیگیری
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))}
              </div>
            ) : (summary?.alerts ?? []).slice(0, 2).length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                موردی برای نمایش وجود ندارد
              </p>
            ) : (
              (summary?.alerts ?? []).slice(0, 2).map((alert) => (
                <button
                  key={alert.type}
                  type="button"
                  onClick={() => goPatients("pending_insurance_approval")}
                  className="flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-start transition-colors hover:bg-muted/40"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-warning/15 text-warning">
                    <AlertTriangle className="size-4" />
                  </span>
                  <span className="flex-1 text-sm">
                    <strong className="tabular-nums">{alert.count}</strong> بیمار بیش از ۲ روز در انتظار
                    تاییدیه بیمه هستند
                  </span>
                  <ChevronLeft className="size-4 text-muted-foreground" />
                </button>
              ))
            )}
            {/* SMS alert — COMMENTED OUT: the smsSentAt field does not exist on Patient.
                Requires adding the field to the backend schema and the mock fixture. */}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">بیماران اخیر (۷ روز گذشته)</CardTitle>
            <Tabs value={placeFilter} onValueChange={setPlaceFilter}>
              <TabsList className="h-auto flex-wrap">
                <TabsTrigger value="all" className="text-xs">همه</TabsTrigger>
                {places.map((p) => (
                  <TabsTrigger key={p.id} value={p.id} className="text-xs">
                    {p.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            {isLoadingPatients || isLoadingPlaces ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="size-11 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3.5 w-40" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                ))}
              </div>
            ) : placePatients.length === 0 ? (
              <EmptyState title="بیماری یافت نشد" description="در ۷ روز گذشته بیماری در این محل پذیرش نشده است." />
            ) : (
              <div className="space-y-2">
                {placePatients.map((p) => (
                  <PatientListItem key={p.id} patient={p} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ===== Section 5 — Bottom row (right: notifications / left: quick actions) ===== */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BellRing className="size-5 text-primary" />
              آخرین اطلاعیه‌ها
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoadingNotifications ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-xl" />
                ))}
              </div>
            ) : latestNotifications.length === 0 ? (
              <EmptyState title="اطلاعیه‌ای وجود ندارد" description="هنوز اطلاعیه‌ای منتشر نشده است." />
            ) : (
              latestNotifications.map((n) => (
                <div key={n.id} className="flex items-start gap-3 rounded-xl border px-4 py-3">
                  <span className="mt-0.5 text-sm">{n.message}</span>
                  <span className="ms-auto shrink-0 text-xs text-muted-foreground">
                    {new Date(n.createdAt).toLocaleDateString("fa-IR")}
                  </span>
                </div>
              ))
            )}
            <Button variant="outline" size="sm" className="w-full" onClick={() => router.push("/notifications")}>
              مشاهده همه اطلاعیه‌ها
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">عملیات سریع</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => setNewPatientOpen(true)}
                className="group flex flex-col items-center gap-2 rounded-2xl border bg-gradient-to-b from-primary/10 to-transparent p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
              >
                <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-110">
                  <UserPlus className="size-5" />
                </span>
                <span className="text-xs font-semibold">پذیرش بیمار جدید</span>
              </button>
              <button
                type="button"
                onClick={() => router.push("/admission-places")}
                className="group flex flex-col items-center gap-2 rounded-2xl border bg-gradient-to-b from-teal-500/10 to-transparent p-4 transition-all hover:-translate-y-0.5 hover:border-teal-500/40 hover:shadow-md"
              >
                <span className="flex size-11 items-center justify-center rounded-xl bg-teal-500 text-white shadow-sm transition-transform group-hover:scale-110">
                  <Building2 className="size-5" />
                </span>
                <span className="text-xs font-semibold">محل پذیرش جدید</span>
              </button>
              <button
                type="button"
                onClick={() => router.push("/invoices")}
                className="group flex flex-col items-center gap-2 rounded-2xl border bg-gradient-to-b from-emerald-500/10 to-transparent p-4 transition-all hover:-translate-y-0.5 hover:border-emerald-500/40 hover:shadow-md"
              >
                <span className="flex size-11 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-sm transition-transform group-hover:scale-110">
                  <FileText className="size-5" />
                </span>
                <span className="text-xs font-semibold">فاکتور جدید</span>
              </button>
              <button
                type="button"
                onClick={() => router.push("/insurances")}
                className="group flex flex-col items-center gap-2 rounded-2xl border bg-gradient-to-b from-rose-500/10 to-transparent p-4 transition-all hover:-translate-y-0.5 hover:border-rose-500/40 hover:shadow-md"
              >
                <span className="flex size-11 items-center justify-center rounded-xl bg-rose-500 text-white shadow-sm transition-transform group-hover:scale-110">
                  <ShieldCheck className="size-5" />
                </span>
                <span className="text-xs font-semibold">ثبت بیمه</span>
              </button>
              <button
                type="button"
                onClick={() => router.push("/notifications")}
                className="group flex flex-col items-center gap-2 rounded-2xl border bg-gradient-to-b from-indigo-500/10 to-transparent p-4 transition-all hover:-translate-y-0.5 hover:border-indigo-500/40 hover:shadow-md"
              >
                <span className="flex size-11 items-center justify-center rounded-xl bg-indigo-500 text-white shadow-sm transition-transform group-hover:scale-110">
                  <Send className="size-5" />
                </span>
                <span className="text-xs font-semibold">ثبت اطلاعیه</span>
              </button>
              <button
                type="button"
                onClick={() => router.push("/expenses")}
                className="group flex flex-col items-center gap-2 rounded-2xl border bg-gradient-to-b from-amber-500/10 to-transparent p-4 transition-all hover:-translate-y-0.5 hover:border-amber-500/40 hover:shadow-md"
              >
                <span className="flex size-11 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm transition-transform group-hover:scale-110">
                  <Wallet className="size-5" />
                </span>
                <span className="text-xs font-semibold">ثبت هزینه</span>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      <NewPatientDialog open={newPatientOpen} onOpenChange={setNewPatientOpen} />
    </div>
  );
}
