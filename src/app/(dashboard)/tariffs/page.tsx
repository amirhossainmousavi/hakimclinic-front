"use client";

import { RoleGuard } from "@/components/auth/RoleGuard";
import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlignRight, Loader2, Package, Pencil, Plus, Search, Tag, Trash2, Wallet } from "lucide-react";
import { PageHeader } from "@/components/design-system/PageHeader";
import { ErrorState } from "@/components/design-system/ErrorState";
import { EmptyState } from "@/components/design-system/EmptyState";
import { ConfirmDeleteDialog } from "@/components/design-system/ConfirmDeleteDialog";
import { TariffsListSkeleton } from "@/components/skeletons/TariffsListSkeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useCreateTariff, useDeleteTariff, useTariffsList, useUpdateTariff } from "@/features/tariffs/hooks";
import type { Tariff } from "@/features/tariffs/types";
import { formatToman } from "@/lib/utils";

const tariffSchema = z.object({
  itemCode: z.string().min(2, "کد قطعه الزامی است"),
  itemDescription: z.string().min(3, "نام قطعه باید حداقل ۳ کاراکتر باشد"),
  price: z.coerce.number().min(1, "قیمت الزامی است"),
  description: z.string().optional(),
});

type TariffForm = z.infer<typeof tariffSchema>;

const EMPTY_FORM: TariffForm = { itemCode: "", itemDescription: "", price: 0, description: "" };

export default function TariffsPage() {
  return (
    <RoleGuard allowed={["manager"]}>
      <TariffsPageContent />
    </RoleGuard>
  );
}

function TariffsPageContent() {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Tariff | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Tariff | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 500);
    return () => clearTimeout(t);
  }, [search]);

  const params = useMemo(() => ({ search: debounced || undefined, page, limit: 10 }), [debounced, page]);

  const { data, isLoading, isError } = useTariffsList(params);
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TariffForm>({
    resolver: zodResolver(tariffSchema),
    defaultValues: EMPTY_FORM,
  });

  const createMutation = useCreateTariff();
  const updateMutation = useUpdateTariff();
  const deleteMutation = useDeleteTariff();

  const openCreate = () => {
    setEditing(null);
    reset(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (trf: Tariff) => {
    setEditing(trf);
    reset({
      itemCode: trf.itemCode,
      itemDescription: trf.itemDescription,
      price: trf.price,
      description: trf.description ?? "",
    });
    setDialogOpen(true);
  };

  const onSubmit = handleSubmit(async (values) => {
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, input: values });
    } else {
      await createMutation.mutateAsync(values);
    }
    setDialogOpen(false);
    reset(EMPTY_FORM);
  });

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="تعرفه‌ها"
        description="تعرفه قطعات پروتز"
        breadcrumb={["پنل مدیریت", "تعرفه‌ها"]}
        actions={
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            تعرفه جدید
          </Button>
        }
      />

      {isLoading ? (
        <TariffsListSkeleton />
      ) : isError ? (
        <ErrorState onRetry={() => queryClient.invalidateQueries({ queryKey: ["tariffs"] })} />
      ) : !data ? (
        <EmptyState />
      ) : (
        <div className="space-y-4">
          <div className="max-w-sm">
            <Input
              icon={Search}
              placeholder="جست‌وجو بر اساس کد قطعه…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>

          {data.items.length === 0 ? (
            <EmptyState
              title="تعرفه‌ای یافت نشد"
              description="با تغییر جست‌وجو دوباره امتحان کنید."
              action={<Button variant="outline" size="sm" onClick={openCreate}><Plus className="size-4" /> تعرفه جدید</Button>}
            />
          ) : (
            <>
              {/* Desktop: table */}
              <div className="hidden overflow-hidden rounded-2xl border bg-card md:block">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/40">
                    <tr>
                      {["کد قطعه", "نام قطعه", "قیمت (تومان)", "توضیحات", "عملیات"].map((h) => (
                        <th key={h} className="px-4 py-3 text-start font-medium text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((trf) => (
                      <tr key={trf.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium tabular-nums">{trf.itemCode}</td>
                        <td className="px-4 py-3">{trf.itemDescription}</td>
                        <td className="px-4 py-3 tabular-nums font-medium">{formatToman(trf.price)}</td>
                        <td className="px-4 py-3 text-muted-foreground">{trf.description ?? "—"}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" title="ویرایش" onClick={() => openEdit(trf)}>
                              <Pencil className="size-4" />
                            </Button>
                            <Button variant="ghost" size="icon" title="حذف" className="text-destructive hover:text-destructive" onClick={() => setDeleteTarget(trf)}>
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile: vertical cards */}
              <div className="space-y-3 md:hidden">
                {data.items.map((trf) => (
                  <div key={trf.id} className="rounded-2xl border bg-card p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{trf.itemDescription}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">{trf.itemCode}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" title="ویرایش" onClick={() => openEdit(trf)}>
                          <Pencil className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon" title="حذف" className="text-destructive hover:text-destructive" onClick={() => setDeleteTarget(trf)}>
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-sm font-semibold tabular-nums">{formatToman(trf.price)} تومان</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>نمایش {data.items.length} از {data.total} تعرفه</span>
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

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(o) => {
          if (!o) setDeleteTarget(null);
        }}
        title="حذف تعرفه"
        description={
          deleteTarget
            ? `آیا مطمئن هستید قطعه «${deleteTarget.itemDescription}» از تعرفه‌ها حذف شود؟`
            : undefined
        }
        confirmLabel="حذف"
        isLoading={deleteMutation.isPending}
        onConfirm={confirmDelete}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "ویرایش تعرفه" : "تعرفه جدید"}</DialogTitle>
            <DialogDescription>
              {editing ? "اطلاعات قطعه را ویرایش کنید" : "قطعه جدیدی به تعرفه‌ها اضافه کنید"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="itemCode">کد قطعه</Label>
                <Input id="itemCode" icon={Tag} placeholder="مثلاً TRF-1001" {...register("itemCode")} />
                {errors.itemCode && <p className="text-xs text-destructive">{errors.itemCode.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">قیمت (تومان)</Label>
                <Input id="price" icon={Wallet} type="number" inputMode="numeric" placeholder="مثلاً ۳۲۰۰۰۰۰" {...register("price")} />
                {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="itemDescription">نام قطعه</Label>
              <Input id="itemDescription" icon={Package} placeholder="مثلاً مفصل زانوی هیدرولیک" {...register("itemDescription")} />
              {errors.itemDescription && <p className="text-xs text-destructive">{errors.itemDescription.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">توضیحات</Label>
              <Input id="description" icon={AlignRight} placeholder="اختیاری" {...register("description")} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>انصراف</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                {editing ? "ذخیره تغییرات" : "ثبت تعرفه"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
