"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  addMonths,
  currentMonthKey,
  formatMonthLabel,
  parseMonthKey,
} from "@/lib/domain/date";
import { cn } from "@/lib/utils";

/**
 * Month navigation, kept in the URL so a period can be linked and shared and
 * survives a refresh. Forward is disabled past the current month: there is no
 * data ahead, and an empty screen reads as a bug.
 */
export function MonthPicker({
  month,
  paramName = "mes",
  className,
}: {
  month: string;
  paramName?: string;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, start] = useTransition();

  const parts = parseMonthKey(month);
  const atCurrent = month >= currentMonthKey();

  function go(delta: number) {
    const next = addMonths(month, delta);
    if (!next) return;

    const params = new URLSearchParams(searchParams);
    params.set(paramName, next);
    // A new period means a new first page.
    params.delete("pagina");

    start(() => router.push(`${pathname}?${params}`, { scroll: false }));
  }

  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-lg border border-border bg-card p-1",
        pending && "opacity-70",
        className,
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8"
        onClick={() => go(-1)}
        aria-label="Mês anterior"
      >
        <ChevronLeft className="size-4" aria-hidden />
      </Button>

      <span
        aria-live="polite"
        className="min-w-[9.5rem] text-center text-sm font-medium"
      >
        {parts ? formatMonthLabel(month) : month}
      </span>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8"
        onClick={() => go(1)}
        disabled={atCurrent}
        aria-label="Próximo mês"
      >
        <ChevronRight className="size-4" aria-hidden />
      </Button>
    </div>
  );
}
