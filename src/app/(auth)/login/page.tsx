"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CreditCard, Loader2, Phone, Stethoscope } from "lucide-react";
import { useAuth } from "@/features/auth/context";
import { ApiError } from "@/lib/api-error";
import { toEnglishDigits } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const loginSchema = z.object({
  nationalCode: z
    .string()
    .min(10, "کدملی باید ۱۰ رقم باشد")
    .max(10, "کدملی باید ۱۰ رقم باشد"),
  phone: z
    .string()
    .min(11, "شماره تلفن نامعتبر است")
    .max(11, "شماره تلفن نامعتبر است"),
});

type LoginForm = z.infer<typeof loginSchema>;

// Demo quick-fill accounts are opt-in via NEXT_PUBLIC_ENABLE_DEMO_ACCOUNTS=true.
// Their credentials are known publicly, so they must never be shown unless
// explicitly enabled for a staging/demo environment.
const ENABLE_DEMO_ACCOUNTS = process.env.NEXT_PUBLIC_ENABLE_DEMO_ACCOUNTS === "true";
const DEMO_ACCOUNTS = ENABLE_DEMO_ACCOUNTS
  ? [
      { label: "مدیر کلینیک", nationalCode: "1111111111", phone: "09120000000" },
      { label: "منشی پذیرش (سطح ۲)", nationalCode: "2222222222", phone: "09220000000" },
      { label: "منشی پیگیری (سطح ۱)", nationalCode: "3333333333", phone: "09330000000" },
    ]
  : [];

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { nationalCode: "", phone: "" },
  });

  const onSubmit = async (values: LoginForm) => {
    setServerError(null);
    try {
      await login({
        nationalCode: toEnglishDigits(values.nationalCode),
        phone: toEnglishDigits(values.phone),
      });
      const next = searchParams.get("next");
      router.replace(next && next.startsWith("/") ? next : "/dashboard");
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : "خطا در ورود به سیستم");
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background p-4">
      {/* Gradient background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -start-40 -top-40 size-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -end-40 size-96 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl gradient-primary shadow-glow">
            <Stethoscope className="size-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">پنل کلینیک ارتوپدی فنی حکیم</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              برای ادامه، وارد حساب کاربری خود شوید
            </p>
          </div>
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">ورود به پنل</CardTitle>
            <CardDescription>کدملی و شماره تلفن همراه خود را وارد کنید</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="nationalCode">کدملی</Label>
                <Input
                  id="nationalCode"
                  icon={CreditCard}
                  inputMode="numeric"
                  placeholder="مثلاً ۱۲۳۴۵۶۷۸۹۰"
                  {...register("nationalCode")}
                />
                {errors.nationalCode && (
                  <p className="text-xs text-destructive">{errors.nationalCode.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">شماره تلفن</Label>
                <Input
                  id="phone"
                  icon={Phone}
                  inputMode="tel"
                  placeholder="مثلاً ۰۹۱۲۳۴۵۶۷۸۹"
                  {...register("phone")}
                />
                {errors.phone && (
                  <p className="text-xs text-destructive">{errors.phone.message}</p>
                )}
              </div>

              {serverError && (
                <div className="rounded-xl bg-destructive/10 px-3 py-2.5 text-sm font-medium text-destructive">
                  {serverError}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                ورود
              </Button>
            </form>

            {DEMO_ACCOUNTS.length > 0 && (
              <div className="mt-6 border-t pt-4">
                <p className="mb-2 text-xs text-muted-foreground">حساب‌های آزمایشی:</p>
                <div className="flex flex-wrap gap-2">
                  {DEMO_ACCOUNTS.map((acc) => (
                    <button
                      key={acc.nationalCode}
                      type="button"
                      onClick={() => {
                        setValue("nationalCode", acc.nationalCode);
                        setValue("phone", acc.phone);
                        setServerError(null);
                      }}
                      className="rounded-full border border-input bg-card px-3 py-1 text-xs font-medium transition-all hover:border-primary/40 hover:bg-accent"
                    >
                      {acc.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}