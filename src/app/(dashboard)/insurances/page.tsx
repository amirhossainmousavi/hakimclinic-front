"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BadgeCheck, Loader2, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { PageHeader } from "@/components/design-system/PageHeader";
import { ErrorState } from "@/components/design-system/ErrorState";
import { EmptyState } from "@/components/design-system/EmptyState";
import { ConfirmDeleteDialog } from "@/components/design-system/ConfirmDeleteDialog";
import { InsurancesSkeleton } from "@/components/skeletons/InsurancesSkeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useApproveInsurance, useCreateInsurance, useDeleteInsurance, useInsurances } from "@/features/insurances/hooks";
import type { Insurance } from "@/features/insurances/types";

const insuranceSchema = z.object({ name: z.string().min(2, "نام بیمه الزامی است") });
type InsuranceForm = z.infer<typeof insuranceSchema>;

export default function InsurancesPage() {
  return (
    <RoleGuard allowed={["manager"]}>
      <InsurancesContent />
    </RoleGuard>
  );
}

function InsurancesContent() {
  const [open, setOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Insurance | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useInsurances();
  const createMutation = useCreateInsurance();
  const approveMutation = useApproveInsurance();
  const deleteMutation = useDeleteInsurance();

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<InsuranceForm>({ resolver: zodResolver(insuranceSchema), defaultValues: { name: "" } });

  const onSubmit = handleSubmit(async (values) => {
    await createMutation.mutateAsync(values);
    reset({ name: "" });
    setOpen(false);
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="بیمه‌ها"
        description="بیمه‌های طرف قرارداد کلینیک"
        breadcrumb={["پنل مدیریت", "بیمه‌ها"]}
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="size-4" />
            بیمه جدید
          </Button>
        }
      />

      {isLoading ? (
        <InsurancesSkeleton />
      ) : isError ? (
        <ErrorState onRetry={() => queryClient.invalidateQueries({ queryKey: ["insurances"] })} />
      ) : !data || data.length === 0 ? (
        <EmptyState title="بیمه‌ای ثبت نشده است" description="بیمه جدیدی اضافه کنید." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((ins) => (
            <Card key={ins.id}>
              <CardContent className="flex items-center justify-between p-5">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <ShieldCheck className="size-5" />
                  </div>
                  <div>
                    <p className="font-medium">{ins.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {ins.isApproved ? "تأییدشده" : "در انتظار تأیید"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {ins.isApproved ? (
                    <Badge variant="success">تأییدشده</Badge>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => approveMutation.mutate(ins.id)}>
                      <BadgeCheck className="size-3.5" /> تأیید
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    title="حذف بیمه"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleteTarget(ins)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(o) => {
          if (!o) setDeleteTarget(null);
        }}
        title="حذف بیمه"
        description={
          deleteTarget
            ? `آیا مطمئن هستید بیمه «${deleteTarget.name}» از لیست بیمه‌ها حذف شود؟`
            : undefined
        }
        confirmLabel="حذف"
        isLoading={deleteMutation.isPending}
        onConfirm={confirmDelete}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>بیمه جدید</DialogTitle>
            <DialogDescription>بیمه‌ای به لیست طرف قراردادها اضافه کنید</DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="ins-name">نام بیمه</Label>
              <Input id="ins-name" icon={ShieldCheck} placeholder="مثلاً تأمین اجتماعی" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>انصراف</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                ثبت بیمه
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
