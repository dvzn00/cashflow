export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? <p className="eyebrow mb-2">{eyebrow}</p> : null}
        <h1 className="display text-4xl leading-none sm:text-[2.75rem]">
          {title}
        </h1>
        {description ? (
          <p className="mt-3 max-w-prose text-sm text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {/* Wraps rather than shrinks: at 375px the month picker and the primary
          action do not fit on one line, and squeezing either one hurts more
          than a second row does. */}
      {actions ? (
        <div className="flex flex-wrap items-center gap-2 sm:shrink-0">{actions}</div>
      ) : null}
    </div>
  );
}

/** Placeholder used while a screen is still being built out. */
export function SectionPlaceholder({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card/40 p-8 text-sm text-muted-foreground">
      {children}
    </div>
  );
}
