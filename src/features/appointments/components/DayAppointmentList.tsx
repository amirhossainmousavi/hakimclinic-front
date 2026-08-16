"use client";

import { Badge } from "@/components/ui/badge";
import {
  APPOINTMENT_STATUS_LABELS,
  type Appointment,
} from "@/features/appointments/types";

const STATUS_VARIANT: Record<
  Appointment["status"],
  "default" | "warning" | "destructive" | "success"
> = {
  scheduled: "default",
  postponed: "warning",
  cancelled: "destructive",
  done: "success",
};

interface DayAppointmentListProps {
  appointments: Appointment[];
  onSelect: (appt: Appointment) => void;
}

export function DayAppointmentList({
  appointments,
  onSelect,
}: DayAppointmentListProps) {
  if (appointments.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        هنوز نوبتی برای این روز ثبت نشده است.
      </p>
    );
  }

  return (
    <div className="max-h-80 space-y-2 overflow-y-auto pe-1">
      {appointments.map((appt) => (
        <button
          key={appt.id}
          type="button"
          onClick={() => onSelect(appt)}
          className="w-full cursor-pointer rounded-xl border bg-card p-3 text-start transition-colors hover:bg-secondary/60"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-sm font-semibold">
              {appt.fullName}
            </span>
            <Badge variant={STATUS_VARIANT[appt.status]}>
              {APPOINTMENT_STATUS_LABELS[appt.status]}
            </Badge>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span>کد ملی: {appt.nationalCode}</span>
            <span>تلفن: {appt.phone}</span>
            <span>
              {appt.admissionType === "insured" ? "بیمه‌ای" : "آزاد"}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
