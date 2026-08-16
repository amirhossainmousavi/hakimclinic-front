import { Skeleton } from "@/components/ui/skeleton";

export function AppointmentCalendarSkeleton() {
  return (
    <div className="space-y-4">
      {/* Calendar header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-40" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="size-9" />
          <Skeleton className="size-9" />
        </div>
      </div>
      {/* Desktop grid */}
      <div className="hidden overflow-hidden rounded-2xl border bg-card md:block">
        <div className="grid grid-cols-7 gap-px bg-border">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex justify-center bg-muted/40 py-2">
              <Skeleton className="h-4 w-4" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-px bg-border">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="flex h-28 flex-col gap-2 bg-card p-2">
              <Skeleton className="ms-auto h-4 w-6" />
              <Skeleton className="h-5 rounded-full" />
              <Skeleton className="h-5 rounded-full" />
            </div>
          ))}
        </div>
      </div>
      {/* Mobile list */}
      <div className="space-y-3 md:hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-2xl border bg-card p-4">
            <Skeleton className="h-4 w-28" />
            <div className="mt-2 space-y-2">
              <Skeleton className="h-5 rounded-full" />
              <Skeleton className="h-5 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
