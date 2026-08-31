import { PageHeaderSkeleton } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function ReportsLoading() {
  return (
    <>
      <PageHeaderSkeleton />
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Skeleton className="h-3 w-28" />
            <Skeleton className="mt-2 h-8 w-52" />
            <Skeleton className="mt-3 h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="mt-6 grid gap-4 border-t border-border pt-6 sm:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index}>
              <Skeleton className="h-3 w-20" />
              <Skeleton className="mt-2 h-6 w-32" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
