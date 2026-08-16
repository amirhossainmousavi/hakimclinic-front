"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Package, PhoneCall, Search, UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard } from "@/components/design-system/StatCard";
import { EmptyState } from "@/components/design-system/EmptyState";
import { PatientListItem } from "@/components/design-system/PatientListItem";
import { hasPermission } from "@/lib/auth";
import { toJalaliString } from "@/lib/jalali";
import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth/context";
import { useNotifications } from "@/features/notifications/hooks";
import { usePatientsList } from "@/features/patients/hooks";
import { useAppointmentsList } from "@/features/appointments/hooks";
import { PATIENT_STATUS_LABELS, type PatientStatus } from "@/features/patients/types";
import { NewPatientDialog } from "@/features/patients/components/NewPatientDialog";
import { Skeleton } from "@/components/ui/skeleton";

const DAY = 24 * 60 * 60 * 1000;

/** Current day as a UTC date (to match the fixtures' createdAt) */
function todayUTCKey(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "همه" },
  ...Object.entries(PATIENT_STATUS_LABELS).map(([value, label]) => ({ value, label })),
];

export function SecretaryDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [newPatientOpen, setNewPatientOpen] = useState(false);

  const hasAppt = hasPermission("appointments", user?.role, user?.permissions);

  // ===== Section 1 — Today's announcement banner =====
  const { data: notifications, isLoading: isLoadingNotifications } = useNotifications();
  const todayNtf = useMemo(() => {
    if (!notifications) return null;
    const key = todayUTCKey();
    return (
      notifications
        .filter(
          (n) =>
            n.createdAt.slice(0, 10) === key && n.createdByUserName === "مدیر کلینیک"
        )
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null
    );
  }, [notifications]);

  // ===== Section 2 — Stats =====
  const todayIsoStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }, []);
  const todayEnd = useMemo(() => new Date(Date.now() + DAY).toISOString(), []);

  const { data: todayAppts, isLoading: isLoadingToday } = useAppointmentsList({
    from: todayIsoStart,
    to: todayEnd,
    limit: 200,
  });
  const { data: patientsData, isLoading: isLoadingPatients } = usePatientsList({ limit: 50 });
  const patients = patientsData?.items ?? [];

  const todayVisits = todayAppts?.items.length ?? 0;
  const pendingInsurance = patients.filter(
    (p) => p.status === "pending_insurance_approval"
  ).length;
  const readyForDelivery = patients.filter((p) => p.status === "ready_for_delivery").length;

  // ===== Section 3 — Tomorrow reminder (appointments permission only) =====
  const tomorrowStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 1);
    return d.toISOString();
  }, []);
  const tomorrowEnd = useMemo(() => new Date(Date.parse(tomorrowStart) + DAY).toISOString(), [tomorrowStart]);
  const { data: tomorrowAppts, isLoading: isLoadingTomorrow } = useAppointmentsList({
    from: tomorrowStart,
    to: tomorrowEnd,
    limit: 200,
  });
  const tomorrowList = tomorrowAppts?.items ?? [];
  const [calledApptIds, setCalledApptIds] = useState<Set<string>>(new Set());

  const toggleCalled = (id: string) => {
    setCalledApptIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ===== Section 4 — This secretary's recent patients =====
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 1000);
    return () => clearTimeout(t);
  }, [searchInput]);

  const sevenDaysAgo = useMemo(() => new Date(Date.now() - 7 * DAY).getTime(), []);

  const myRecentPatients = useMemo(() => {
    if (!user?.sub) return [];
    return patients
      .filter(
        (p) =>
          p.admittedByUserId === user.sub &&
          new Date(p.createdAt).getTime() >= sevenDaysAgo
      )
      .filter((p) => {
        if (statusFilter !== "all" && p.status !== statusFilter) return false;
        if (!search) return true;
        return (
          p.fullName.includes(search) || p.nationalCode.includes(search)
        );
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [patients, user?.sub, sevenDaysAgo, statusFilter, search]);

  return (
    <div className="space-y-6 pb-24">
      {/* ===== Section 1 — Day announcement banner ===== */}
      {todayNtf && (
        <div className="rounded-2xl gradient-primary p-4 text-white shadow-glow">
          <p className="text-xs font-medium opacity-80">اطلاعیه امروز</p>
          <p className="mt-1 text-sm font-semibold leading-relaxed">{todayNtf.message}</p>
        </div>
      )}

      {/* ===== Section 2 — Stats ===== */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {isLoadingToday || isLoadingPatients ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl border bg-card p-5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="mt-3 h-8 w-16" />
              <Skeleton className="mt-2 h-3 w-32" />
            </div>
          ))
        ) : (
          <>
            <StatCard
              label="بازدید امروز"
              value={todayVisits}
              icon={Clock}
              hint="نوبت‌های امروز"
              tone="blue"
            />
            <div onClick={() => router.push("/patients?status=pending_insurance_approval")} className="cursor-pointer">
              <StatCard
                label="در انتظار تاییدیه بیمه"
                value={pendingInsurance}
                icon={Clock}
                hint="برای مشاهده کلیک کنید"
                tone="amber"
              />
            </div>
            <div onClick={() => router.push("/patients?status=ready_for_delivery")} className="cursor-pointer">
              <StatCard
                label="آماده تحویل"
                value={readyForDelivery}
                icon={Package}
                hint="تحویل نشده"
                tone="indigo"
              />
            </div>
          </>
        )}
      </div>

      {/* ===== Section 3 — Tomorrow call reminders (appointments permission only) ===== */}
      {hasAppt && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <PhoneCall className="size-5 text-primary" />
              یادآوری تماس - نوبت‌های فردا
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingTomorrow ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3.5 w-36" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-6 w-24" />
                  </div>
                ))}
              </div>
            ) : tomorrowList.length === 0 ? (
              <EmptyState
                title="نوبتی برای فردا ثبت نشده"
                description="برای ثبت نوبت به بخش نوبت‌دهی مراجعه کنید."
              />
            ) : (
              <div className="space-y-2">
                {tomorrowList.map((a) => {
                  const called = calledApptIds.has(a.id);
                  return (
                    <div
                      key={a.id}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors",
                        called ? "border-success/30 bg-success/5" : "bg-card"
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <p className={cn("truncate text-sm font-medium", called && "text-muted-foreground line-through")}>
                          {a.fullName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {a.appointmentTime ? `ساعت ${a.appointmentTime}` : "بدون ساعت"} • {toJalaliString(new Date(a.appointmentDate))}
                        </p>
                      </div>
                      <label className="flex cursor-pointer items-center gap-2 text-sm">
                        <Checkbox
                          checked={called}
                          onCheckedChange={() => toggleCalled(a.id)}
                        />
                        <span className={cn(called && "text-muted-foreground line-through")}>تماس گرفته شد</span>
                      </label>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ===== Section 4 — This secretary's recent patients ===== */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">بیماران اخیر شما (۷ روز گذشته)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Input
              icon={Search}
              placeholder="جست‌وجو بر اساس نام یا کدملی…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="max-w-sm"
            />
            <Tabs value={statusFilter} onValueChange={setStatusFilter}>
              <TabsList className="h-auto flex-wrap">
                {STATUS_FILTERS.map((t) => (
                  <TabsTrigger key={t.value} value={t.value} className="text-xs">
                    {t.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {isLoadingPatients ? (
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
          ) : myRecentPatients.length === 0 ? (
            <EmptyState
              title="بیماری یافت نشد"
              description="در ۷ روز گذشته بیماری در این فیلتر ثبت نکرده‌اید."
            />
          ) : (
            <div className="space-y-2">
              {myRecentPatients.map((p) => (
                <PatientListItem key={p.id} patient={p} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ===== Section 5 — Floating new patient admission button ===== */}
      <div className="fixed bottom-5 start-1/2 z-20 w-[calc(100%-2.5rem)] max-w-sm -translate-x-1/2 lg:start-auto lg:end-6 lg:w-auto lg:translate-x-0">
        <Button
          className="w-full shadow-xl"
          onClick={() => setNewPatientOpen(true)}
        >
          <UserPlus className="size-4" />
          پذیرش بیمار جدید
        </Button>
      </div>

      <NewPatientDialog open={newPatientOpen} onOpenChange={setNewPatientOpen} />
    </div>
  );
}
