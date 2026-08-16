"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Loader2, Search } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useServicesList } from "@/features/services/hooks";
import type { Service } from "@/features/services/types";

interface ServiceSearchComboboxProps {
  value: string;
  onChange: (service: Service) => void;
  placeholder?: string;
}

export function ServiceSearchCombobox({
  value,
  onChange,
  placeholder = "جستجوی خدمت…",
}: ServiceSearchComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 500);
    return () => clearTimeout(t);
  }, [query]);

  const { data, isLoading, isFetching } = useServicesList({
    search: debounced || undefined,
    limit: 100,
  });

  // مقدار می‌تواند id یا نام خدمت باشد؛ نام‌های ذخیره‌شده ممکن است کوتاه‌تر از نام واقعی باشند
  const selected = data
    ? data.items.find((s) => s.id === value) ??
      data.items.find((s) => s.treatmentProcess === value) ??
      data.items.find((s) => !!value && s.treatmentProcess.includes(value)) ??
      null
    : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "flex min-h-10 w-full items-center justify-between gap-2 rounded-xl border border-input bg-card px-3.5 py-2 text-sm shadow-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary/60",
            !selected && "text-muted-foreground/70"
          )}
        >
          <span className="min-w-0 break-words leading-snug">
            {selected
              ? `${selected.serviceCode} — ${selected.treatmentProcess} (${selected.price.toLocaleString("en-US")} تومان)`
              : placeholder}
          </span>
          <ChevronDown className="size-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0">
        <div className="border-b p-2">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="کد یا نام خدمت… (مثلاً ORT یا کف طبی)"
              className="pr-10"
            />
          </div>
        </div>
        <div className="max-h-64 overflow-y-auto p-1">
          {isLoading || isFetching ? (
            <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              در حال جستجو…
            </div>
          ) : data && data.items.length > 0 ? (
            data.items.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  onChange(s);
                  setQuery("");
                  setDebounced("");
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-right text-sm transition-colors hover:bg-accent",
                  value === s.id && "bg-accent/60"
                )}
              >
                <span className="min-w-0 break-words leading-snug">
                  <span className="font-medium">{s.serviceCode}</span>
                  <span className="text-muted-foreground"> — {s.treatmentProcess}</span>
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {s.price.toLocaleString("en-US")} تومان
                </span>
              </button>
            ))
          ) : (
            <div className="px-2 py-4 text-center text-sm text-muted-foreground">
              خدمتی یافت نشد
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
