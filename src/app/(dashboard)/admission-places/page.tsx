"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Building2, Loader2, MapPin, Pencil, Phone, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { PageHeader } from "@/components/design-system/PageHeader";
import { ErrorState } from "@/components/design-system/ErrorState";
import { EmptyState } from "@/components/design-system/EmptyState";
import { ConfirmDeleteDialog } from "@/components/design-system/ConfirmDeleteDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AdmissionPlaceDialog } from "@/features/admission-places/components/AdmissionPlaceDialog";
import {
  useAdmissionPlaces,
  useDeleteAdmissionPlace,
} from "@/features/admission-places/hooks";
import {
  ADMISSION_PLACE_TYPE_LABELS,
  type AdmissionPlace,
} from "@/features/admission-places/types";

export default function AdmissionPlacesPage() {
  return (
    <RoleGuard allowed={["manager"]}>
      <AdmissionPlacesContent />
    </RoleGuard>
  );
}

function AdmissionPlacesContent() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdmissionPlace | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdmissionPlace | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useAdmissionPlaces();
  const deleteMutation = useDeleteAdmissionPlace();

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (place: AdmissionPlace) => {
    setEditing(place);
    setDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="محل پذیرش بیمار"
        description="مدیریت محل‌های پذیرش (کلینیک، بیمارستان و…)"
        breadcrumb={["پنل مدیریت", "محل پذیرش بیمار"]}
        actions={
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            افزودن محل پذیرش جدید
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl border bg-muted/40" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => queryClient.invalidateQueries({ queryKey: ["admission-places"] })} />
      ) : !data || data.length === 0 ? (
        <EmptyState
          title="محل پذیرشی ثبت نشده است"
          description="با افزودن محل پذیرش جدید شروع کنید."
          action={
            <Button variant="outline" size="sm" onClick={openCreate}>
              <Plus className="size-4" /> افزودن محل پذیرش جدید
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((place) => (
            <Card key={place.id}>
              <CardContent className="flex h-full flex-col gap-3 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Building2 className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{place.name}</p>
                      <p className="flex items-start gap-1 text-xs text-muted-foreground">
                        <MapPin className="mt-0.5 size-3 shrink-0" />
                        <span className="break-words">{place.address}</span>
                      </p>
                    </div>
                  </div>
                  <Badge variant={place.admissionType === "free_only" ? "secondary" : "success"}>
                    {ADMISSION_PLACE_TYPE_LABELS[place.admissionType]}
                  </Badge>
                </div>

                {(place.centerNumbers.length > 0 || place.phone) && (
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Phone className="size-3 shrink-0" />
                    <span className="flex flex-wrap gap-x-1.5" dir="ltr">
                      {(place.centerNumbers.length > 0
                        ? place.centerNumbers
                        : place.phone
                          ? [place.phone]
                          : []
                      ).map((n, i) => (
                        <span key={i}>
                          {i > 0 && <span className="mx-0.5 text-muted-foreground/60">·</span>}
                          {n}
                        </span>
                      ))}
                    </span>
                  </p>
                )}

                {place.description && (
                  <p className="text-xs text-muted-foreground">{place.description}</p>
                )}

                <div className="space-y-2">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    <ShieldCheck className="size-3.5" />
                    بیمه‌ها
                  </p>
                  {place.insurances.length === 0 ? (
                    <p className="text-xs text-muted-foreground">بیمه‌ای وصل نیست</p>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {place.insurances.map((ins) => (
                        <span
                          key={ins.id}
                          className="whitespace-nowrap rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
                        >
                          {ins.insurance.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-auto flex items-center gap-1 border-t pt-3">
                  <Button variant="outline" size="sm" onClick={() => openEdit(place)}>
                    <Pencil className="size-3.5" /> ویرایش
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ms-auto text-destructive hover:text-destructive"
                    onClick={() => setDeleteTarget(place)}
                    disabled={deleteMutation.isPending}
                  >
                    {deleteMutation.isPending ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="size-3.5" />
                    )}
                    حذف
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="حذف محل پذیرش"
        description={
          deleteTarget
            ? `آیا مطمئن هستید «${deleteTarget.name}» از لیست مراکز درمانی حذف شود؟`
            : undefined
        }
        confirmLabel="حذف"
        isLoading={deleteMutation.isPending}
        onConfirm={confirmDelete}
      />

      <AdmissionPlaceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
      />
    </div>
  );
}
