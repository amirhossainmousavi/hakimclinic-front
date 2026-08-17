"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Search, UserPlus } from "lucide-react";
import { PageHeader } from "@/components/design-system/PageHeader";
import { ErrorState } from "@/components/design-system/ErrorState";
import { EmptyState } from "@/components/design-system/EmptyState";
import { PatientsListSkeleton } from "@/components/skeletons/PatientsListSkeleton";
import { PatientListItem } from "@/components/design-system/PatientListItem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { usePatientsList } from "@/features/patients/hooks";
import { PatientDetailDialog } from "@/features/patients/components/PatientDetailDialog";
import { NewPatientDialog } from "@/features/patients/components/NewPatientDialog";
import type { PatientStatus } from "@/features/patients/types";

const STATUS_TABS: { value: string; label: string }[] = [
  { value: "all", label: "همه" },
  { value: "admitted", label: "پذیرش شده" },
  { value: "pending_insurance_approval", label: "در انتظار تاییدیه بیمه" },
  { value: "in_production", label: "در حال ساخت" },
  { value: "ready_for_delivery", label: "آماده تحویل" },
  { value: "delivered", label: "تحویل داده شده" },
];

export default function PatientsPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();

  // Status filter from query param (click on dashboard cards)
  useEffect(() => {
    const q = searchParams.get("status");
    if (q && STATUS_TABS.some((t) => t.value === q)) {
      setStatus(q);
      setPage(1);
    }
  }, [searchParams]);

  // Search by custom file number / national code — 1 second after typing stops
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 1000);
    return () => clearTimeout(t);
  }, [searchInput]);

  const params = useMemo(
    () => ({
      search: search || undefined,
      status: status === "all" ? undefined : (status as PatientStatus),
      page,
      limit: 10,
    }),
    [search, status, page]
  );

  const { data, isLoading, isError } = usePatientsList(params);
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <div className="space-y-6">
      <PageHeader
        title="بیماران"
        description="مدیریت بیماران و پذیرش جدید"
        breadcrumb={["پنل مدیریت", "بیماران"]}
        actions={
          <Button onClick={() => setNewDialogOpen(true)}>
            <UserPlus className="size-4" />
            پذیرش بیمار جدید
          </Button>
        }
      />

      {isLoading ? (
        <PatientsListSkeleton />
      ) : isError ? (
        <ErrorState onRetry={() => queryClient.invalidateQueries({ queryKey: ["patients"] })} />
      ) : !data ? (
        <EmptyState />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Input
              icon={Search}
              placeholder="جست‌وجو بر اساس شماره پرونده اختصاصی یا کدملی…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="max-w-sm"
            />
            <Tabs value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
              <TabsList className="flex-wrap h-auto">
                {STATUS_TABS.map((t) => (
                  <TabsTrigger key={t.value} value={t.value} className="text-xs">
                    {t.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {data.items.length === 0 ? (
            <EmptyState
              title="بیماری یافت نشد"
              description="با تغییر فیلترها یا جست‌وجو دوباره امتحان کنید."
              action={<Button variant="outline" size="sm" onClick={() => setNewDialogOpen(true)}><Plus className="size-4" /> پذیرش بیمار جدید</Button>}
            />
          ) : (
            <>
              {/* Desktop: table */}
              <div className="hidden overflow-hidden rounded-2xl border bg-card md:block">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/40">
                    <tr>
                      {["بیمار", "شماره پرونده", "پرونده اختصاصی", "کدملی", "محل پذیرش", "وضعیت", "تاریخ پذیرش"].map((h) => (
                        <th key={h} className="px-4 py-3 text-start font-medium text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((p) => (
                      <tr
                        key={p.id}
                        onClick={() => setSelectedPatientId(p.id)}
                        className="cursor-pointer border-b last:border-0 hover:bg-muted/30"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="size-8">
                              <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                                {p.fullName.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{p.fullName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 tabular-nums">{p.fileNumber}</td>
                        <td className="px-4 py-3 tabular-nums font-medium">{p.customFileNumber}</td>
                        <td className="px-4 py-3 tabular-nums">{p.nationalCode}</td>
                        <td className="px-4 py-3">{p.admissionPlaceName ?? "—"}</td>
                        <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                        <td className="px-4 py-3 text-muted-foreground">{new Date(p.createdAt).toLocaleDateString("fa-IR")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile: vertical cards */}
              <div className="space-y-3 md:hidden">
                {data.items.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPatientId(p.id)}
                    className="w-full text-start"
                  >
                    <PatientListItem patient={p} />
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  نمایش {data.items.length} از {data.total} بیمار
                </span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                    قبلی
                  </Button>
                  <span className="tabular-nums">{page} / {totalPages}</span>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                    بعدی
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      <PatientDetailDialog
        patientId={selectedPatientId}
        open={!!selectedPatientId}
        onOpenChange={(o) => {
          if (!o) setSelectedPatientId(null);
        }}
      />

      <NewPatientDialog open={newDialogOpen} onOpenChange={setNewDialogOpen} />
    </div>
  );
}
