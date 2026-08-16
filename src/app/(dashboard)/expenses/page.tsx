"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlignRight, Building2, FileText, Hash, Loader2, Package, Plus, Search, Wallet } from "lucide-react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { PageHeader } from "@/components/design-system/PageHeader";
import { ErrorState } from "@/components/design-system/ErrorState";
import { EmptyState } from "@/components/design-system/EmptyState";
import { ExpensesListSkeleton } from "@/components/skeletons/ExpensesListSkeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { JalaliDatePicker } from "@/components/ui/jalali-date-picker";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  useCreateCompanyInvoice,
  useCreateDailyExpense,
  useExpensesList,
  useExpensesMonthlyChart,
} from "@/features/expenses/hooks";
import { ExpensesMonthlyChart } from "@/features/expenses/components/ExpensesMonthlyChart";
import { useAdmissionPlaces } from "@/features/admission-places/hooks";
import type { Expense } from "@/features/expenses/types";
import { getCurrentUser } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { formatToman } from "@/lib/utils";

const dailySchema = z.object({
  title: z.string().min(3, "عنوان هزینه الزامی است"),
  amount: z.coerce.number().min(1, "مبلغ الزامی است"),
  expenseDate: z.string().min(1, "تاریخ الزامی است"),
  admissionPlaceId: z.string().min(1, "انتخاب مرکز الزامی است"),
  description: z.string().optional(),
});
type DailyForm = z.infer<typeof dailySchema>;

const companySchema = z.object({
  title: z.string().min(3, "عنوان الزامی است"),
  companyName: z.string().min(2, "نام شرکت الزامی است"),
  amount: z.coerce.number().min(1, "مبلغ الزامی است"),
  invoiceDate: z.string().min(1, "تاریخ الزامی است"),
  partName: z.string().optional(),
  quantity: z.coerce.number().min(1).optional(),
  unitAmount: z.coerce.number().min(1).optional(),
  description: z.string().optional(),
});
type CompanyForm = z.infer<typeof companySchema>;

const EMPTY_DAILY: DailyForm = { title: "", amount: 0, expenseDate: "", admissionPlaceId: "", description: "" };
const EMPTY_COMPANY: CompanyForm = {
  title: "", companyName: "", amount: 0, invoiceDate: "", partName: "", quantity: 1, unitAmount: 0, description: "",
};

function isCompany(e: Expense): e is Extract<Expense, { type: "company" }> {
  return e.type === "company";
}

export default function ExpensesPage() {
  return (
    <RoleGuard permission="expenses">
      <ExpensesContent />
    </RoleGuard>
  );
}

function ExpensesContent() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [createKind, setCreateKind] = useState<"daily" | "company">("daily");
  const [placeFilter, setPlaceFilter] = useState<string>("all");
  const queryClient = useQueryClient();

  const currentUser = getCurrentUser();
  const isManager = currentUser?.role === "manager";
  const scopes = isManager ? null : (currentUser?.scopes ?? []);
  const { data: places } = useAdmissionPlaces();

  const params = useMemo(
    () => ({
      search: search || undefined,
      type: type === "all" ? undefined : (type as "daily" | "company"),
      admissionPlaceId: isManager && placeFilter !== "all" ? placeFilter : undefined,
      page,
      limit: 10,
    }),
    [search, type, placeFilter, isManager, page]
  );

  const { data, isLoading, isError } = useExpensesList(params);
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;
  const { data: monthlyChart } = useExpensesMonthlyChart(
    isManager && placeFilter !== "all" ? { admissionPlaceId: placeFilter } : {}
  );

  const dailyForm = useForm<DailyForm>({ resolver: zodResolver(dailySchema), defaultValues: EMPTY_DAILY });
  const companyForm = useForm<CompanyForm>({ resolver: zodResolver(companySchema), defaultValues: EMPTY_COMPANY });

  const createDaily = useCreateDailyExpense();
  const createCompany = useCreateCompanyInvoice();

  const openCreate = (kind: "daily" | "company") => {
    setCreateKind(kind);
    setCreateOpen(true);
  };

  const onDaily = dailyForm.handleSubmit(async (values) => {
    await createDaily.mutateAsync(values);
    setCreateOpen(false);
    dailyForm.reset(EMPTY_DAILY);
  });

  const onCompany = companyForm.handleSubmit(async (values) => {
    await createCompany.mutateAsync(values);
    setCreateOpen(false);
    companyForm.reset(EMPTY_COMPANY);
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="هزینه‌ها"
        description="مدیریت هزینه‌های روزانه و فاکتورهای خرید"
        breadcrumb={["پنل مدیریت", "هزینه‌ها"]}
        actions={
          <Button onClick={() => openCreate("daily")}>
            <Plus className="size-4" />
            ثبت هزینه جدید
          </Button>
        }
      />

      {isLoading ? (
        <ExpensesListSkeleton />
      ) : isError ? (
        <ErrorState onRetry={() => queryClient.invalidateQueries({ queryKey: ["expenses"] })} />
      ) : !data ? (
        <EmptyState />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-sm flex-1">
              <Input
                icon={Search}
                placeholder="جست‌وجو در هزینه‌ها…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <Tabs value={type} onValueChange={(v) => { setType(v); setPage(1); }}>
              <TabsList>
                <TabsTrigger value="all">همه</TabsTrigger>
                <TabsTrigger value="daily">روزانه</TabsTrigger>
                <TabsTrigger value="company">فاکتور خرید</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Center filter — manager only */}
          {isManager && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">مرکز:</span>
              {[
                { id: "all", label: "همه مکان‌ها" },
                ...(places ?? []).map((p) => ({ id: p.id, label: p.name })),
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => { setPlaceFilter(p.id); setPage(1); }}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    placeFilter === p.id
                      ? "border-primary bg-primary text-primary-foreground"
                      : "bg-card text-muted-foreground hover:bg-muted"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}

          {data.items.length === 0 ? (
            <EmptyState title="هزینه‌ای یافت نشد" description="با تغییر فیلترها دوباره امتحان کنید." />
          ) : (
            <>
              {/* Desktop: table */}
              <div className="hidden overflow-hidden rounded-2xl border bg-card md:block">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/40">
                    <tr>
                      {["نوع", "عنوان", "جزئیات", "مبلغ", "تاریخ"].map((h) => (
                        <th key={h} className="px-4 py-3 text-start font-medium text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((e) => (
                      <tr key={e.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <Badge variant={isCompany(e) ? "outline" : "secondary"}>
                            {isCompany(e) ? "فاکتور خرید" : "روزانه"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 font-medium">{e.title}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {isCompany(e)
                            ? `${e.companyName} — ${e.partName}`
                            : (e.admissionPlaceName ?? e.description ?? "—")}
                        </td>
                        <td className="px-4 py-3 tabular-nums font-medium">{formatToman(e.amount)}</td>
                        <td className="px-4 py-3 text-muted-foreground">{new Date(e.createdAt).toLocaleDateString("fa-IR")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile: cards */}
              <div className="space-y-3 md:hidden">
                {data.items.map((e) => (
                  <div key={e.id} className="rounded-2xl border bg-card p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{e.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {isCompany(e) ? e.companyName : (e.admissionPlaceName ?? e.description ?? "—")}
                        </p>
                      </div>
                      <Badge variant={isCompany(e) ? "outline" : "secondary"}>
                        {isCompany(e) ? "فاکتور خرید" : "روزانه"}
                      </Badge>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="tabular-nums font-semibold">{formatToman(e.amount)} تومان</span>
                      <span className="text-xs text-muted-foreground">{new Date(e.createdAt).toLocaleDateString("fa-IR")}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>نمایش {data.items.length} از {data.total} هزینه</span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>قبلی</Button>
                  <span className="tabular-nums">{page} / {totalPages}</span>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>بعدی</Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Expenses chart — two lines: current and previous month (manager only) */}
      {isManager && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">نمودار هزینه‌های ماه جاری و ماه گذشته</CardTitle>
          </CardHeader>
          <CardContent>
            <ExpensesMonthlyChart data={monthlyChart ?? []} />
          </CardContent>
        </Card>
      )}

      {/* New expense dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ثبت هزینه جدید</DialogTitle>
            <DialogDescription>نوع هزینه را مشخص کنید</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>نوع هزینه</Label>
              <Select value={createKind} onValueChange={(v) => setCreateKind(v as "daily" | "company")}>
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب نوع هزینه" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">هزینه روزانه</SelectItem>
                  <SelectItem value="company">هزینه شرکتی</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {createKind === "daily" ? (
              <form onSubmit={onDaily} className="space-y-4" noValidate>
                <div className="space-y-2">
                  <Label htmlFor="daily-title">عنوان</Label>
                  <Input id="daily-title" icon={FileText} placeholder="مثلاً تاکسی اداری" {...dailyForm.register("title")} />
                  {dailyForm.formState.errors.title && <p className="text-xs text-destructive">{dailyForm.formState.errors.title.message}</p>}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="daily-amount">مبلغ (تومان)</Label>
                    <Input id="daily-amount" icon={Wallet} type="number" {...dailyForm.register("amount")} />
                    {dailyForm.formState.errors.amount && <p className="text-xs text-destructive">{dailyForm.formState.errors.amount.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="daily-date">تاریخ</Label>
                    <JalaliDatePicker
                      id="daily-date"
                      value={dailyForm.watch("expenseDate")}
                      onChange={(v) => dailyForm.setValue("expenseDate", v, { shouldValidate: true })}
                      placeholder="انتخاب تاریخ"
                    />
                    {dailyForm.formState.errors.expenseDate && <p className="text-xs text-destructive">{dailyForm.formState.errors.expenseDate.message}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="daily-place">مرکز</Label>
                  <Select
                    value={dailyForm.watch("admissionPlaceId")}
                    onValueChange={(v) => dailyForm.setValue("admissionPlaceId", v, { shouldValidate: true })}
                  >
                    <SelectTrigger id="daily-place">
                      <SelectValue placeholder="انتخاب مرکز" />
                    </SelectTrigger>
                    <SelectContent>
                      {(places ?? [])
                        .filter((p) => !scopes || scopes.includes(p.id))
                        .map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {dailyForm.formState.errors.admissionPlaceId && <p className="text-xs text-destructive">{dailyForm.formState.errors.admissionPlaceId.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="daily-desc">توضیحات</Label>
                  <Input id="daily-desc" icon={AlignRight} placeholder="اختیاری" {...dailyForm.register("description")} />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>انصراف</Button>
                  <Button type="submit" disabled={dailyForm.formState.isSubmitting}>
                    {dailyForm.formState.isSubmitting && <Loader2 className="size-4 animate-spin" />}
                    <Wallet className="size-4" />
                    ثبت هزینه
                  </Button>
                </DialogFooter>
              </form>
            ) : (
              <form onSubmit={onCompany} className="space-y-4" noValidate>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="co-title">عنوان</Label>
                    <Input id="co-title" icon={FileText} placeholder="مثلاً خرید پلی‌پروپیلن" {...companyForm.register("title")} />
                    {companyForm.formState.errors.title && <p className="text-xs text-destructive">{companyForm.formState.errors.title.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="co-company">نام شرکت</Label>
                    <Input id="co-company" icon={Building2} placeholder="نام تأمین‌کننده" {...companyForm.register("companyName")} />
                    {companyForm.formState.errors.companyName && <p className="text-xs text-destructive">{companyForm.formState.errors.companyName.message}</p>}
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="co-amount">مبلغ کل (تومان)</Label>
                    <Input id="co-amount" icon={Wallet} type="number" {...companyForm.register("amount")} />
                    {companyForm.formState.errors.amount && <p className="text-xs text-destructive">{companyForm.formState.errors.amount.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="co-date">تاریخ</Label>
                    <JalaliDatePicker
                      id="co-date"
                      value={companyForm.watch("invoiceDate")}
                      onChange={(v) => companyForm.setValue("invoiceDate", v, { shouldValidate: true })}
                      placeholder="انتخاب تاریخ"
                    />
                    {companyForm.formState.errors.invoiceDate && <p className="text-xs text-destructive">{companyForm.formState.errors.invoiceDate.message}</p>}
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="co-part">نام قطعه/ماده</Label>
                    <Input id="co-part" icon={Package} placeholder="اختیاری" {...companyForm.register("partName")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="co-qty">تعداد</Label>
                    <Input id="co-qty" icon={Hash} type="number" {...companyForm.register("quantity")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="co-unit">قیمت واحد</Label>
                    <Input id="co-unit" icon={Wallet} type="number" {...companyForm.register("unitAmount")} />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>انصراف</Button>
                  <Button type="submit" disabled={companyForm.formState.isSubmitting}>
                    {companyForm.formState.isSubmitting && <Loader2 className="size-4 animate-spin" />}
                    <Building2 className="size-4" />
                    ثبت فاکتور
                  </Button>
                </DialogFooter>
              </form>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
