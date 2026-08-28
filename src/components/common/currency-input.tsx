"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

/**
 * Numeric input for KRW amounts. Kept as a thin, controlled wrapper so it can
 * be dropped straight into a react-hook-form <Controller render> (TRD §56).
 */
export function CurrencyInput({ className, ...props }: Omit<ComponentProps<typeof Input>, "type">) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
        ₩
      </span>
      <Input
        type="number"
        inputMode="decimal"
        step="1"
        min={0}
        className={cn("pl-7", className)}
        {...props}
      />
    </div>
  );
}
