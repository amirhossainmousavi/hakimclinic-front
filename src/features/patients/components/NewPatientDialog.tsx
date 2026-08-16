"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  CloudUpload,
  CreditCard,
  Image as ImageIcon,
  Loader2,
  Phone,
  Stethoscope,
  Trash2,
  User,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
import { toast } from "sonner";
import { cn, toEnglishDigits } from "@/lib/utils";
import { toJalaliString } from "@/lib/jalali";
import {
  ADMISSION_TYPE_LABELS,
  type AdmissionType,
  type AttachPatientServiceInput,
} from "@/features/patients/types";
import { useCreatePatient, useUploadPatientFile } from "@/features/patients/hooks";
import { useInsurances } from "@/features/insurances/hooks";
import { useAdmissionPlaces } from "@/features/admission-places/hooks";
import { ServiceSearchCombobox } from "@/features/services/components/service-search-combobox";
import type { Service } from "@/features/services/types";

const schema = z
  .object({
    fullName: z.string().min(3, "نام بیمار الزامی است"),
    nationalCode: z.string().length(10, "کدملی باید ۱۰ رقم باشد"),
    phone: z.string().length(11, "شماره تلفن نامعتبر است"),
    birthDate: z.string().min(1, "تاریخ تولد الزامی است"),
    admissionPlaceId: z.string().optional(),
    admissionType: z.enum(["free", "insured"]),
    insuranceId: z.string().optional(),
    suggestedDoctor: z.string().optional(),
    description: z.string().optional(),
  })
  .refine(
    (v) => v.admissionType !== "insured" || !!v.insuranceId,
    {
      message: "برای پذیرش بیمه‌ای، بیمه را انتخاب کنید",
      path: ["insuranceId"],
    }
  );

type FormValues = z.infer<typeof schema>;

interface NewPatientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function NewPatientDialog({
  open,
  onOpenChange,
}: NewPatientDialogProps) {
  const { data: insurances } = useInsurances();
  const { data: admissionPlaces } = useAdmissionPlaces();
  const createPatient = useCreatePatient();
  const uploadFile = useUploadPatientFile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [attachment, setAttachment] = useState<{ file: File; url: string } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const [serviceDate, setServiceDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [selectedServices, setSelectedServices] = useState<AttachPatientServiceInput[]>([]);

  const addService = (s: Service) => {
    setSelectedServices((prev) => [
      ...prev,
      {
        serviceId: s.id,
        serviceDate,
        serviceName: s.treatmentProcess,
        serviceCode: s.serviceCode,
        unitPrice: s.price,
      },
    ]);
    // بعد از افزودن، تاریخ به امروز برمی‌گردد
    setServiceDate(new Date().toISOString().slice(0, 10));
  };

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
      admissionPlaceId: "",
      admissionType: "free",
      insuranceId: "",
      suggestedDoctor: "",
      description: "",
    },
  });

  const isSubmitting = createPatient.isPending || uploadFile.isPending;
  // دکمه فقط وقتی فعال است که هم تب اطلاعات معتبر باشد و هم حداقل یک خدمت انتخاب شده باشد
  const canSubmit =
    schema.safeParse(watch()).success && selectedServices.length > 0;
  const admissionType = watch("admissionType");
  const admissionPlaceId = watch("admissionPlaceId");
  const insuranceOptions = admissionPlaceId
    ? admissionPlaces?.find((pl) => pl.id === admissionPlaceId)?.insurances.map((i) => i.insurance) ?? []
    : insurances ?? [];

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAttachment({ file, url: URL.createObjectURL(file) });
    e.target.value = "";
  };

  const onDropFile = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    setAttachment({ file, url: URL.createObjectURL(file) });
  };

  const onSubmit = handleSubmit(async (values) => {
    const patient = await createPatient.mutateAsync({

      fullName: values.fullName,
      nationalCode: toEnglishDigits(values.nationalCode),
      phone: toEnglishDigits(values.phone),
      birthDate: values.birthDate,
      admissionPlaceId: values.admissionPlaceId || undefined,
      admissionType: values.admissionType,
      insuranceId: values.insuranceId || undefined,
      suggestedDoctor: values.suggestedDoctor || undefined,
      description: values.description || undefined,
      services: selectedServices.length ? selectedServices : undefined,
    });

    if (attachment) {
      // آپلود فایل اختیاری؛ خطای آن مانع ثبت بیمار نمی‌شود
      try {
        await uploadFile.mutateAsync({ patientId: patient.id, file: attachment.file });
      } catch {
        toast.error("بیمار ثبت شد اما آپلود فایل ناموفق بود");
      }
    }

    reset();
    setAttachment(null);
    setSelectedServices([]);
    setServiceDate(new Date().toISOString().slice(0, 10));
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>پذیرش بیمار جدید</DialogTitle>
          <DialogDescription>
            اطلاعات اولیه بیمار را برای پذیرش ثبت کنید.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4" dir="rtl" noValidate>
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="info">اطلاعات</TabsTrigger>
              <TabsTrigger value="services">خدمات</TabsTrigger>
              <TabsTrigger value="files">پیوست</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="n-fullName">نام کامل</Label>
                  <Input
                    id="n-fullName"
                    icon={User}
                    placeholder="مثلاً علی احمدی"
                    {...register("fullName")}
                  />
                  {errors.fullName && (
                    <p className="text-xs text-destructive">{errors.fullName.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="n-nationalCode">کدملی</Label>
                  <Input
                    id="n-nationalCode"
                    icon={CreditCard}
                    inputMode="numeric"
                    placeholder="۱۰ رقم"
                    {...register("nationalCode")}
                  />
                  {errors.nationalCode && (
                    <p className="text-xs text-destructive">{errors.nationalCode.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="n-phone">شماره تلفن</Label>
                  <Input
                    id="n-phone"
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
                  <Label htmlFor="n-birthDate">تاریخ تولد</Label>
                  <JalaliDatePicker
                    id="n-birthDate"
                    value={watch("birthDate") ?? ""}
                    onChange={(v) => setValue("birthDate", v, { shouldValidate: true })}
                    placeholder="انتخاب تاریخ تولد"
                  />
                  {errors.birthDate && (
                    <p className="text-xs text-destructive">{errors.birthDate.message}</p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>محل پذیرش</Label>
                  <Select
                    value={watch("admissionPlaceId")}
                    onValueChange={(v) => setValue("admissionPlaceId", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="انتخاب محل پذیرش" />
                    </SelectTrigger>
                    <SelectContent>
                      {admissionPlaces?.map((pl) => (
                        <SelectItem key={pl.id} value={pl.id}>
                          {pl.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>نوع پذیرش</Label>
                  <Select
                    value={watch("admissionType")}
                    onValueChange={(v) => {
                      const next = v as AdmissionType;
                      setValue("admissionType", next);
                      if (next !== "insured") setValue("insuranceId", "");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ADMISSION_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {admissionType === "insured" && (
                <div className="space-y-2">
                  <Label>بیمه</Label>
                  <Select
                    value={watch("insuranceId")}
                    onValueChange={(v) =>
                      setValue("insuranceId", v, { shouldValidate: true })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="انتخاب بیمه" />
                    </SelectTrigger>
                    <SelectContent>
                      {insuranceOptions.length === 0 ? (
                        <p className="px-3 py-2 text-xs text-muted-foreground">
                          بیمه‌ای یافت نشد
                        </p>
                      ) : (
                        insuranceOptions.map((ins) => (
                          <SelectItem key={ins.id} value={ins.id}>
                            {ins.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {errors.insuranceId && (
                    <p className="text-xs text-destructive">
                      {errors.insuranceId.message}
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="n-suggestedDoctor">پزشک معرف</Label>
                <Input
                  id="n-suggestedDoctor"
                  icon={Stethoscope}
                  placeholder="مثلاً دکتر رضایی"
                  {...register("suggestedDoctor")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="n-description">توضیحات</Label>
                <textarea
                  id="n-description"
                  rows={3}
                  className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="توضیحات اضافه (اختیاری)"
                  {...register("description")}
                />
              </div>
            </TabsContent>

            <TabsContent value="services" className="space-y-2">
              <div className="space-y-2">
                <Label>انتخاب خدمت</Label>
                <ServiceSearchCombobox
                  value=""
                  onChange={addService}
                  placeholder="کد یا نام خدمت را بنویسید و جستجو کنید…"
                />
              </div>

              <div className="space-y-2 pt-1">
                <Label>تاریخ خدمت</Label>
                <JalaliDatePicker
                  id="n-serviceDate"
                  value={serviceDate}
                  onChange={(v) => setServiceDate(v)}
                  placeholder="انتخاب تاریخ"
                />
              </div>

              {selectedServices.length > 0 && (
                <div className="space-y-2 pt-1">
                  <p className="text-xs font-semibold text-muted-foreground">
                    خدمات انتخاب‌شده ({selectedServices.length})
                  </p>
                  {selectedServices.map((sv, i) => {
                    return (
                      <div
                        key={`${sv.serviceId}-${i}`}
                        className="flex items-center justify-between gap-3 rounded-xl border bg-card px-3 py-2.5"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Stethoscope className="size-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="break-words text-sm font-medium">
                              {sv.serviceName ?? sv.serviceId}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {sv.serviceCode ? `${sv.serviceCode} · ` : ""}
                              {sv.serviceDate ? toJalaliString(new Date(sv.serviceDate)) : ""}
                              {sv.unitPrice ? ` · ${sv.unitPrice.toLocaleString("en-US")} تومان` : ""}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedServices((prev) => prev.filter((_, x) => x !== i))}
                          className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs text-destructive transition-colors hover:bg-destructive/10"
                        >
                          <Trash2 className="size-3.5" />
                          حذف
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="files" className="space-y-2">
              <Label>پیوست (اختیاری)</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
                className="hidden"
                onChange={onPickFile}
              />
              {attachment ? (
                <div className="flex items-center gap-3 rounded-2xl border bg-muted/40 p-3">
                  {attachment.file.type.startsWith("video/") ? (
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <ImageIcon className="size-5" />
                    </div>
                  ) : (
                    <img
                      src={attachment.url}
                      alt={attachment.file.name}
                      className="size-12 shrink-0 rounded-lg object-cover"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{attachment.file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatBytes(attachment.file.size)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      URL.revokeObjectURL(attachment.url);
                      setAttachment(null);
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ) : (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={onDropFile}
                  className={cn(
                    "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-7 text-center transition-all duration-200 outline-none",
                    isDragOver
                      ? "border-primary bg-primary/10"
                      : "border-muted-foreground/30 bg-muted/40 hover:border-primary hover:bg-primary/5"
                  )}
                >
                  <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <CloudUpload className="size-6" />
                  </div>
                  <p className="text-sm font-semibold">
                    کلیک کنید یا فایل را اینجا بکشید و رها کنید
                  </p>
                  <p className="text-xs text-muted-foreground">
                    تصویر (JPG/PNG/WebP) یا فیلم (MP4/MOV/WebM) — حداکثر ۵۰ مگابایت
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
            <Button
              type="submit"
              disabled={isSubmitting || !canSubmit}
              className="w-full sm:w-auto"
            >
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              ثبت بیمار
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto"
            >
              انصراف
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
