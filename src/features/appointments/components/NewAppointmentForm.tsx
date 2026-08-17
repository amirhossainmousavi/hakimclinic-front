"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CreditCard, Loader2, Phone, User } from "lucide-react";
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
import { useCreatePatient } from "@/features/patients/hooks";
import { useCreateAppointment } from "@/features/appointments/hooks";
import { useAdmissionPlaces } from "@/features/admission-places/hooks";

const schema = z.object({
  fullName: z.string().min(3, "نام بیمار الزامی است"),
  nationalCode: z.string().length(10, "کدملی باید ۱۰ رقم باشد"),
  phone: z.string().length(11, "شماره تلفن نامعتبر است"),
  birthDate: z.string().min(1, "تاریخ تولد الزامی است"),
  customFileNumber: z.string().min(1, "شماره پرونده اختصاصی الزامی است"),
  admissionType: z.enum(["free", "insured"]),
  admissionPlaceId: z.string().optional(),
  appointmentHour: z.string().optional(),
  appointmentMinute: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface NewAppointmentFormProps {
  dateIso: string;
  onSuccess: () => void;
}

export function NewAppointmentForm({
  dateIso,
  onSuccess,
}: NewAppointmentFormProps) {
  const { data: places } = useAdmissionPlaces();
  const createPatient = useCreatePatient();
  const createAppointment = useCreateAppointment();

  // The backend has already filtered the list by role and scope
  const availablePlaces = places ?? [];

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({

    resolver: zodResolver(schema),
    defaultValues: {
      fullName: "",
      nationalCode: "",
      phone: "",
      birthDate: "",
      customFileNumber: "",
      admissionType: "free",
      admissionPlaceId: "",
      appointmentHour: "",
      appointmentMinute: "",
    },
  });

  const isSubmitting = createPatient.isPending || createAppointment.isPending;
  const watchedValues = watch();
  const canSubmit = schema.safeParse(watchedValues).success;

  const onSubmit = handleSubmit(async (values) => {
    const admissionPlaceId = values.admissionPlaceId || availablePlaces[0]?.id;
    const appointmentTime = values.appointmentHour
      ? `${values.appointmentHour}:${values.appointmentMinute || "00"}`
      : undefined;
    const patient = await createPatient.mutateAsync({
      fullName: values.fullName,
      nationalCode: toEnglishDigits(values.nationalCode),
      phone: toEnglishDigits(values.phone),
      birthDate: values.birthDate,
      customFileNumber: values.customFileNumber.trim(),
      admissionType: values.admissionType,
      admissionPlaceId,
    });
    await createAppointment.mutateAsync({
      patientId: patient.id,
      fullName: patient.fullName,
      nationalCode: patient.nationalCode,
      phone: patient.phone,
      birthDate: patient.birthDate ?? undefined,
      admissionType: values.admissionType,
      appointmentDate: new Date(dateIso).toISOString(),
      appointmentTime,
      admissionPlaceId,
    });
    reset();
    onSuccess();
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" dir="rtl" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="fullName">نام بیمار</Label>
          <Input
            id="fullName"
            icon={User}
            placeholder="مثلاً علی احمدی"
            {...register("fullName")}
          />
          {errors.fullName && (
            <p className="text-xs text-destructive">{errors.fullName.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="nationalCode">کدملی</Label>
          <Input
            id="nationalCode"
            icon={CreditCard}
            inputMode="numeric"
            placeholder="۱۰ رقم"
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
          <Label htmlFor="phone">شماره تلفن</Label>
          <Input
            id="phone"
            icon={Phone}
            inputMode="tel"
            placeholder="۰۹۱۲..."
            {...register("phone")}
          />
          {errors.phone && (
            <p className="text-xs text-destructive">{errors.phone.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="birthDate">تاریخ تولد</Label>
          <JalaliDatePicker
            id="birthDate"
            value={watch("birthDate") ?? ""}
            onChange={(v) => setValue("birthDate", v, { shouldValidate: true })}
            placeholder="انتخاب تاریخ تولد"
          />
          {errors.birthDate && (
            <p className="text-xs text-destructive">{errors.birthDate.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="customFileNumber">شماره پرونده اختصاصی</Label>
        <Input
          id="customFileNumber"
          placeholder="مثلاً PF-۱۰۰۱"
          {...register("customFileNumber")}
        />
        {errors.customFileNumber && (
          <p className="text-xs text-destructive">{errors.customFileNumber.message}</p>
        )}
      </div>

      {availablePlaces.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="appointment-place">محل پذیرش</Label>
          <Select
            value={watch("admissionPlaceId") ?? availablePlaces[0]?.id ?? ""}
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
          {availablePlaces.length === 1 && (
            <p className="text-xs text-muted-foreground">
              محل پذیرش شما: {availablePlaces[0].name}
            </p>
          )}
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

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          با ثبت نوبت، پرونده بیمار هم به‌صورت خودکار ساخته می‌شود.
        </p>
        <Button type="submit" disabled={isSubmitting || !canSubmit}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          ثبت نوبت
        </Button>
      </div>
    </form>
  );
}
