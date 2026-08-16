"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Banknote, Building2, CircleCheckBig, CreditCard, FileText, TrendingUp } from "lucide-react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { PageHeader } from "@/components/design-system/PageHeader";
import { ErrorState } from "@/components/design-system/ErrorState";
import { StatCard } from "@/components/design-system/StatCard";
import { RevenueSkeleton } from "@/components/skeletons/RevenueSkeleton";
import { Button } from "@/components/ui/button";
import { JalaliDatePicker } from "@/components/ui/jalali-date-picker";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useRevenueReport } from "@/features/reports/hooks";
import { useAdmissionPlaces } from "@/features/admission-places/hooks";
import { RevenueAreaChart } from "@/features/dashboard/components/RevenueAreaChart";
import { PAYMENT_TYPE_LABELS } from "@/features/invoices/types";
import type { PaymentType } from "@/features/invoices/types";
import { formatToman } from "@/lib/utils";

export default function RevenueReportPage() {
  return (
    <RoleGuard allowed={["manager"]}>
      <RevenueContent />
    </RoleGuard>
  );
}

function RevenueContent() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [paymentType, setPaymentType] = useState<string>("all");
  const [admissionPlaceId, setAdmissionPlaceId] = useState<string>("all");
  const queryClient = useQueryClient();

  const { data: placesData, isLoading: isLoadingPlaces } = useAdmissionPlaces();
  const places = placesData ?? [];

  const params = useMemo(
    () => ({
      from: from || undefined,
      to: to || undefined,
      paymentType: paymentType === "all" ? undefined : (paymentType as PaymentType),
      admissionPlaceId: admissionPlaceId === "all" ? undefined : admissionPlaceId,
    }),
    [from, to, paymentType, admissionPlaceId]
  );

  const { data, isLoading, isError } = useRevenueReport(params);

  const hasFilter = Boolean(from || to || paymentType !== "all" || admissionPlaceId !== "all");

  const clearFilters = () => {
    setFrom("");
    setTo("");
    setPaymentType("all");
    setAdmissionPlaceId("all");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="گزارش درآمد"
        description="نمایش درآمد بر اساس بازه، محل پذیرش، نوع پرداخت و محدوده مبلغ"
        breadcrumb={["پنل مدیریت", "گزارش درآمد"]}
      />

      <Card>
        <CardContent className="grid gap-4 pt-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="from">از تاریخ</Label>
            <JalaliDatePicker
              id="from"
              value={from}
              onChange={setFrom}
              placeholder="انتخاب تاریخ"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="to">تا تاریخ</Label>
            <JalaliDatePicker
              id="to"
              value={to}
              onChange={setTo}
              placeholder="انتخاب تاریخ"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admission-place">محل پذیرش</Label>
            <Select value={admissionPlaceId} onValueChange={setAdmissionPlaceId}>
              <SelectTrigger id="admission-place">
                {isLoadingPlaces ? <span className="text-muted-foreground">در حال بارگذاری…</span> : <SelectValue />}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه مکان‌ها</SelectItem>
                {places.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>نوع پرداخت</Label>
            <Select value={paymentType} onValueChange={setPaymentType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه</SelectItem>
                {(["pos", "card_to_card", "bank_transfer"] as const).map((pt) => (
                  <SelectItem key={pt} value={pt}>
                    {PAYMENT_TYPE_LABELS[pt]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-0">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Building2 className="size-3.5" />
            {admissionPlaceId === "all"
              ? "گزارش همه محل‌های پذیرش"
              : places.find((p) => p.id === admissionPlaceId)?.name ?? "محل پذیرش انتخاب شده"}
          </p>
          <Button
            type="button"
            className="bg-destructive text-white hover:bg-destructive/90"
            onClick={clearFilters}
          >
            پاک کردن فیلترها
          </Button>
        </CardContent>
      </Card>

      {isLoading ? (
        <RevenueSkeleton />
      ) : isError ? (
        <ErrorState onRetry={() => queryClient.invalidateQueries({ queryKey: ["reports", "revenue"] })} />
      ) : !data ? (
        <div className="py-10 text-center text-muted-foreground">داده‌ای یافت نشد</div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="درآمد کل"
              value={`${formatToman(data.summary.totalAmount)} تومان`}
              icon={TrendingUp}
              tone="blue"
            />
            <StatCard
              label="تعداد فاکتور نهایی"
              value={String(data.summary.finalCount)}
              icon={FileText}
            />
            <StatCard
              label="POS"
              value={`${formatToman(data.summary.byPaymentType.pos.total)} تومان`}
              icon={CreditCard}
            />
            <StatCard
              label="انتقال به حساب"
              value={`${formatToman(data.summary.byPaymentType.bank_transfer.total)} تومان`}
              icon={Banknote}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">سهم روش پرداخت</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(["pos", "card_to_card", "bank_transfer"] as const).map((pt) => {
                  const entry = data.summary.byPaymentType[pt];
                  const pct = data.summary.totalAmount > 0 ? Math.round((entry.total / data.summary.totalAmount) * 100) : 0;
                  return (
                    <div key={pt}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span>{PAYMENT_TYPE_LABELS[pt]} ({entry.count} فاکتور)</span>
                        <span className="tabular-nums font-medium">{formatToman(entry.total)}</span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
                <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
                  <CircleCheckBig className="size-4 text-success" />
                  {data.summary.proFormaCount} پیش‌فاکتور در این بازه ثبت شده است
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">روند درآمد روزانه</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingPlaces ? (
                  <Skeleton className="h-64 w-full rounded-xl" />
                ) : (
                  <RevenueAreaChart data={data.chart} />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
