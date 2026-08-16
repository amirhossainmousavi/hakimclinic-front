"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Building2,
  Calendar,
  CloudUpload,
  CreditCard,
  FileText,
  Image as ImageIcon,
  Loader2,
  Phone,
  Stethoscope,
  Trash2,
  User,
  Video,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { JalaliDatePicker } from "@/components/ui/jalali-date-picker";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { cn, toEnglishDigits } from "@/lib/utils";
import { toJalaliString } from "@/lib/jalali";
import { getAccessToken, BASE_URL } from "@/lib/api-client";
import {
  PATIENT_STATUS_LABELS,
  ADMISSION_TYPE_LABELS,
  type PatientStatus,
} from "@/features/patients/types";
import {
  usePatient,
  usePatientFiles,
  usePatientServices,
  useUpdatePatient,
  useUploadPatientFile,
  useDeletePatientFile,
  useAttachPatientService,
  useRemovePatientService,
} from "@/features/patients/hooks";
import { useInsurances } from "@/features/insurances/hooks";
import { useAdmissionPlaces } from "@/features/admission-places/hooks";
import { ServiceSearchCombobox } from "@/features/services/components/service-search-combobox";
import type { Service } from "@/features/services/types";

const editSchema = z.object({
  fullName: z.string().min(3, "نام بیمار الزامی است"),
  nationalCode: z.string().length(10, "کدملی باید ۱۰ رقم باشد"),
  phone: z.string().length(11, "شماره تلفن نامعتبر است"),
  birthDate: z.string().min(1, "تاریخ تولد الزامی است"),
  suggestedDoctor: z.string().optional(),
  admissionPlaceId: z.string().optional(),
  insuranceId: z.string().optional(),
  description: z.string().optional(),
  status: z.enum([
    "admitted",
    "pending_insurance_approval",
    "in_production",
    "ready_for_delivery",
    "delivered",
  ]),
});

type EditValues = z.infer<typeof editSchema>;

interface PatientDetailDialogProps {
  patientId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STATUS_OPTIONS: PatientStatus[] = [
  "admitted",
  "pending_insurance_approval",
  "in_production",
  "ready_for_delivery",
  "delivered",
];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileSrc(url: string): string {
  const token = getAccessToken();
  const base = url.startsWith("/") ? `${BASE_URL}${url}` : url;
  return token ? `${base}${base.includes("?") ? "&" : "?"}token=${encodeURIComponent(token)}` : base;
}

export function PatientDetailDialog({
  patientId,
  open,
  onOpenChange,
}: PatientDetailDialogProps) {
  const { data: patient, isLoading } = usePatient(patientId);
  const { data: files, isLoading: filesLoading } = usePatientFiles(patientId);
  const { data: insurances } = useInsurances();
  const { data: admissionPlaces } = useAdmissionPlaces();
  const updatePatient = useUpdatePatient();
  const uploadFile = useUploadPatientFile();
  const deleteFile = useDeletePatientFile();
  const { data: patientServices, isLoading: servicesLoading } = usePatientServices(patientId);
  const attachService = useAttachPatientService();
  const removeService = useRemovePatientService();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState("view");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [serviceDate, setServiceDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );

  const addService = (service: Service) => {
    if (!patient) return;
    attachService.mutate({
      patientId: patient.id,
      input: { serviceId: service.id, serviceDate },
    });
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
  } = useForm<EditValues>({
    resolver: zodResolver(editSchema),
  });

  useEffect(() => {
    if (open && patient) {
      setTab("view");
      setConfirmDeleteId(null);
      setIsDragOver(false);
      reset({
        fullName: patient.fullName,
        nationalCode: patient.nationalCode,
        phone: patient.phone,
        birthDate: patient.birthDate?.slice(0, 10) ?? "",
        suggestedDoctor: patient.suggestedDoctor ?? "",
        admissionPlaceId: patient.admissionPlaceId ?? "",
        insuranceId: patient.insuranceId ?? "",
        description: patient.description ?? "",
        status: patient.status,
      });
    }
  }, [open, patient, reset]);

  const isSaving = updatePatient.isPending || uploadFile.isPending;
  const canSave = editSchema.safeParse(watch()).success;

  const onSave = handleSubmit(async (values) => {
    if (!patient) return;
    await updatePatient.mutateAsync({
      id: patient.id,
      input: {
        fullName: values.fullName,
        nationalCode: toEnglishDigits(values.nationalCode),
        phone: toEnglishDigits(values.phone),
        birthDate: values.birthDate || null,
        suggestedDoctor: values.suggestedDoctor || null,
        admissionPlaceId: values.admissionPlaceId || null,
        insuranceId: values.insuranceId || null,
        description: values.description || null,
        status: values.status,
      },
    });
    setTab("view");
  });

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && patient) uploadFile.mutate({ patientId: patient.id, file });
    e.target.value = "";
  };

  const onDropFile = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (uploadFile.isPending) return;
    const file = e.dataTransfer.files?.[0];
    if (file && patient) uploadFile.mutate({ patientId: patient.id, file });
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {isLoading || !patient ? "بارگذاری…" : `پرونده «${patient.fullName}»`}
          </DialogTitle>
          <DialogDescription>
            مشاهده، ویرایش اطلاعات و فایل‌های بیمار
          </DialogDescription>
        </DialogHeader>

        {isLoading || !patient ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="view">مشاهده</TabsTrigger>
              <TabsTrigger value="edit">ویرایش</TabsTrigger>
              <TabsTrigger value="services">خدمات</TabsTrigger>
              <TabsTrigger value="files">فایل‌ها</TabsTrigger>
            </TabsList>

            <TabsContent value="view" className="space-y-4 pt-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field icon={User} label="نام کامل" value={patient.fullName} />
                <Field icon={FileText} label="شماره پرونده" value={patient.fileNumber} />
                <Field icon={CreditCard} label="کدملی" value={patient.nationalCode} />
                <Field icon={Phone} label="تلفن" value={patient.phone} />
                <Field
                  icon={Calendar}
                  label="تاریخ تولد"
                  value={patient.birthDate ? toJalaliString(new Date(patient.birthDate)) : "—"}
                />
                <Field
                  icon={Building2}
                  label="محل پذیرش"
                  value={patient.admissionPlaceName ?? "—"}
                />
                <Field
                  icon={CreditCard}
                  label="نوع پذیرش"
                  value={ADMISSION_TYPE_LABELS?.[patient.admissionType] ?? patient.admissionType}
                />
                {patient.admissionType === "insured" && (
                  <Field
                    icon={CreditCard}
                    label="بیمه"
                    value={patient.insuranceName ?? "—"}
                  />
                )}
                <Field
                  icon={User}
                  label="پزشک معرف"
                  value={patient.suggestedDoctor ?? "—"}
                />
                <div className="flex items-center gap-3 rounded-xl border bg-card px-3 py-2.5 sm:col-span-2">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FileText className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-muted-foreground">توضیحات</p>
                    <p className="truncate text-sm font-medium">
                      {patient.description ?? "—"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border bg-muted/40 px-4 py-3">
                <div>
                  <p className="text-xs text-muted-foreground">وضعیت بیمار</p>
                  <p className="mt-1 text-sm font-semibold">
                    {PATIENT_STATUS_LABELS[patient.status]}
                  </p>
                </div>
                <StatusBadge status={patient.status} />
              </div>

              <div className="flex justify-end">
                <Button onClick={() => setTab("edit")} className="w-full sm:w-auto">
                  <User className="size-4" />
                  ویرایش اطلاعات
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="edit" className="space-y-4 pt-4">
              <form onSubmit={onSave} className="space-y-4" dir="rtl" noValidate>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="p-fullName">نام کامل</Label>
                    <Input id="p-fullName" icon={User} {...register("fullName")} />
                    {errors.fullName && (
                      <p className="text-xs text-destructive">{errors.fullName.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="p-nationalCode">کدملی</Label>
                    <Input
                      id="p-nationalCode"
                      icon={CreditCard}
                      inputMode="numeric"
                      {...register("nationalCode")}
                    />
                    {errors.nationalCode && (
                      <p className="text-xs text-destructive">{errors.nationalCode.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="p-phone">شماره تلفن</Label>
                    <Input id="p-phone" icon={Phone} inputMode="tel" {...register("phone")} />
                    {errors.phone && (
                      <p className="text-xs text-destructive">{errors.phone.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="p-birthDate">تاریخ تولد</Label>
                    <JalaliDatePicker
                      id="p-birthDate"
                      value={watch("birthDate") ?? ""}
                      onChange={(v) => setValue("birthDate", v ?? "", { shouldValidate: true })}
                      placeholder="انتخاب تاریخ تولد"
                    />
                    {errors.birthDate && (
                      <p className="text-xs text-destructive">{errors.birthDate.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="p-suggestedDoctor">پزشک معرف</Label>
                    <Input
                      id="p-suggestedDoctor"
                      icon={User}
                      placeholder="مثلاً دکتر رضایی"
                      {...register("suggestedDoctor")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>وضعیت</Label>
                    <Select
                      value={watch("status")}
                      onValueChange={(v) => setValue("status", v as PatientStatus)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((s) => (
                          <SelectItem key={s} value={s}>
                            {PATIENT_STATUS_LABELS[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
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
                    <Label>بیمه</Label>
                    <Select
                      value={watch("insuranceId")}
                      onValueChange={(v) => setValue("insuranceId", v)}
                      disabled={patient.admissionType !== "insured"}
                    >
                      <SelectTrigger disabled={patient.admissionType !== "insured"}>
                        <SelectValue
                          placeholder={
                            patient.admissionType === "insured"
                              ? "انتخاب بیمه"
                              : "فقط برای پذیرش بیمه‌ای"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {(watch("admissionPlaceId")
                          ? admissionPlaces?.find((pl) => pl.id === watch("admissionPlaceId"))?.insurances.map((i) => i.insurance) ?? []
                          : insurances ?? []
                        ).map((ins) => (
                          <SelectItem key={ins.id} value={ins.id}>
                            {ins.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="p-description">توضیحات</Label>
                    <textarea
                      id="p-description"
                      rows={3}
                      className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="توضیحات اضافه (اختیاری)"
                      {...register("description")}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <Button
                    type="submit"
                    disabled={isSaving || !canSave}
                    className="w-full sm:w-auto"
                  >
                    {updatePatient.isPending && <Loader2 className="size-4 animate-spin" />}
                    ذخیره اطلاعات
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setTab("view")}
                    className="w-full sm:w-auto"
                  >
                    انصراف
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="services" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>انتخاب خدمت</Label>
                <ServiceSearchCombobox
                  value=""
                  onChange={addService}
                  placeholder="کد یا نام خدمت را بنویسید و جستجو کنید…"
                />
              </div>

              <div className="space-y-2">
                <Label>تاریخ خدمت</Label>
                <JalaliDatePicker
                  id="p-serviceDate"
                  value={serviceDate}
                  onChange={(v) => setServiceDate(v)}
                  placeholder="انتخاب تاریخ"
                />
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold">خدمات ثبت‌شده</p>
                {servicesLoading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="size-5 animate-spin text-muted-foreground" />
                  </div>
                ) : !patientServices || patientServices.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    هنوز خدمتی برای این بیمار ثبت نشده است.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {patientServices.map((ps) => (
                      <div
                        key={ps.id}
                        className="flex items-center justify-between gap-3 rounded-xl border bg-card px-3 py-2.5"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Stethoscope className="size-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="break-words text-sm font-medium">
                              {ps.service.treatmentProcess}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {ps.service.serviceCode} ·{" "}
                              {toJalaliString(new Date(ps.serviceDate))} ·{" "}
                              {ps.unitPrice.toLocaleString("en-US")} تومان
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirmDeleteId === ps.id) {
                              removeService.mutate(ps.id);
                              setConfirmDeleteId(null);
                            } else {
                              setConfirmDeleteId(ps.id);
                            }
                          }}
                          disabled={removeService.isPending}
                          className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs text-destructive transition-colors hover:bg-destructive/10"
                        >
                          <Trash2 className="size-3.5" />
                          {confirmDeleteId === ps.id ? "تأیید؟" : "حذف"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="files" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>پیوست جدید</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
                  className="hidden"
                  onChange={onPickFile}
                />
                <div
                  role="button"
                  tabIndex={0}
                  aria-disabled={uploadFile.isPending}
                  onClick={() => {
                    if (!uploadFile.isPending) fileInputRef.current?.click();
                  }}
                  onKeyDown={(e) => {
                    if ((e.key === "Enter" || e.key === " ") && !uploadFile.isPending) {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                  onDragOver={(e) => {
                    if (uploadFile.isPending) return;
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={onDropFile}
                  className={cn(
                    "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-7 text-center transition-all duration-200 outline-none",
                    isDragOver
                      ? "border-primary bg-primary/10"
                      : "border-muted-foreground/30 bg-muted/40 hover:border-primary hover:bg-primary/5",
                    uploadFile.isPending && "cursor-wait opacity-60"
                  )}
                >
                  <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    {uploadFile.isPending ? (
                      <Loader2 className="size-6 animate-spin" />
                    ) : (
                      <CloudUpload className="size-6" />
                    )}
                  </div>
                  <p className="text-sm font-semibold">
                    {uploadFile.isPending
                      ? "در حال آپلود…"
                      : "کلیک کنید یا فایل را اینجا بکشید و رها کنید"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    تصویر (JPG/PNG/WebP) یا فیلم (MP4/MOV/WebM) — حداکثر ۵۰ مگابایت
                  </p>
                </div>
              </div>

              {filesLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                </div>
              ) : !files || files.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  هنوز فایلی برای این بیمار آپلود نشده است.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {files.map((f) => (
                    <div
                      key={f.id}
                      className="group relative overflow-hidden rounded-xl border bg-muted/40"
                    >
                      {f.type === "image" ? (
                        <img
                          src={fileSrc(f.url)}
                          alt={f.fileName}
                          className="aspect-square w-full object-cover"
                        />
                      ) : (
                        <div className="flex aspect-square w-full flex-col items-center justify-center gap-1 text-muted-foreground">
                          <Video className="size-8" />
                          <span className="px-2 text-center text-xs">فیلم</span>
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/50 px-2 py-1 text-[10px] text-white">
                        <span className="truncate">{formatBytes(f.fileSize)}</span>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirmDeleteId === f.id) {
                              deleteFile.mutate(f.id);
                              setConfirmDeleteId(null);
                            } else {
                              setConfirmDeleteId(f.id);
                            }
                          }}
                          className="flex items-center gap-1 rounded px-1 py-0.5 transition-colors hover:bg-white/20"
                        >
                          <Trash2 className="size-3" />
                          {confirmDeleteId === f.id ? "تأیید؟" : "حذف"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Field({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card px-3 py-2.5">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}
