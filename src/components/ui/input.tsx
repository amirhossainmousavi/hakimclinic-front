import * as React from "react";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface InputProps extends React.ComponentProps<"input"> {
  icon?: LucideIcon;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon: Icon, ...props }, ref) => {
    const base =
      "flex h-10 w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm shadow-sm transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary/60 disabled:cursor-not-allowed disabled:opacity-50";
    if (Icon) {
      const isLtr = props.dir === "ltr";
      return (
        <div className="relative">
          <Icon
            className={cn(
              "pointer-events-none absolute top-1/2 size-4 -translate-y-1/2 text-muted-foreground",
              isLtr ? "end-3" : "start-3"
            )}
          />
          <input
            type={type}
            dir={props.dir ?? "rtl"}
            className={cn(base, isLtr ? "pe-10" : "ps-10", className)}
            ref={ref}
            {...props}
          />
        </div>
      );
    }
    return (
      <input
        type={type}
        dir={props.dir ?? "rtl"}
        className={cn(base, className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
