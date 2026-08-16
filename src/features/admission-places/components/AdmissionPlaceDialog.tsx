"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2, Loader2, MapPin, ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ADMISSION_PLACE_TYPE_LABELS,
  type AdmissionPlace,
  type AdmissionPlaceType,
} from "@/features/admission-places/types";
import { useCreateAdmissionPlace, useUpdateAdmissionPlace } from "@/features/admission-places/hooks";
import { useInsurances } from "@/features/insurances/hooks";

const schema = z.object({
  name: z.string().min(1, "نام محل پذیرش الزامی است"),
  address: z.string().min(1, "آدرس محل پذیرش الزامی است"),
  description: z.string().optional(),
  admissionType: z.enum(["free_only", "insured_only", "both"]),
});

type FormValues = z.infer<typeof schema>;

interface AdmissionPlaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: AdmissionPlace | null;
}

export function AdmissionPlaceDialog({
  open,
  onOpenChange,
  editing,
}: AdmissionPlaceDialogProps) {
  const { data: insurances } = useInsurances();
  const createMutation = useCreateAdmissionPlace();
  const updateMutation = useUpdateAdmissionPlace();

  const [insuranceIds, setInsuranceIds] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      address: "",
      description: "",
      admissionType: "both",
    },
  });

  useEffect(() => {
    if (open) {
      if (editing) {
        reset({
          name: editing.name,
          address: editing.address,
          description: editing.description ?? "",
          admissionType: editing.admissionType,
        });
        setInsuranceIds(editing.insurances.map((i) => i.insuranceId));
      } else {
        reset({ name: "", address: "", description: "", admissionType: "both" });
        setInsuranceIds([]);
      }
    }
  }, [open, editing, reset]);

  const admissionType = watch("admissionType");
  const needsInsurance = admissionType !== "free_only";
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const toggleInsurance = (id: string) =>
    setInsuranceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const onSubmit = handleSubmit(async (values) => {
    if (needsInsurance && insuranceIds.length === 0) {
      toast.error("برای این نوع پذیرش حداقل یک بیمه انتخاب کنید");
      return;
    }
    const input = {
      name: values.name,
      address: values.address,
      description: values.description || undefined,
      admissionType: values.admissionType,
      insuranceIds: needsInsurance ? insuranceIds : [],
    };
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, input });
    } else {
      await createMutation.mutateAsync(input);
    }
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{editing ? "ویرایش محل پذیرش" : "افزودن محل پذیرش جدید"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "اطلاعات محل پذیرش را ویرایش کنید"
              : "محل پذیرشی را که بیماران به آن ارجاع می‌شوند ثبت کنید"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4" dir="rtl" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ap-name">نام محل پذیرش</Label>
              <Input
                id="ap-name"
                icon={Building2}
                placeholder="مثلاً بیمارستان خاتم"
                {...register("name")}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="ap-type">نوع پذیرش</Label>
              <Select
                value={admissionType}
                onValueChange={(v) => setValue("admissionType", v as AdmissionPlaceType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ADMISSION_PLACE_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ap-address">آدرس</Label>
            <Input
              id="ap-address"
              icon={MapPin}
              placeholder="مثلاً تهران، خیابان ولیعصر، پلاک ۱۲۳"
              {...register("address")}
            />
            {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="ap-description">توضیحات</Label>
            <textarea
              id="ap-description"
              rows={3}
              className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="توضیحات اضافه (اختیاری)"
              {...register("description")}
            />
          </div>

          {needsInsurance && (
            <div className="space-y-2">
              <Label>بیمه‌های طرف قرارداد</Label>
              {!insurances || insurances.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  ابتدا بیمه‌ای ثبت کنید تا بتوانید آن را به محل وصل کنید.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {insurances.map((ins) => {
                    const selected = insuranceIds.includes(ins.id);
                    return (
                      <button
                        key={ins.id}
                        type="button"
                        onClick={() => toggleInsurance(ins.id)}
                        className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-all ${
                          selected
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-input bg-card text-muted-foreground hover:border-primary/40"
                        }`}
                      >
                        <ShieldCheck className="size-3.5" />
                        {ins.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              <X className="size-4" />
              انصراف
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              {editing ? "ذخیره تغییرات" : "ثبت محل پذیرش"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
