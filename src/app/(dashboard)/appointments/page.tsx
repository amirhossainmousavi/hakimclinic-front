"use client";

import { useMemo, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
} from "lucide-react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { PageHeader } from "@/components/design-system/PageHeader";
import { ErrorState } from "@/components/design-system/ErrorState";
import { AppointmentCalendarSkeleton } from "@/components/skeletons/AppointmentCalendarSkeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  toJalali,
  toGregorian,
  getJalaliMonthLength,
  getJalaliWeekday,
  formatJalaliMonthYear,
  shiftMonth,
  JALALI_MONTH_NAMES,
  WEEKDAY_LABELS_FA,
} from "@/lib/jalali";
import { useAppointmentsList } from "@/features/appointments/hooks";
import type { Appointment } from "@/features/appointments/types";
import { AppointmentDayDialog } from "@/features/appointments/components/AppointmentDayDialog";
import { EditAppointmentDialog } from "@/features/appointments/components/EditAppointmentDialog";

export default function AppointmentsPage() {
  return (
    <RoleGuard permission="appointments">
      <AppointmentsContent />
    </RoleGuard>
  );
}

/** Current Jalali day — computed once */
const todayJalali = (() => {
  const now = new Date();
  return toJalali(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())));
})();

function AppointmentsContent() {
  const queryClient = useQueryClient();
  const [calYear, setCalYear] = useState(todayJalali.year);
  const [calMonth, setCalMonth] = useState(todayJalali.month);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // Day appointments dialog
  const [dayDialogOpen, setDayDialogOpen] = useState(false);
  const [dayDialogDate, setDayDialogDate] = useState({ iso: "", labelFa: "" });

  // Appointment edit dialog
  const [editAppointment, setEditAppointment] = useState<Appointment | null>(null);

  // Fetch all appointments of the current calendar month — from/to range
  const rangeStart = toGregorian({ year: calYear, month: calMonth, day: 1 });
  const lastDay = getJalaliMonthLength(calYear, calMonth);
  const rangeEnd = toGregorian({ year: calYear, month: calMonth, day: lastDay });
  // One day before start and one after end for overlap
  const rangeFrom = new Date(rangeStart.getTime() - 86400000).toISOString();
  const rangeTo = new Date(rangeEnd.getTime() + 86400000).toISOString();

  const { data, isLoading, isError } = useAppointmentsList({
    from: rangeFrom,
    to: rangeTo,
    limit: 200,
  });

  const groupedAppointments = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    if (!data) return map;
    for (const appt of data.items) {
      const d = new Date(appt.appointmentDate);
      const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(appt);
    }
    return map;
  }, [data]);

  /** Click on a calendar cell — open the day appointments dialog */
  const openDayDialog = useCallback(
    (jDay: number) => {
      const j = toJalali(
        toGregorian({ year: calYear, month: calMonth, day: jDay })
      );
      const dateStr = `${j.year}/${String(j.month + 1).padStart(2, "0")}/${String(j.day).padStart(2, "0")}`;
      const isoStr = toGregorian({ year: calYear, month: calMonth, day: jDay })
        .toISOString()
        .slice(0, 10);
      setDayDialogDate({ iso: isoStr, labelFa: dateStr });
      setSelectedDay(jDay);
      setDayDialogOpen(true);
    },
    [calYear, calMonth]
  );

  /** Select an appointment from the Tab 2 list — close the day dialog and open edit */
  const onSelectAppointment = useCallback((appt: Appointment) => {
    setDayDialogOpen(false);
    setEditAppointment(appt);
  }, []);

  const onDayDialogOpenChange = useCallback((open: boolean) => {
    setDayDialogOpen(open);
    if (!open) setSelectedDay(null);
  }, []);

  /** Go to the previous month */
  const prevMonth = () => {
    const s = shiftMonth(calYear, calMonth, -1);
    setCalYear(s.year);
    setCalMonth(s.month);
    setSelectedDay(null);
  };

  /** Go to the next month */
  const nextMonth = () => {
    const s = shiftMonth(calYear, calMonth, 1);
    setCalYear(s.year);
    setCalMonth(s.month);
    setSelectedDay(null);
  };

  /** Jump back to the current month */
  const goToday = () => {
    setCalYear(todayJalali.year);
    setCalMonth(todayJalali.month);
    setSelectedDay(null);
  };

  // ===== Build the month grid =====
  const gridData = useMemo(() => {
    const firstDayDate = toGregorian({ year: calYear, month: calMonth, day: 1 });
    const firstWeekday = getJalaliWeekday(firstDayDate); // 0=Saturday
    const length = getJalaliMonthLength(calYear, calMonth);
    const days: number[] = [];
    for (let i = 0; i < firstWeekday; i++) {
      days.push(0); // empty cell
    }
    for (let d = 1; d <= length; d++) {
      days.push(d);
    }
    return days;
  }, [calYear, calMonth]);

  if (isLoading) return <AppointmentCalendarSkeleton />;
  if (isError)
    return (
      <div className="space-y-6">
        <PageHeader
          title="نوبت‌دهی"
          description="مدیریت نوبت‌های بیماران"
          breadcrumb={["پنل مدیریت", "نوبت‌دهی"]}
        />
        <ErrorState
          onRetry={() =>
            queryClient.invalidateQueries({ queryKey: ["appointments"] })
          }
        />
      </div>
    );

  return (
    <div className="space-y-6">
      <PageHeader
        title="نوبت‌دهی"
        description="مدیریت نوبت‌های بیماران"
        breadcrumb={["پنل مدیریت", "نوبت‌دهی"]}
      />

      {/* ===== Desktop/tablet calendar ===== */}
      <div className="hidden overflow-hidden rounded-2xl border bg-card md:block">
        {/* Calendar header */}
        <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-5 text-primary" />
            <h2 className="text-lg font-semibold">
              {formatJalaliMonthYear(calYear, calMonth)}
            </h2>
          </div>
          <div className="flex items-center gap-1">
            <span
              className="cursor-pointer rounded-md px-2 py-1 text-xs font-medium text-primary underline-offset-2 hover:bg-primary/10 hover:underline"
              onClick={goToday}
            >
              ماه جاری
            </span>
            <Button variant="ghost" size="icon" onClick={prevMonth}>
              <ChevronRight className="size-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={nextMonth}>
              <ChevronLeft className="size-5" />
            </Button>
          </div>
        </div>

        {/* Weekday header row */}
        <div className="grid grid-cols-7 gap-px bg-border">
          {WEEKDAY_LABELS_FA.map((label) => (
            <div
              key={label}
              className="flex justify-center bg-muted/40 py-2 text-xs font-medium text-muted-foreground"
            >
              {label}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-px bg-border">
          {gridData.map((dayNum, idx) => {
            if (dayNum === 0) {
              return (
                <div key={`empty-${idx}`} className="min-h-28 rounded-lg bg-secondary/40" />
              );
            }
            const jDate = toGregorian({ year: calYear, month: calMonth, day: dayNum });
            const key = `${jDate.getUTCFullYear()}-${jDate.getUTCMonth()}-${jDate.getUTCDate()}`;
            const appts = groupedAppointments.get(key) ?? [];
            const isToday = dayNum === todayJalali.day && calMonth === todayJalali.month && calYear === todayJalali.year;
            const isSelected = dayNum === selectedDay;

            return (
              <div
                key={key}
                onClick={() => openDayDialog(dayNum)}
                className={cn(
                  "flex min-h-28 cursor-pointer flex-col gap-1 rounded-lg bg-secondary p-2 transition-colors hover:bg-secondary/80",
                  isSelected && "ring-2 ring-inset ring-primary"
                )}
              >
                <span
                  className={cn(
                    "ms-auto text-xs font-medium text-foreground",
                    isToday && "flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground"
                  )}
                >
                  {dayNum}
                </span>
                <div className="flex flex-col gap-0.5">
                  {appts.slice(0, 3).map((appt) => (
                    <span
                      key={appt.id}
                      className="truncate rounded-full bg-primary/10 px-1.5 py-0.5 text-[11px] leading-tight text-primary"
                    >
                      {appt.appointmentTime
                        ? `${appt.appointmentTime} · `
                        : ""}
                      {appt.fullName.length > 10
                        ? appt.fullName.slice(0, 10) + "…"
                        : appt.fullName}
                    </span>
                  ))}
                  {appts.length > 3 && (
                    <span className="text-[11px] text-muted-foreground">
                      +{appts.length - 3} بیشتر
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ===== Mobile list ===== */}
      <div className="space-y-3 md:hidden">
        {/* Header + controls */}
        <div className="flex items-center justify-between rounded-2xl border bg-card px-4 py-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-5 text-primary" />
            <h2 className="text-base font-semibold">
              {formatJalaliMonthYear(calYear, calMonth)}
            </h2>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="size-8" onClick={prevMonth}>
              <ChevronRight className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" className="size-8" onClick={nextMonth}>
              <ChevronLeft className="size-4" />
            </Button>
          </div>
        </div>

        {gridData
          .filter((d) => d !== 0)
          .map((dayNum) => {
            const jDate = toGregorian({ year: calYear, month: calMonth, day: dayNum });
            const key = `${jDate.getUTCFullYear()}-${jDate.getUTCMonth()}-${jDate.getUTCDate()}`;
            const appts = groupedAppointments.get(key) ?? [];
            const isToday =
              dayNum === todayJalali.day &&
              calMonth === todayJalali.month &&
              calYear === todayJalali.year;
            return (
              <div
                key={key}
                onClick={() => openDayDialog(dayNum)}
                className={cn(
                  "cursor-pointer rounded-2xl border p-4 transition-colors hover:bg-secondary/60",
                  isToday && "bg-secondary"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">
                    {JALALI_MONTH_NAMES[calMonth]} {dayNum}
                  </span>
                  {isToday && (
                    <span className="whitespace-nowrap rounded-full bg-primary px-2 py-0.5 text-[10px] text-primary-foreground">
                      امروز
                    </span>
                  )}
                </div>
                {appts.length > 0 ? (
                  <div className="mt-2 flex flex-col gap-1">
                    {appts.map((appt) => (
                      <div
                        key={appt.id}
                        className="flex items-center justify-between rounded-md bg-primary/10 px-3 py-1.5"
                      >
                        <span className="text-sm font-medium text-primary">
                          {appt.fullName}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    بدون نوبت — برای ثبت ضربه بزنید
                  </p>
                )}
              </div>
            );
          })}
      </div>

      {/* ===== Day appointments dialog ===== */}
      <AppointmentDayDialog
        open={dayDialogOpen}
        onOpenChange={onDayDialogOpenChange}
        dateIso={dayDialogDate.iso}
        dateLabelFa={dayDialogDate.labelFa}
        appointments={
          dayDialogDate.iso
            ? (() => {
                const d = new Date(dayDialogDate.iso);
                const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
                return groupedAppointments.get(key) ?? [];
              })()
            : []
        }
        onSelectAppointment={onSelectAppointment}
      />

      {/* ===== Appointment edit dialog ===== */}
      <EditAppointmentDialog
        open={editAppointment !== null}
        onOpenChange={(open) => {
          if (!open) setEditAppointment(null);
        }}
        appointment={editAppointment}
        onDeleted={() => setEditAppointment(null)}
      />
    </div>
  );
}
