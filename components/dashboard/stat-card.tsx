import { formatMoney } from "@/lib/domain/money";
import { cn } from "@/lib/utils";

/**
 * The four headline figures. These are the one place the display serif carries
 * a number: large, light, and never in a column where it would need to align.
 * Every other figure in the product is Plus Jakarta Sans with tabular digits.
 */
export function StatCard({
  label,
  value,
  caption,
  tone = "neutral",
  icon,
}: {
  label: string;
  value: number | string;
  caption?: string;
  tone?: "neutral" | "income" | "expense" | "critical";
  icon?: React.ReactNode;
}) {
  const text = typeof value === "number" ? formatMoney(value) : value;

  return (
    <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="eyebrow">{label}</p>
        {icon ? (
          <span className="shrink-0 text-muted-foreground">{icon}</span>
        ) : null}
      </div>

      <p
        className={cn(
          "display mt-4 text-[2.125rem] leading-none",
          tone === "income" && "text-income",
          tone === "expense" && "text-expense",
          tone === "critical" && "text-destructive",
        )}
      >
        {text}
      </p>

      {caption ? (
        <p className="mt-2 text-xs text-muted-foreground">{caption}</p>
      ) : null}
    </div>
  );
}
