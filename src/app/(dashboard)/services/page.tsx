"use client";

import { RoleGuard } from "@/components/auth/RoleGuard";
import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlignRight, Loader2, Pencil, Plus, Search, Stethoscope, Tag, Trash2, Wallet } from "lucide-react";
import { PageHeader } from "@/components/design-system/PageHeader";
import { ErrorState } from "@/components/design-system/ErrorState";
import { EmptyState } from "@/components/design-system/EmptyState";
import { ConfirmDeleteDialog } from "@/components/design-system/ConfirmDeleteDialog";
import { ServicesListSkeleton } from "@/components/skeletons/ServicesListSkeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateService, useDeleteService, useServicesList, useUpdateService } from "@/features/services/hooks";
import { SERVICE_TYPE_LABELS, serviceDisplayName, type Service, type ServiceType } from "@/features/services/types";
import { formatToman } from "@/lib/utils";

const serviceSchema = z.object({
  serviceType: z.enum(["orthosis", "prosthesis"], { message: "نوع خدمت را انتخاب کنید" }),
  serviceName: z.string().min(3, "نام خدمت باید حداقل ۳ کاراکتر باشد"),
  serviceCode: z.string().min(2, "کد خدمت الزامی است"),
  price: z.coerce.number().min(1, "قیمت الزامی است"),
  description: z.string().optional(),
});

type ServiceForm = z.infer<typeof serviceSchema>;

const EMPTY_FORM: ServiceForm = {
  serviceType: "orthosis",
  serviceName: "",
  serviceCode: "",
  price: 0,
  description: "",
};

export default function ServicesPage() {
  return (
    <RoleGuard allowed={["manager"]}>
      <ServicesPageContent />
    </RoleGuard>
  );
}

function ServicesPageContent() {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [serviceType, setServiceType] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 500);
    return () => clearTimeout(t);
  }, [search]);

  const params = useMemo(
    () => ({
      search: debounced || undefined,
      serviceType: serviceType === "all" ? undefined : (serviceType as ServiceType),
      page,
      limit: 10,
    }),
    [debounced, serviceType, page]
  );

  const { data, isLoading, isError } = useServicesList(params);
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ServiceForm>({
    resolver: zodResolver(serviceSchema),
    defaultValues: EMPTY_FORM,
  });

  const formServiceType = watch("serviceType");

  const createMutation = useCreateService();
  const updateMutation = useUpdateService();
  const deleteMutation = useDeleteService();

  const openCreate = () => {
    setEditing(null);
    reset(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (svc: Service) => {
    setEditing(svc);
    reset({
      serviceType: svc.serviceType,
      serviceName: svc.serviceName ?? "",
      serviceCode: svc.serviceCode,
      price: svc.price,
      description: svc.description ?? "",
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
        title="خدمات"
        description="مدیریت خدمات ارتز و پروتز"
        breadcrumb={["پنل مدیریت", "خدمات"]}
        actions={
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            خدمت جدید
          </Button>
        }
      />

      {isLoading ? (
        <ServicesListSkeleton />
      ) : isError ? (
        <ErrorState onRetry={() => queryClient.invalidateQueries({ queryKey: ["services"] })} />
      ) : !data ? (
        <EmptyState />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-sm flex-1">
              <Input
                icon={Search}
                placeholder="جست‌وجو بر اساس کد خدمت…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <Tabs value={serviceType} onValueChange={(v) => { setServiceType(v); setPage(1); }}>
              <TabsList>
                <TabsTrigger value="all">همه</TabsTrigger>
                <TabsTrigger value="orthosis">ارتز</TabsTrigger>
                <TabsTrigger value="prosthesis">پروتز</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {data.items.length === 0 ? (
            <EmptyState
              title="خدمتی یافت نشد"
              description="با تغییر فیلترها یا جست‌وجو دوباره امتحان کنید."
              action={<Button variant="outline" size="sm" onClick={openCreate}><Plus className="size-4" /> خدمت جدید</Button>}
            />
          ) : (
            <>
              {/* Desktop: table */}
              <div className="hidden overflow-hidden rounded-2xl border bg-card md:block">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/40">
                    <tr>
                      {["کد خدمت", "نام خدمت", "نوع", "قیمت (تومان)", "توضیحات", "عملیات"].map((h) => (
                        <th key={h} className="px-4 py-3 text-start font-medium text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((svc) => (
                      <tr key={svc.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium tabular-nums">{svc.serviceCode}</td>
                        <td className="px-4 py-3">{serviceDisplayName(svc)}</td>
                        <td className="px-4 py-3">
                          <Badge variant={svc.serviceType === "orthosis" ? "secondary" : "outline"}>
                            {SERVICE_TYPE_LABELS[svc.serviceType]}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 tabular-nums font-medium">{formatToman(svc.price)}</td>
                        <td className="px-4 py-3 text-muted-foreground">{svc.description ?? "—"}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" title="ویرایش" onClick={() => openEdit(svc)}>
                              <Pencil className="size-4" />
                            </Button>
                            <Button variant="ghost" size="icon" title="حذف" className="text-destructive hover:text-destructive" onClick={() => setDeleteTarget(svc)}>
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
                {data.items.map((svc) => (
                  <div key={svc.id} className="rounded-2xl border bg-card p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{serviceDisplayName(svc)}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">{svc.serviceCode}</p>
                      </div>
                      <Badge variant={svc.serviceType === "orthosis" ? "secondary" : "outline"}>
                        {SERVICE_TYPE_LABELS[svc.serviceType]}
                      </Badge>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-sm font-semibold tabular-nums">{formatToman(svc.price)} تومان</span>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" title="ویرایش" onClick={() => openEdit(svc)}>
                          <Pencil className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon" title="حذف" className="text-destructive hover:text-destructive" onClick={() => setDeleteTarget(svc)}>
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>نمایش {data.items.length} از {data.total} خدمت</span>
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
        title="حذف خدمت"
        description={
          deleteTarget
            ? `آیا مطمئن هستید خدمت «${serviceDisplayName(deleteTarget)}» از فهرست خدمات حذف شود؟`
            : undefined
        }
        confirmLabel="حذف"
        isLoading={deleteMutation.isPending}
        onConfirm={confirmDelete}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "ویرایش خدمت" : "خدمت جدید"}</DialogTitle>
            <DialogDescription>
              {editing ? "اطلاعات خدمت را ویرایش کنید" : "خدمت جدیدی به فهرست اضافه کنید"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>نوع خدمت</Label>
                <Select value={formServiceType} onValueChange={(v) => setValue("serviceType", v as ServiceType, { shouldValidate: true })}>
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب کنید" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="orthosis">ارتز</SelectItem>
                    <SelectItem value="prosthesis">پروتز</SelectItem>
                  </SelectContent>
                </Select>
                {errors.serviceType && <p className="text-xs text-destructive">{errors.serviceType.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="serviceCode">کد خدمت</Label>
                <Input id="serviceCode" icon={Tag} placeholder="مثلاً ORT-101" {...register("serviceCode")} />
                {errors.serviceCode && <p className="text-xs text-destructive">{errors.serviceCode.message}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="serviceName">نام خدمت</Label>
              <Input id="serviceName" icon={Stethoscope} placeholder="مثلاً ساخت زانوبند طبی" {...register("serviceName")} />
              {errors.serviceName && <p className="text-xs text-destructive">{errors.serviceName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">قیمت (تومان)</Label>
              <Input id="price" icon={Wallet} type="number" inputMode="numeric" placeholder="مثلاً ۳۵۰۰۰۰۰" {...register("price")} />
              {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">توضیحات</Label>
              <Input id="description" icon={AlignRight} placeholder="اختیاری" {...register("description")} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>انصراف</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                {editing ? "ذخیره تغییرات" : "ثبت خدمت"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
