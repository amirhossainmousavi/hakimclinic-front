"use client";

import { CalendarDays, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { Appointment } from "@/features/appointments/types";
import { NewAppointmentForm } from "./NewAppointmentForm";
import { DayAppointmentList } from "./DayAppointmentList";

interface AppointmentDayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** ISO Gregorian date of the day, e.g. 2026-08-13 */
  dateIso: string;
  /** Persian date label for display in the title */
  dateLabelFa: string;
  appointments: Appointment[];
  onSelectAppointment: (appt: Appointment) => void;
}

export function AppointmentDayDialog({
  open,
  onOpenChange,
  dateIso,
  dateLabelFa,
  appointments,
  onSelectAppointment,
}: AppointmentDayDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>نوبت‌های {dateLabelFa}</DialogTitle>
          <DialogDescription>
            نوبت جدید ثبت کنید یا روی نوبت ثبت‌شده برای ویرایش کلیک کنید.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="new" dir="rtl" className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="new" className="gap-1.5">
              <CalendarDays className="size-4" />
              ثبت نوبت جدید
            </TabsTrigger>
            <TabsTrigger value="list" className="gap-1.5">
              <Users className="size-4" />
              بیماران ({appointments.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="new">
            <NewAppointmentForm
              dateIso={dateIso}
              onSuccess={() => onOpenChange(false)}
            />
          </TabsContent>

          <TabsContent value="list">
            <DayAppointmentList
              appointments={appointments}
              onSelect={onSelectAppointment}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
