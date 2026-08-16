"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  FileText,
  ShieldCheck,
  Wrench,
  Tags,
  BarChart3,
  Wallet,
  UserCog,
  Bell,
  Menu,
  X,
  Stethoscope,
  LogOut,
  Building2,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/features/auth/context";
import { hasPermission } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/roles";
import type { Role, SecretaryPermissionKey } from "@/lib/types";

const NAV_ITEMS: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles?: Role[];
  permission?: SecretaryPermissionKey;
}[] = [
  { href: "/dashboard", label: "داشبورد", icon: LayoutDashboard, permission: "dashboard" },
  { href: "/patients", label: "بیماران", icon: Users, permission: "patients" },
  { href: "/appointments", label: "نوبت‌دهی", icon: CalendarDays, permission: "appointments" },
  { href: "/invoices", label: "فاکتور", icon: FileText, permission: "invoices" },
  { href: "/insurances", label: "بیمه‌ها", icon: ShieldCheck, roles: ["manager"] },
  { href: "/admission-places", label: "محل پذیرش", icon: Building2, roles: ["manager"] },
  { href: "/services", label: "خدمات", icon: Wrench, roles: ["manager"] },
  { href: "/tariffs", label: "تعرفه‌ها", icon: Tags, roles: ["manager"] },
  { href: "/reports/revenue", label: "گزارش درآمد", icon: BarChart3, roles: ["manager"] },
  { href: "/expenses", label: "هزینه‌ها", icon: Wallet, permission: "expenses" },
  { href: "/secretaries", label: "منشی‌ها", icon: UserCog, roles: ["manager"] },
  { href: "/notifications", label: "اطلاعیه‌ها", icon: Bell },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const items = NAV_ITEMS.filter((item) => {
    // Manager items — manager only
    if (item.roles) return !!user && item.roles.includes(user.role);
    // Secretary items — based on active permissions
    return hasPermission(item.permission, user?.role, user?.permissions);
  });

  return (
    <div className="flex h-full flex-col gap-1 overflow-y-auto p-4">
      <div className="mb-4 flex items-center gap-3 px-2">
        <div className="relative flex size-11 items-center justify-center overflow-hidden rounded-2xl gradient-primary shadow-glow">
          <Stethoscope className="size-5.5 text-white" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-bold">کلینیک ارتوپدی فنی</p>
          <p className="text-xs text-muted-foreground">حکیم</p>
        </div>
      </div>

      <Separator className="mb-3" />

      <nav className="flex flex-col gap-1">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                active
                  ? "bg-primary/10 font-semibold text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {active && (
                <span className="absolute inset-y-1.5 start-0 w-1 rounded-full gradient-primary" />
              )}
              <Icon
                className={cn(
                  "size-4.5 transition-transform duration-200 group-hover:scale-110",
                  active ? "text-primary" : ""
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto">
        <Separator className="mb-3" />
        <div className="flex items-center gap-3 rounded-xl bg-gradient-to-bl from-primary/5 to-transparent px-3 py-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 font-bold text-primary">
            {user?.sub?.charAt(0) ?? "م"}
          </div>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-xs font-semibold">کاربر پنل</p>
            <p className="text-[10px] text-muted-foreground">
              {user ? ROLE_LABELS[user.role] : ""}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { logout } = useAuth();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 start-0 z-30 hidden w-64 border-e bg-sidebar lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 start-0 w-72 border-e bg-sidebar shadow-2xl">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute end-3 top-3 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted"
            >
              <X className="size-5" />
            </button>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="lg:ps-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-xl">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="size-5" />
          </Button>
          <div className="ms-auto flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              title="اعلان‌ها"
              className="relative"
              onClick={() => router.push("/notifications")}
            >
              <Bell className="size-5" />
              <span className="absolute end-2.5 top-2.5 size-2 rounded-full bg-primary ring-2 ring-background" />
            </Button>
            <div className="flex items-center gap-2 rounded-xl border bg-card px-2.5 py-1.5 shadow-sm">
              <div className="flex size-8 items-center justify-center rounded-full gradient-primary text-sm font-semibold text-white">
                م
              </div>
              <Button variant="ghost" size="icon" className="size-8" title="خروج" onClick={logout}>
                <LogOut className="size-4.5" />
              </Button>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
