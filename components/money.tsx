import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/domain/money";
import type { TransactionType } from "@/types/database";

/**
 * A money figure. Always tabular, so columns of numbers line up on the decimal
 * — the body face carries figures, never the display serif.
 */
export function Money({
  value,
  className,
  signed = false,
  type,
}: {
  value: number;
  className?: string;
  /** Prefix an explicit + / − (uses the true minus sign, not a hyphen). */
  signed?: boolean;
  /** Colours the figure by direction. Omit for neutral ink. */
  type?: TransactionType;
}) {
  const text = formatMoney(Math.abs(value));
  const negative = type ? type === "expense" : value < 0;

  return (
    <span
      className={cn(
        "tabular",
        type === "income" && "text-income",
        type === "expense" && "text-expense",
        className,
      )}
    >
      {signed ? (negative ? "−" : "+") : negative && !type ? "−" : null}
      {text}
    </span>
  );
}
