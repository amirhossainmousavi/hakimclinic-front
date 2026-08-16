"use client";

import { useEffect, useMemo, useState } from "react";
import { Calendar as CalendarIcon, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn, toEnglishDigits } from "@/lib/utils";
import {
  toJalali,
  toGregorian,
  getJalaliMonthLength,
  getJalaliWeekday,
  formatJalaliMonthYear,
  shiftMonth,
  toJalaliString,
  WEEKDAY_LABELS_FA,
} from "@/lib/jalali";

interface JalaliDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  className?: string;
  disabled?: boolean;
}

/** Validates the typed Jalali text and converts it to ISO; null if invalid */
function parseTypedDate(raw: string): string | null {
  const normalized = toEnglishDigits(raw.trim()).replace(/[ـ]/g, "");
  if (normalized === "") return "";
  const m = normalized.match(/^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})$/);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (year < 1300 || year > 1500 || month < 1 || month > 12 || day < 1) return null;
  if (day > getJalaliMonthLength(year, month - 1)) return null;
  return toGregorian({ year, month: month - 1, day }).toISOString().slice(0, 10);
}

export function JalaliDatePicker({
  value,
  onChange,
  placeholder = "انتخاب تاریخ",
  id,
  className,
  disabled,
}: JalaliDatePickerProps) {
  const today = useMemo(() => toJalali(new Date()), []);
  const selected = value ? toJalali(new Date(value)) : null;

  const [text, setText] = useState(
    value ? toJalaliString(new Date(value)) : ""
  );
  const [viewYear, setViewYear] = useState(today.year);
  const [viewMonth, setViewMonth] = useState(today.month);
  const [open, setOpen] = useState(false);

  // Sync the displayed text with external value changes (calendar pick or form reset)
  useEffect(() => {
    setText(value ? toJalaliString(new Date(value)) : "");
  }, [value]);

  const handleOpenChange = (o: boolean) => {
    setOpen(o);
    if (o) {
      const target = selected ?? today;
      setViewYear(target.year);
      setViewMonth(target.month);
    }
  };

  const handleTextChange = (raw: string) => {
    setText(raw);
    const parsed = parseTypedDate(raw);
    if (parsed === null) return; // incomplete/invalid — do not fire onChange
    onChange(parsed);
  };

  const monthLength = getJalaliMonthLength(viewYear, viewMonth);
  const firstWeekday = getJalaliWeekday(
    toGregorian({ year: viewYear, month: viewMonth, day: 1 })
  );
  const cells: number[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(0);
  for (let d = 1; d <= monthLength; d++) cells.push(d);

  const prevMonth = () => {
    const s = shiftMonth(viewYear, viewMonth, -1);
    setViewYear(s.year);
    setViewMonth(s.month);
  };

  const nextMonth = () => {
    const s = shiftMonth(viewYear, viewMonth, 1);
    setViewYear(s.year);
    setViewMonth(s.month);
  };

  const pick = (day: number) => {
    const iso = toGregorian({ year: viewYear, month: viewMonth, day })
      .toISOString()
      .slice(0, 10);
    onChange(iso);
    setOpen(false);
  };

  const pickToday = () => {
    onChange(toGregorian(today).toISOString().slice(0, 10));
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <div
          className={cn(
            "flex h-10 w-full items-center rounded-xl border border-input bg-background px-3.5 shadow-sm transition-all duration-200",
            "focus-within:outline-none focus-within:ring-1 focus-within:ring-ring",
            disabled && "cursor-not-allowed opacity-50",
            className
          )}
        >
          <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
          <input
            id={id}
            type="text"
            inputMode="numeric"
            dir="rtl"
            disabled={disabled}
            placeholder={placeholder}
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
            className="h-full min-w-0 flex-1 bg-transparent px-2 text-sm text-foreground outline-none placeholder:text-muted-foreground/70 disabled:cursor-not-allowed"
          />
          <ChevronDown className="size-4 shrink-0 opacity-50" />
        </div>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-3">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={prevMonth}
            >
              <ChevronRight className="size-4" />
            </Button>
            <span className="text-sm font-semibold">
              {formatJalaliMonthYear(viewYear, viewMonth)}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={nextMonth}
            >
              <ChevronLeft className="size-4" />
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {WEEKDAY_LABELS_FA.map((w) => (
              <div
                key={w}
                className="flex size-8 items-center justify-center text-xs font-medium text-muted-foreground"
              >
                {w}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (day === 0) return <div key={`empty-${i}`} className="size-8" />;
              const isToday =
                day === today.day && viewMonth === today.month && viewYear === today.year;
              const isSelected =
                !!selected &&
                day === selected.day &&
                viewMonth === selected.month &&
                viewYear === selected.year;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => pick(day)}
                  className={cn(
                    "flex size-8 items-center justify-center rounded-lg text-sm transition-colors",
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : isToday
                        ? "bg-primary/10 font-semibold text-primary hover:bg-primary/20"
                        : "hover:bg-accent"
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="border-t pt-2">
            <button
              type="button"
              onClick={pickToday}
              className="w-full rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
            >
              امروز: {toJalaliString(new Date())}
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
