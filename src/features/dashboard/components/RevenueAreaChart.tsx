"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatToman, toEnglishDigits } from "@/lib/utils";

interface RevenueAreaChartProps {
  data: { date: string; total: number }[];
}

/** X axis as a Jalali date — tick with the smallest possible width */
function formatJalali(dateStr: string): string {
  const d = new Date(`${toEnglishDigits(dateStr)}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  // Persian → English digits so Number does not misparse
  const fa = toEnglishDigits(d.toLocaleDateString("fa-IR"));
  // Only day/month — e.g. "12/3"
  const parts = fa.split("/");
  return parts.length >= 2 ? `${Number(parts[1])}/${Number(parts[2])}` : fa;
}

export function RevenueAreaChart({ data }: RevenueAreaChartProps) {
  if (data.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        در این بازه فاکتوری ثبت نشده است
      </p>
    );
  }

  return (
    <div dir="ltr" className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
          <defs>
            <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatJalali}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
            minTickGap={24}
          />
          <YAxis
            width={56}
            tickFormatter={(v: number) => formatToman(v)}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(value) => [`${formatToman(Number(value ?? 0))} تومان`, "درآمد"]}
            labelFormatter={(label) =>
              new Date(`${toEnglishDigits(String(label))}T00:00:00`).toLocaleDateString("fa-IR")
            }
            contentStyle={{
              borderRadius: 12,
              border: "1px solid var(--border)",
              background: "var(--card)",
              fontSize: 12,
            }}
          />
          <Area
            type="monotone"
            dataKey="total"
            stroke="var(--primary)"
            strokeWidth={2}
            fill="url(#revenueFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
