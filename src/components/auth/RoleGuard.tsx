"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/context";
import { hasPermission, hasRole } from "@/lib/auth";
import { ErrorState } from "@/components/design-system/ErrorState";
import type { Role, SecretaryPermissionKey } from "@/lib/types";

export function RoleGuard({
  allowed,
  permission,
  children,
}: {
  allowed?: Role[];
  permission?: SecretaryPermissionKey;
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const router = useRouter();

  const granted =
    !!user && hasRole(allowed, user.role) && hasPermission(permission, user.role, user.permissions);

  useEffect(() => {
    if (user && !granted) {
      router.replace("/dashboard");
    }
  }, [user, granted, router]);

  if (!user || !granted) {
    return null;
  }

  return <>{children}</>;
}

export function PermissionError() {
  return (
    <ErrorState
      title="دسترسی لازم را ندارید"
      message="مدیر کلینیک برای شما به این بخش دسترسی نداده است."
    />
  );
}
