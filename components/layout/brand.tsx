import { cn } from "@/lib/utils";

/**
 * The Cashflow mark: money read as a rhythm — a stroke that rises above and
 * falls below a baseline. The same gesture the dashboard chart uses.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("size-8", className)}
      role="img"
      aria-label="Cashflow"
    >
      <rect width="32" height="32" rx="9" className="fill-primary" />
      <path
        d="M6 20.5c3.2 0 3.2-9 6.4-9s3.2 9 6.4 9 3.2-9 6.4-9"
        fill="none"
        stroke="var(--primary-foreground)"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
      <circle cx="16" cy="16" r="1.6" fill="var(--primary-foreground)" />
    </svg>
  );
}

export function BrandLockup({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <BrandMark className="size-8 shrink-0" />
      <span className="display text-2xl leading-none tracking-tight">
        Cashflow
      </span>
    </span>
  );
}
