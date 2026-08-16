"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, Loader2, Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/design-system/PageHeader";
import { ErrorState } from "@/components/design-system/ErrorState";
import { EmptyState } from "@/components/design-system/EmptyState";
import { InvoicesListSkeleton } from "@/components/skeletons/InvoicesListSkeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useInvoicesList } from "@/features/invoices/hooks";
import { downloadInvoicePdf } from "@/features/invoices/api";
import { INVOICE_TYPE_LABELS, PAYMENT_TYPE_LABELS, type InvoiceType } from "@/features/invoices/types";
import { NewInvoiceDialog } from "@/features/invoices/components/NewInvoiceDialog";
import { formatToman } from "@/lib/utils";

export default function InvoicesPage() {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [invoiceType, setInvoiceType] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 500);
    return () => clearTimeout(t);
  }, [search]);

  const params = useMemo(
    () => ({
      search: debounced || undefined,
      invoiceType: invoiceType === "all" ? undefined : (invoiceType as InvoiceType),
      page,
      limit: 10,
    }),
    [debounced, invoiceType, page]
  );

  const { data, isLoading, isError } = useInvoicesList(params);
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownload = async (invoiceId: string, patientName: string) => {
    if (downloadingId) return;
    setDownloadingId(invoiceId);
    try {
      await downloadInvoicePdf(invoiceId, `فاکتور-${patientName}.pdf`);
      toast.success("فایل PDF دانلود شد");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در دانلود PDF");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="فاکتور"
        description="ثبت و مدیریت فاکتورها"
        breadcrumb={["پنل مدیریت", "فاکتور"]}
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="size-4" />
            فاکتور جدید
          </Button>
        }
      />

      {isLoading ? (
        <InvoicesListSkeleton />
      ) : isError ? (
        <ErrorState onRetry={() => queryClient.invalidateQueries({ queryKey: ["invoices"] })} />
      ) : !data ? (
        <EmptyState />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-sm flex-1">
              <Input
                icon={Search}
                placeholder="جست‌وجو بر اساس شماره فاکتور…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <Tabs value={invoiceType} onValueChange={(v) => { setInvoiceType(v); setPage(1); }}>
              <TabsList>
                <TabsTrigger value="all">همه</TabsTrigger>
                <TabsTrigger value="final">نهایی</TabsTrigger>
                <TabsTrigger value="pro_forma">پیش‌فاکتور</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {data.items.length === 0 ? (
            <EmptyState
              title="فاکتوری یافت نشد"
              description="با تغییر فیلترها یا جست‌وجو دوباره امتحان کنید."
              action={<Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}><Plus className="size-4" /> فاکتور جدید</Button>}
            />
          ) : (
            <>
              {/* Desktop: table */}
              <div className="hidden overflow-hidden rounded-2xl border bg-card md:block">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/40">
                    <tr>
                      {["شماره فاکتور", "بیمار", "نوع", "نحوه پرداخت", "مبلغ کل", "تخفیف", "تاریخ"].map((h) => (
                        <th key={h} className="px-4 py-3 text-start font-medium text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((inv) => (
                      <tr key={inv.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium tabular-nums">{inv.invoiceNumber}</td>
                        <td className="px-4 py-3">{inv.patientName}</td>
                        <td className="px-4 py-3">
                          <Badge variant={inv.invoiceType === "final" ? "default" : "secondary"}>
                            {INVOICE_TYPE_LABELS[inv.invoiceType]}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{PAYMENT_TYPE_LABELS[inv.paymentType]}</td>
                        <td className="px-4 py-3 tabular-nums font-medium">{formatToman(inv.totalAmount)}</td>
                        <td className="px-4 py-3 tabular-nums text-muted-foreground">{formatToman(inv.discountTotal)}</td>
                        <td className="px-4 py-3 text-muted-foreground">{new Date(inv.createdAt).toLocaleDateString("fa-IR")}</td>
                        <td className="px-4 py-3 text-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={downloadingId !== null}
                            onClick={() => handleDownload(inv.id, inv.patientName)}
                          >
                            {downloadingId === inv.id ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
                            دانلود PDF
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile: vertical cards */}
              <div className="space-y-3 md:hidden">
                {data.items.map((inv) => (
                  <div key={inv.id} className="rounded-2xl border bg-card p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{inv.patientName}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">{inv.invoiceNumber}</p>
                      </div>
                      <Badge variant={inv.invoiceType === "final" ? "default" : "secondary"}>
                        {INVOICE_TYPE_LABELS[inv.invoiceType]}
                      </Badge>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="tabular-nums font-semibold">{formatToman(inv.totalAmount)} تومان</span>
                      <span className="text-xs text-muted-foreground">{PAYMENT_TYPE_LABELS[inv.paymentType]}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 w-full"
                      disabled={downloadingId !== null}
                      onClick={() => handleDownload(inv.id, inv.patientName)}
                    >
                      {downloadingId === inv.id ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
                      دانلود PDF
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>نمایش {data.items.length} از {data.total} فاکتور</span>
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

      <NewInvoiceDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
