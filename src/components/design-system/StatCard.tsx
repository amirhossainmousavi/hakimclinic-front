import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  hint?: string;
  tone?: "blue" | "green" | "amber" | "indigo" | "red";
}

const TONES: Record<NonNullable<StatCardProps["tone"]>, string> = {
  blue: "bg-primary/10 text-primary",
  green: "bg-success/10 text-success",
  amber: "bg-warning/15 text-warning",
  indigo: "bg-indigo-500/10 text-indigo-600",
  red: "bg-destructive/10 text-destructive",
};

export function StatCard({ label, value, icon: Icon, hint, tone = "blue" }: StatCardProps) {
  return (
    <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-glow hover:-translate-y-0.5">
      <div className="absolute inset-x-0 top-0 h-0.5 gradient-primary opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <CardContent className="flex items-start justify-between p-5">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold tracking-tight tabular-nums">{value}</p>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110",
            TONES[tone]
          )}
        >
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  );
}
