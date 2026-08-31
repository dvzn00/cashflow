import { cn } from "@/lib/utils";

/**
 * Shared chrome for every chart block: eyebrow, title, an optional control on
 * the right, and the plot area. Keeping it in one place is what stops the four
 * dashboard charts from drifting into four different looks.
 */
export function ChartFrame({
  eyebrow,
  title,
  caption,
  action,
  legend,
  children,
  className,
  bodyClassName,
}: {
  eyebrow?: string;
  title: string;
  caption?: string;
  action?: React.ReactNode;
  legend?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={cn(
        "flex flex-col rounded-xl border border-border bg-card p-5",
        className,
      )}
    >
      <header className="mb-1 flex items-start justify-between gap-4">
        <div className="min-w-0">
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          <h2 className="mt-1 text-base font-semibold tracking-tight">{title}</h2>
          {caption ? (
            <p className="mt-1 text-xs text-muted-foreground">{caption}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </header>

      {legend ? <div className="mt-3">{legend}</div> : null}

      <div className={cn("mt-4 flex-1", bodyClassName)}>{children}</div>
    </section>
  );
}

/**
 * Legend for two or more series. Always present when a chart has more than one
 * series, so identity never rests on colour alone.
 */
export function ChartLegend({
  items,
  className,
}: {
  items: Array<{ label: string; color: string; shape?: "bar" | "line" }>;
  className?: string;
}) {
  return (
    <ul className={cn("flex flex-wrap items-center gap-x-4 gap-y-1.5", className)}>
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span
            aria-hidden
            className={cn(
              "shrink-0 rounded-full",
              item.shape === "line" ? "h-[2px] w-3.5" : "size-2.5",
            )}
            style={{ backgroundColor: item.color }}
          />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

/** Tooltip surface shared by every chart, so hover feels like one product. */
export function TooltipCard({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ label: string; value: string; color?: string }>;
}) {
  return (
    <div className="pointer-events-none rounded-lg border border-border bg-popover px-3 py-2 shadow-lg">
      <p className="mb-1.5 text-xs font-medium text-popover-foreground">{title}</p>
      <ul className="grid gap-1">
        {rows.map((row) => (
          <li
            key={row.label}
            className="flex items-center gap-2 text-xs text-muted-foreground"
          >
            {row.color ? (
              <span
                aria-hidden
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: row.color }}
              />
            ) : null}
            <span className="flex-1">{row.label}</span>
            <span className="tabular font-medium text-popover-foreground">
              {row.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
