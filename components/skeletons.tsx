import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Skeletons mirror the real layout — same card shapes, same column widths, same
 * heights. A generic grey block tells you something is loading; a matching one
 * also tells you what is about to appear, and nothing jumps when it does.
 */

export function PageHeaderSkeleton({ withActions = true }: { withActions?: boolean }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-3 h-9 w-56" />
        <Skeleton className="mt-3 h-4 w-72" />
      </div>
      {withActions ? (
        <div className="flex gap-2">
          <Skeleton className="h-10 w-[13rem]" />
          <Skeleton className="h-10 w-40" />
        </div>
      ) : null}
    </div>
  );
}

export function StatCardsSkeleton() {
  return (
    <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }, (_, index) => (
        <div
          key={index}
          className="rounded-xl border border-border bg-card p-5"
        >
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-5 h-8 w-36" />
          <Skeleton className="mt-3 h-3 w-28" />
        </div>
      ))}
    </section>
  );
}

export function ChartSkeleton({
  height = 220,
  className,
}: {
  height?: number;
  className?: string;
}) {
  return (
    <section
      className={cn("rounded-xl border border-border bg-card p-5", className)}
    >
      <Skeleton className="h-3 w-20" />
      <Skeleton className="mt-2 h-5 w-44" />
      <Skeleton className="mt-2 h-3 w-64" />
      <Skeleton className="mt-5" style={{ height }} />
    </section>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center gap-4 border-b border-border px-4 py-3">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 flex-1" />
        <Skeleton className="h-3 w-20" />
      </div>
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center gap-4 px-4 py-4">
          <Skeleton className="h-4 w-[5.5rem]" />
          <span className="flex w-[11rem] items-center gap-2.5">
            <Skeleton className="size-7 rounded-full" />
            <Skeleton className="h-4 flex-1" />
          </span>
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <ul className="divide-y divide-border">
      {Array.from({ length: rows }, (_, index) => (
        <li key={index} className="flex items-center gap-3 py-3">
          <Skeleton className="size-9 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-1.5 h-3 w-24" />
          </div>
          <Skeleton className="h-8 w-8" />
        </li>
      ))}
    </ul>
  );
}

export function SectionSkeleton({
  children,
}: {
  children?: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="mt-2 h-5 w-40" />
      <Skeleton className="mt-2 h-3 w-72" />
      <div className="mt-5">{children}</div>
    </section>
  );
}
