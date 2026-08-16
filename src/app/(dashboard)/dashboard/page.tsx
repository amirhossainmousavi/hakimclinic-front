"use client";

import { PageHeader } from "@/components/design-system/PageHeader";
import { useAuth } from "@/features/auth/context";
import { ManagerDashboard } from "@/features/dashboard/components/ManagerDashboard";
import { SecretaryDashboard } from "@/features/dashboard/components/SecretaryDashboard";
import { ManagerDashboardSkeleton } from "@/features/dashboard/components/DashboardSkeleton";
import { SecretaryDashboardSkeleton } from "@/features/dashboard/components/DashboardSkeleton";

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();

  const isManager = user?.role === "manager";

  return (
    <div className="space-y-6">
      <PageHeader
        title={isManager ? "داشبورد مدیریت" : "داشبورد منشی"}
        description={
          isManager
            ? "خلاصه عملکرد امروز کلینیک"
            : "نمای کلی پذیرش و نوبت‌های شما"
        }
        breadcrumb={["پنل مدیریت", "داشبورد"]}
      />

      {authLoading ? (
        isManager ? (
          <ManagerDashboardSkeleton />
        ) : (
          <SecretaryDashboardSkeleton />
        )
      ) : isManager ? (
        <ManagerDashboard />
      ) : (
        <SecretaryDashboard />
      )}
    </div>
  );
}
