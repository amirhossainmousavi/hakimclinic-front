"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Building2,
  CheckCircle2,
  CreditCard,
  Loader2,
  Pencil,
  Phone,
  Plus,
  ShieldCheck,
  Trash2,
  User,
  XCircle,
} from "lucide-react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { PageHeader } from "@/components/design-system/PageHeader";
import { ErrorState } from "@/components/design-system/ErrorState";
import { EmptyState } from "@/components/design-system/EmptyState";
import { ConfirmDeleteDialog } from "@/components/design-system/ConfirmDeleteDialog";
import { SecretariesListSkeleton } from "@/components/skeletons/SecretariesListSkeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useAdmissionPlaces } from "@/features/admission-places/hooks";
import {
  useCreateSecretary,
  useDeleteSecretary,
  useSecretaries,
  useSetSecretaryActive,
  useUpdateSecretary,
  useUpdateSecretaryPermissions,
  useUpdateSecretaryWorkplaces,
} from "@/features/secretaries/hooks";
import {
  DEFAULT_SECRETARY_PERMISSIONS,
  SECRETARY_PERMISSION_LABELS,
  type Secretary,
} from "@/features/secretaries/types";
import type { SecretaryPermissionKey } from "@/lib/types";
import { toEnglishDigits } from "@/lib/utils";

const secretarySchema = z.object({
  nationalCode: z.string().length(10, "کدملی باید ۱۰ رقم باشد"),
  phone: z.string().length(11, "شماره تلفن نامعتبر است"),
  fullName: z.string().min(3, "نام کامل الزامی است"),
});
type SecretaryForm = z.infer<typeof secretarySchema>;

const EMPTY_FORM: SecretaryForm = { nationalCode: "", phone: "", fullName: "" };

const ALL_PERMISSIONS: SecretaryPermissionKey[] = [
  "dashboard",
  "patients",
  "appointments",
  "invoices",
  "expenses",
];

export default function SecretariesPage() {
  return (
    <RoleGuard allowed={["manager"]}>
      <SecretariesContent />
    </RoleGuard>
  );
}

function SecretariesContent() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Secretary | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Secretary | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useSecretaries();
  const { data: places } = useAdmissionPlaces();
  const createMutation = useCreateSecretary();
  const updateMutation = useUpdateSecretary();
  const updateWorkplacesMutation = useUpdateSecretaryWorkplaces();
  const updatePermissionsMutation = useUpdateSecretaryPermissions();
  const setActiveMutation = useSetSecretaryActive();
  const deleteMutation = useDeleteSecretary();

  const [selectedPlaceIds, setSelectedPlaceIds] = useState<string[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<SecretaryPermissionKey[]>(DEFAULT_SECRETARY_PERMISSIONS);

  const togglePlace = (id: string) =>
    setSelectedPlaceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const togglePermission = (key: SecretaryPermissionKey) =>
    setSelectedPermissions((prev) =>
      prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]
    );

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<SecretaryForm>({ resolver: zodResolver(secretarySchema), defaultValues: EMPTY_FORM });

  const openCreate = () => {
    setEditing(null);
    reset(EMPTY_FORM);
    setSelectedPlaceIds([]);
    setSelectedPermissions(DEFAULT_SECRETARY_PERMISSIONS);
    setDialogOpen(true);
  };

  const openEdit = (sec: Secretary) => {
    setEditing(sec);
    reset({ nationalCode: sec.nationalCode, phone: sec.phone, fullName: sec.fullName });
    setSelectedPlaceIds(sec.secretaryScopes.map((s) => s.place.id));
    setSelectedPermissions(sec.secretaryPermissions.map((p) => p.permissionKey));
    setDialogOpen(true);
  };

  const onSubmit = handleSubmit(async (values) => {
    const input = {
      ...values,
      nationalCode: toEnglishDigits(values.nationalCode),
      phone: toEnglishDigits(values.phone),
    };
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, input });
      await updateWorkplacesMutation.mutateAsync({ id: editing.id, workplaceIds: selectedPlaceIds });
      await updatePermissionsMutation.mutateAsync({ id: editing.id, permissions: selectedPermissions });
    } else {
      await createMutation.mutateAsync({
        ...input,
        workplaceIds: selectedPlaceIds,
        permissions: selectedPermissions,
      });
    }
    setDialogOpen(false);
    reset(EMPTY_FORM);
  });

  const handleToggleActive = (sec: Secretary) => {
    setActiveMutation.mutate({ id: sec.id, isActive: !sec.isActive });
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
        title="منشی‌ها"
        description="مدیریت منشی‌ها، محل‌های کار و دسترسی‌های پنل"
        breadcrumb={["پنل مدیریت", "منشی‌ها"]}
        actions={
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            منشی جدید
          </Button>
        }
      />

      {isLoading ? (
        <SecretariesListSkeleton />
      ) : isError ? (
        <ErrorState onRetry={() => queryClient.invalidateQueries({ queryKey: ["secretaries"] })} />
      ) : !data || data.length === 0 ? (
        <EmptyState title="منشی‌ای ثبت نشده است" description="با افزودن منشی جدید شروع کنید." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((sec) => (
            <div key={sec.id} className={`rounded-2xl border bg-card p-4 ${sec.isActive ? "" : "opacity-70"}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                    {sec.fullName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium">{sec.fullName}</p>
                    <p className="text-xs text-muted-foreground tabular-nums" dir="ltr">{sec.phone}</p>
                  </div>
                </div>
                <Badge variant={sec.isActive ? "success" : "secondary"}>
                  {sec.isActive ? "فعال" : "غیرفعال"}
                </Badge>
              </div>

              <div className="mt-3 space-y-2">
                <div className="flex flex-wrap gap-1">
                  {sec.secretaryScopes.length === 0 ? (
                    <span className="whitespace-nowrap rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                      محل کار ندارد
                    </span>
                  ) : (
                    sec.secretaryScopes.map((s) => (
                      <span key={s.place.id} className="flex items-center gap-1 whitespace-nowrap rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                        <Building2 className="size-3" />
                        {s.place.name}
                      </span>
                    ))
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  {sec.secretaryPermissions.length === 0 ? (
                    <span className="whitespace-nowrap rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                      دسترسی ندارد
                    </span>
                  ) : (
                    sec.secretaryPermissions.map((p) => (
                      <span key={p.id} className="flex items-center gap-1 whitespace-nowrap rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
                        <ShieldCheck className="size-3" />
                        {SECRETARY_PERMISSION_LABELS[p.permissionKey]}
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-1 border-t pt-3">
                <Button variant="outline" size="sm" onClick={() => openEdit(sec)}>
                  <Pencil className="size-3.5" /> ویرایش
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleActive(sec)}
                  disabled={setActiveMutation.isPending}
                >
                  {sec.isActive ? (
                    <><XCircle className="size-3.5" /> غیرفعال‌کردن</>
                  ) : (
                    <><CheckCircle2 className="size-3.5" /> فعال‌کردن</>
                  )}
                </Button>
                <Button variant="ghost" size="sm" className="ms-auto text-destructive hover:text-destructive" onClick={() => setDeleteTarget(sec)}>
                  <Trash2 className="size-3.5" /> حذف
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(o) => {
          if (!o) setDeleteTarget(null);
        }}
        title="حذف منشی"
        description={
          deleteTarget
            ? `آیا مطمئن هستید منشی «${deleteTarget.fullName}» از پنل حذف شود؟`
            : undefined
        }
        confirmLabel="حذف"
        isLoading={deleteMutation.isPending}
        onConfirm={confirmDelete}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing ? "ویرایش منشی" : "منشی جدید"}</DialogTitle>
            <DialogDescription>{editing ? "اطلاعات، محل‌های کار و دسترسی‌ها را ویرایش کنید" : "منشی جدیدی به کلینیک اضافه کنید"}</DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="sec-name">نام کامل</Label>
              <Input id="sec-name" icon={User} placeholder="مثلاً زهرا محمدی" {...register("fullName")} />
              {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="sec-nc">کدملی</Label>
                <Input id="sec-nc" icon={CreditCard} inputMode="numeric" placeholder="۱۰ رقم" {...register("nationalCode")} />
                {errors.nationalCode && <p className="text-xs text-destructive">{errors.nationalCode.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="sec-phone">شماره تلفن</Label>
                <Input id="sec-phone" icon={Phone} inputMode="tel" placeholder="۰۹۱۲..." {...register("phone")} />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label>محل‌های کار منشی</Label>
              <p className="text-xs text-muted-foreground">
                منشی فقط بیماران همین محل‌ها را می‌بیند.
              </p>
              {!places || places.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  ابتدا محل پذیرشی ثبت کنید تا به منشی اضافه کنید.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {places.map((pl) => {
                    const selected = selectedPlaceIds.includes(pl.id);
                    return (
                      <button
                        key={pl.id}
                        type="button"
                        onClick={() => togglePlace(pl.id)}
                        className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-all ${
                          selected
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-input bg-card text-muted-foreground hover:border-primary/40"
                        }`}
                      >
                        <Building2 className="size-3.5" />
                        {pl.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>دسترسی‌های پنل</Label>
              <p className="text-xs text-muted-foreground">
                پیش‌فرض: داشبورد، بیماران، فاکتور، تنظیمات — دسترسی بیشتر را روشن کنید.
              </p>
              <div className="flex flex-wrap gap-2">
                {ALL_PERMISSIONS.map((key) => {
                  const selected = selectedPermissions.includes(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => togglePermission(key)}
                      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-all ${
                        selected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-input bg-card text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      <ShieldCheck className="size-3.5" />
                      {SECRETARY_PERMISSION_LABELS[key]}
                    </button>
                  );
                })}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>انصراف</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                {editing ? "ذخیره تغییرات" : "ثبت منشی"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
