"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BadgePercent,
  CalendarDays,
  Check,
  ChevronDown,
  FileText,
  Hash,
  Loader2,
  Search,
  Stethoscope,
  UserX,
  StickyNote,
  User,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toJalaliString } from "@/lib/jalali";
import { usePatientsList, usePatientServices } from "@/features/patients/hooks";
import { useCreateInvoice } from "@/features/invoices/hooks";
import { PAYMENT_TYPE_LABELS, type InvoiceType, type PaymentType } from "@/features/invoices/types";
import type { Patient, PatientService } from "@/features/patients/types";
import { formatToman } from "@/lib/utils";

type Stage = "patient" | "day" | "services";

function patientLabel(p: Patient): string {
  return `${p.fullName} — ${p.nationalCode}`;
}

interface DiscountRow {
  percent: number;
}

export function NewInvoiceDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [stage, setStage] = useState<Stage>("patient");
  const [patient, setPatient] = useState<Patient | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [invoiceType, setInvoiceType] = useState<InvoiceType>("final");
  const [paymentType, setPaymentType] = useState<PaymentType>("pos");
  const [description, setDescription] = useState("");
  const [prepaidEnabled, setPrepaidEnabled] = useState(false);
  const [prepaidAmount, setPrepaidAmount] = useState("");
  const [discounts, setDiscounts] = useState<Record<string, DiscountRow>>({});

  // --- مرحله ۱: سرچ بیمار (نام یا کد ملی) ---
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLButtonElement>(null);

  // --- مرحله ۲: سرچ روز دریافت خدمت ---
  const [dayQuery, setDayQuery] = useState("");
  const [daySearchOpen, setDaySearchOpen] = useState(false);
  const daySearchRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 500);
    return () => clearTimeout(t);
  }, [query]);

  const { data: patients, isLoading: patientsLoading } = usePatientsList({
    search: debounced || undefined,
    limit: 100,
  });

  // --- مرحله ۲: خدمات بیمار (برای لیست روزها) ---
  const { data: patientServices, isLoading: servicesLoading } = usePatientServices(
    patient?.id ?? null
  );

  const days = useMemo(() => {
    if (!patientServices) return [];
    const map = new Map<string, number>();
    for (const ps of patientServices) {
      const key = ps.serviceDate.slice(0, 10);
      if (!map.has(key)) map.set(key, 1);
      else map.set(key, map.get(key)! + 1);
    }
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [patientServices]);

  const dayServices = useMemo(() => {
    if (!patientServices || !selectedDay) return [];
    return patientServices.filter((ps) => ps.serviceDate.slice(0, 10) === selectedDay);
  }, [patientServices, selectedDay]);

  const createMutation = useCreateInvoice();

  const reset = () => {
    setStage("patient");
    setPatient(null);
    setSelectedDay(null);
    setInvoiceType("final");
    setPaymentType("pos");
    setDescription("");
    setPrepaidEnabled(false);
    setPrepaidAmount("");
    setDiscounts({});
    setQuery("");
    setDebounced("");
    setDayQuery("");
    setDaySearchOpen(false);
  };

  const handleSelectPatient = (p: Patient) => {
    setPatient(p);
    setQuery("");
    setDebounced("");
    setSearchOpen(false);
    setDayQuery("");
    setDaySearchOpen(false);
    setStage("day");
  };

  const handleSelectDay = (day: string) => {
    setSelectedDay(day);
    setDayQuery("");
    setDaySearchOpen(false);
    setStage("services");
  };

  const dayServicesCount = dayServices.length;

  const subtotal = useMemo(
    () =>
      dayServices.reduce((sum, ps) => {
        const discountAmount = discountAmountFor(ps);
        return sum + (ps.unitPrice - discountAmount);
      }, 0),
    [dayServices, discounts]
  );

  const prepaidValue = Number(prepaidAmount.replace(/\D/g, "")) || 0;
  const prepaidAmountDisplay = prepaidValue ? prepaidValue.toLocaleString("en-US") : "";
  const total = Math.max(subtotal - prepaidValue, 0);
  const prepayExceeds = prepaidEnabled && prepaidValue > subtotal;

  function discountAmountFor(ps: PatientService): number {
    const row = discounts[ps.id];
    const percent = Math.min(Math.max(row?.percent ?? 0, 0), 100);
    return Math.round((ps.unitPrice * percent) / 100);
  }

  const canSubmit =
    patient !== null &&
    selectedDay !== null &&
    dayServicesCount > 0 &&
    !prepayExceeds;

  const handleSubmit = async () => {
    if (!patient || !selectedDay || dayServicesCount === 0 || prepayExceeds) return;
    const items = dayServices.map((ps) => ({
      serviceId: ps.serviceId,
      quantity: 1,
      unitPrice: ps.unitPrice,
      discountAmount: discountAmountFor(ps),
    }));
    await createMutation.mutateAsync({
      patientId: patient.id,
      invoiceType,
      paymentType,
      items,
      prepaidAmount: prepaidEnabled ? prepaidValue : undefined,
      description: invoiceType === "pro_forma" && description ? description : undefined,
      serviceDate: new Date(`${selectedDay}T00:00:00.000Z`).toISOString(),
    });
    reset();
    onOpenChange(false);
  };

  const backTo = (target: Stage) => {
    if (target === "day") setStage("day");
    if (target === "patient") {
      setPatient(null);
      setSelectedDay(null);
      setDayQuery("");
      setDaySearchOpen(false);
      setStage("patient");
    }
  };

  const filteredDays = useMemo(() => {
    const q = dayQuery.trim().toLowerCase();
    if (!q) return days;
    return days.filter(([day]) =>
      toJalaliString(new Date(`${day}T00:00:00.000Z`)).toLowerCase().includes(q)
    );
  }, [days, dayQuery]);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>فاکتور جدید</DialogTitle>
          <DialogDescription>
            {stage === "patient"
              ? "بیمار را با نام یا کد ملی جست‌وجو کنید"
              : stage === "day"
                ? "روزی که بیمار خدمات دریافت کرده را انتخاب کنید"
                : "خدمات روز انتخابی را بررسی و فاکتور را ثبت کنید"}
          </DialogDescription>
        </DialogHeader>

        {/* مرحله ۱: انتخاب بیمار */}
        {stage === "patient" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>جست‌وجوی بیمار</Label>
              <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                <PopoverTrigger asChild>
                  <button
                    ref={searchRef}
                    type="button"
                    role="combobox"
                    aria-expanded={searchOpen}
                    className={cn(
                      "flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-input bg-card px-3.5 text-sm shadow-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary/60",
                      !patient && "text-muted-foreground/70"
                    )}
                  >
                    <span className="truncate">
                      {patient ? patientLabel(patient) : "نام یا کد ملی بیمار…"}
                    </span>
                    <ChevronDown className="size-4 shrink-0 opacity-50" />
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0">
                  <div className="border-b p-2">
                    <div className="relative">
                      <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        autoFocus
                        dir="rtl"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="نام یا کد ملی بیمار…"
                        className="ps-10"
                      />
                    </div>
                  </div>
                  <div className="max-h-64 overflow-y-auto p-1">
                    {patientsLoading ? (
                      <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
                        <Loader2 className="size-4 animate-spin" />
                        در حال جست‌وجو…
                      </div>
                    ) : patients && patients.items.length > 0 ? (
                      patients.items.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleSelectPatient(p)}
                          className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-right text-sm transition-colors hover:bg-accent"
                        >
                          <span className="min-w-0">
                            <span className="block truncate font-medium">{p.fullName}</span>
                            <span className="block text-xs text-muted-foreground tabular-nums">
                              {p.nationalCode}
                            </span>
                          </span>
                          <Badge variant="outline" className="shrink-0 tabular-nums">
                            {p.fileNumber}
                          </Badge>
                        </button>
                      ))
                    ) : (
                      <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                        بیماری یافت نشد
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        )}

        {/* مرحله ۲: انتخاب روز */}
        {stage === "day" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2 rounded-xl border bg-muted/40 px-3 py-2 text-sm">
              <span className="flex items-center gap-2 font-medium">
                <User className="size-4 text-primary" />
                {patient?.fullName}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1 px-2 text-xs"
                onClick={() => backTo("patient")}
              >
                <UserX className="size-3.5" />
                تغییر بیمار
              </Button>
            </div>

            {servicesLoading ? (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                در حال بررسی خدمات بیمار…
              </div>
            ) : !patientServices || patientServices.length === 0 ? (
              <div className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                بیمار خدمتی دریافت نکرده است.
                <div className="mt-2 text-xs">
                  برای صدور فاکتور، ابتدا خدمتی برای بیمار ثبت کنید.
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>روز دریافت خدمت</Label>
                <Popover open={daySearchOpen} onOpenChange={setDaySearchOpen}>
                  <PopoverTrigger asChild>
                    <button
                      ref={daySearchRef}
                      type="button"
                      role="combobox"
                      aria-expanded={daySearchOpen}
                      className={cn(
                        "flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-input bg-card px-3.5 text-sm shadow-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary/60",
                        !selectedDay && "text-muted-foreground/70"
                      )}
                    >
                      <span className="truncate">
                        {selectedDay
                          ? `${toJalaliString(new Date(`${selectedDay}T00:00:00.000Z`))} — ${dayServicesCount} خدمت`
                          : "روز دریافت خدمت را انتخاب کنید…"}
                      </span>
                      <ChevronDown className="size-4 shrink-0 opacity-50" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0">
                    <div className="border-b p-2">
                      <div className="relative">
                        <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          autoFocus
                          dir="rtl"
                          value={dayQuery}
                          onChange={(e) => setDayQuery(e.target.value)}
                          placeholder="جست‌وجوی روز…"
                          className="ps-10"
                        />
                      </div>
                    </div>
                    <div className="max-h-64 overflow-y-auto p-1">
                      {filteredDays.length > 0 ? (
                        filteredDays.map(([day, count]) => (
                          <button
                            key={day}
                            type="button"
                            onClick={() => handleSelectDay(day)}
                            className={cn(
                              "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-right text-sm transition-colors hover:bg-accent",
                              selectedDay === day && "bg-accent"
                            )}
                          >
                            <span className="flex items-center gap-2">
                              <CalendarDays className="size-4 text-primary" />
                              {toJalaliString(new Date(`${day}T00:00:00.000Z`))}
                            </span>
                            <span className="text-xs text-muted-foreground">{count} خدمت</span>
                          </button>
                        ))
                      ) : (
                        <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                          روزی یافت نشد
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            )}

            <DialogFooter className="justify-between sm:justify-between">
              <Button type="button" variant="outline" onClick={() => backTo("patient")}>
                <ArrowRight className="size-4" />
                بازگشت
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* مرحله ۳: خدمات روز + تنظیمات فاکتور */}
        {stage === "services" && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>نوع فاکتور</Label>
                <Select
                  value={invoiceType}
                  onValueChange={(v) => setInvoiceType(v as InvoiceType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="final">نهایی</SelectItem>
                    <SelectItem value="pro_forma">پیش‌پرداخت</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>نحوه پرداخت</Label>
                <Select
                  value={paymentType}
                  onValueChange={(v) => setPaymentType(v as PaymentType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(PAYMENT_TYPE_LABELS) as PaymentType[]).map((key) => (
                      <SelectItem key={key} value={key}>
                        {PAYMENT_TYPE_LABELS[key]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {invoiceType === "pro_forma" && (
              <div className="space-y-2">
                <Label htmlFor="invoice-description">توضیحات (در پایین فاکتور نمایش داده می‌شود)</Label>
                <div className="relative">
                  <StickyNote className="pointer-events-none absolute start-3 top-3 size-4 text-muted-foreground" />
                  <textarea
                    id="invoice-description"
                    dir="rtl"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="توضیحات پیش‌پرداخت…"
                    className="min-h-20 w-full rounded-xl border border-input bg-card px-3.5 py-2 ps-10 text-sm shadow-sm transition-all duration-200 placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary/60"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label>خدمات روز {toJalaliString(new Date(`${selectedDay}T00:00:00.000Z`))}</Label>
                <div className="flex items-center gap-1">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setStage("day")}>
                    <ArrowRight className="size-4" />
                    تغییر روز
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => backTo("patient")}>
                    <UserX className="size-4" />
                    تغییر بیمار
                  </Button>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border">
                {dayServices.map((ps) => {
                  const row = discounts[ps.id];
                  const percent = row?.percent ?? 0;
                  const discountAmount = discountAmountFor(ps);
                  const lineTotal = ps.unitPrice - discountAmount;
                  return (
                    <div
                      key={ps.id}
                      className="flex flex-col gap-3 border-b bg-card p-4 last:border-0 lg:flex-row lg:items-center lg:justify-between"
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <Stethoscope className="size-5" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{ps.service.treatmentProcess}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 tabular-nums">
                              <Hash className="size-3" />
                              {ps.service.serviceCode}
                            </span>
                            <span className="inline-flex items-center gap-1 tabular-nums">
                              <CalendarDays className="size-3.5" />
                              {toJalaliString(new Date(ps.serviceDate))}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-around gap-2">
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] text-muted-foreground">قیمت پایه</span>
                          <span className="text-sm tabular-nums">{formatToman(ps.unitPrice)}</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="mb-1 text-[10px] text-muted-foreground">تخفیف</span>
                          <div className="flex items-center gap-1 rounded-xl border border-primary/20 bg-primary/5 px-2 py-1 transition-colors focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20">
                            <BadgePercent className="size-4 text-primary/70" />
                            <input
                              type="number"
                              min={0}
                              max={100}
                              inputMode="numeric"
                              value={percent === 0 ? "" : String(percent)}
                              onChange={(e) => {
                                const v = Number(e.target.value);
                                setDiscounts((prev) => ({
                                  ...prev,
                                  [ps.id]: { percent: Number.isNaN(v) ? 0 : v },
                                }));
                              }}
                              placeholder="0"
                              className="h-7 w-12 border-0 bg-transparent text-center text-sm tabular-nums outline-none placeholder:text-muted-foreground/70"
                            />
                            <span className="text-xs text-muted-foreground">٪</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] text-muted-foreground">قیمت نهایی</span>
                          <span
                            className={cn(
                              "text-sm font-bold tabular-nums",
                              discountAmount > 0
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-foreground"
                            )}
                          >
                            {formatToman(lineTotal)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  role="switch"
                  aria-checked={prepaidEnabled}
                  onClick={() => setPrepaidEnabled((v) => !v)}
                  className={cn(
                    "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    prepaidEnabled ? "bg-primary" : "bg-input"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block size-5 rounded-full bg-white shadow-md transition-transform duration-300",
                      prepaidEnabled ? "translate-x-[-26px]" : "translate-x-[-2px]"
                    )}
                  />
                </button>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium">پیش‌پرداخت</span>
                  {prepaidEnabled && (
                    <Check className="size-4 text-primary" />
                  )}
                </div>
              </div>
              {prepaidEnabled && (
                <div className="flex flex-col items-end gap-1.5">
                  <div className="flex items-center gap-2">
                    <Input
                      dir="ltr"
                      type="text"
                      inputMode="numeric"
                      value={prepaidAmountDisplay}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, "").slice(0, 15);
                        setPrepaidAmount(digits ? Number(digits).toLocaleString("en-US") : "");
                      }}
                      placeholder="مبلغ پیش‌پرداخت"
                      className={cn("w-44 text-end tabular-nums", prepayExceeds && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20")}
                    />
                    <span className="text-sm text-muted-foreground">تومان</span>
                  </div>
                  {prepayExceeds && (
                    <p className="text-xs text-destructive">
                      مبلغ پیش‌پرداخت نمی‌تواند از جمع کل خدمات ({formatToman(subtotal)} تومان) بیشتر باشد
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between rounded-xl border bg-card px-4 py-3">
              <span className="text-sm text-muted-foreground">جمع کل</span>
              <span className="text-lg font-bold tabular-nums">{formatToman(total)} تومان</span>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                انصراف
              </Button>
              <Button
                type="button"
                disabled={!canSubmit || createMutation.isPending}
                onClick={handleSubmit}
              >
                {createMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <FileText className="size-4" />
                )}
                ثبت فاکتور
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
