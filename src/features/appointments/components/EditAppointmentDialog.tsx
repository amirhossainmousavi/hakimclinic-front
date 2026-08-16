"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CreditCard, Loader2, Phone, Trash2, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { JalaliDatePicker } from "@/components/ui/jalali-date-picker";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toEnglishDigits } from "@/lib/utils";
import {
  APPOINTMENT_STATUS_LABELS,
  type Appointment,
  type AppointmentStatus,
} from "@/features/appointments/types";
import {
  useDeleteAppointment,
  useUpdateAppointment,
} from "@/features/appointments/hooks";
import { useAdmissionPlaces } from "@/features/admission-places/hooks";

const schema = z.object({
  fullName: z.string().min(3, "نام بیمار الزامی است"),
  nationalCode: z.string().length(10, "کدملی باید ۱۰ رقم باشد"),
  phone: z.string().length(11, "شماره تلفن نامعتبر است"),
  birthDate: z.string().optional(),
  admissionType: z.enum(["free", "insured"]),
  admissionPlaceId: z.string().optional(),
  appointmentHour: z.string().optional(),
  appointmentMinute: z.string().optional(),
  appointmentDate: z.string().min(1, "تاریخ نوبت الزامی است"),
  status: z.enum(["scheduled", "postponed", "cancelled", "done"]),
});

type FormValues = z.infer<typeof schema>;

interface EditAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment | null;
  onDeleted?: () => void;
}

export function EditAppointmentDialog({
  open,
  onOpenChange,
  appointment,
  onDeleted,
}: EditAppointmentDialogProps) {
  const { data: places } = useAdmissionPlaces();
  const updateAppointment = useUpdateAppointment();
  const deleteAppointment = useDeleteAppointment();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // The backend has already filtered the list by role and scope
  const availablePlaces = places ?? [];

  const [appointmentHour, appointmentMinute] =
    appointment?.appointmentTime?.split(":") ?? ["", ""];

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (open && appointment) {
      reset({
        fullName: appointment.fullName,
        nationalCode: appointment.nationalCode,
        phone: appointment.phone,
        birthDate: appointment.birthDate?.slice(0, 10) ?? "",
        admissionType: appointment.admissionType,
        admissionPlaceId: appointment.admissionPlaceId ?? "",
        appointmentHour,
        appointmentMinute,
        appointmentDate: appointment.appointmentDate.slice(0, 10),
        status: appointment.status,
      });
      setConfirmingDelete(false);
    }
  }, [open, appointment, reset]);

  if (!appointment) return null;

  const isSaving = updateAppointment.isPending || deleteAppointment.isPending;
  const canSubmit = schema.safeParse(watch()).success;

  const onSubmit = handleSubmit(async (values) => {
    await updateAppointment.mutateAsync({
      id: appointment.id,
      input: {
        fullName: values.fullName,
        nationalCode: toEnglishDigits(values.nationalCode),
        phone: toEnglishDigits(values.phone),
        birthDate: values.birthDate || null,
        admissionType: values.admissionType,
        admissionPlaceId: values.admissionPlaceId || null,
        appointmentTime: values.appointmentHour
          ? `${values.appointmentHour}:${values.appointmentMinute || "00"}`
          : null,
        appointmentDate: new Date(values.appointmentDate).toISOString(),
        status: values.status,
      },
    });
    onOpenChange(false);
  });

  const onDelete = async () => {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    await deleteAppointment.mutateAsync(appointment.id);
    setConfirmingDelete(false);
    onDeleted?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>ویرایش نوبت</DialogTitle>
          <DialogDescription>
            اطلاعات نوبت و بیمار را ویرایش کنید.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4" dir="rtl" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-fullName">نام بیمار</Label>
              <Input id="edit-fullName" icon={User} {...register("fullName")} />
              {errors.fullName && (
                <p className="text-xs text-destructive">{errors.fullName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-nationalCode">کدملی</Label>
              <Input
                id="edit-nationalCode"
                icon={CreditCard}
                inputMode="numeric"
                {...register("nationalCode")}
              />
              {errors.nationalCode && (
                <p className="text-xs text-destructive">
                  {errors.nationalCode.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-phone">شماره تلفن</Label>
              <Input id="edit-phone" icon={Phone} inputMode="tel" {...register("phone")} />
              {errors.phone && (
                <p className="text-xs text-destructive">{errors.phone.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-birthDate">تاریخ تولد</Label>
              <JalaliDatePicker
                id="edit-birthDate"
                value={watch("birthDate") ?? ""}
                onChange={(v) => setValue("birthDate", v)}
                placeholder="انتخاب تاریخ تولد"
              />
            </div>
          </div>

          {availablePlaces.length > 0 && (
            <div className="space-y-2">
              <Label>محل پذیرش</Label>
              <Select
                value={watch("admissionPlaceId") ?? ""}
                onValueChange={(v) => setValue("admissionPlaceId", v, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب محل پذیرش" />
                </SelectTrigger>
                <SelectContent>
                  {availablePlaces.map((pl) => (
                    <SelectItem key={pl.id} value={pl.id}>
                      {pl.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>ساعت نوبت</Label>
              <div className="grid grid-cols-2 gap-2">
                <Select
                  value={watch("appointmentHour") ?? ""}
                  onValueChange={(v) => setValue("appointmentHour", v, { shouldValidate: true })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="ساعت" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0")).map((h) => (
                      <SelectItem key={h} value={h}>{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={watch("appointmentMinute") ?? ""}
                  onValueChange={(v) => setValue("appointmentMinute", v, { shouldValidate: true })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="دقیقه" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0")).map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>نوع پذیرش</Label>
              <Select
                value={watch("admissionType")}
                onValueChange={(v) =>
                  setValue("admissionType", v as "free" | "insured")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">آزاد</SelectItem>
                  <SelectItem value="insured">بیمه‌ای</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>وضعیت نوبت</Label>
              <Select
                value={watch("status")}
                onValueChange={(v) => setValue("status", v as AppointmentStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(APPOINTMENT_STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-appointmentDate">تاریخ نوبت</Label>
              <JalaliDatePicker
                id="edit-appointmentDate"
                value={watch("appointmentDate")}
                onChange={(v) => setValue("appointmentDate", v, { shouldValidate: true })}
                placeholder="انتخاب تاریخ نوبت"
              />
              {errors.appointmentDate && (
                <p className="text-xs text-destructive">
                  {errors.appointmentDate.message}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="flex-row-reverse justify-between sm:justify-between">
            <div>
              <Button
                type="button"
                variant="destructive"
                onClick={onDelete}
                disabled={isSaving}
              >
                <Trash2 className="size-4" />
                {confirmingDelete ? "تأیید حذف؟" : "حذف نوبت"}
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                انصراف
              </Button>
              <Button type="submit" disabled={isSaving || !canSubmit}>
                {isSaving && <Loader2 className="size-4 animate-spin" />}
                ذخیره
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
