import { PageHeaderSkeleton, TableSkeleton } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function TransactionsLoading() {
  return (
    <>
      <PageHeaderSkeleton withActions={false} />
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-11 w-[13rem]" />
          <Skeleton className="h-10 w-[11rem]" />
          <Skeleton className="h-10 w-[10.5rem]" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>
      <TableSkeleton />
    </>
  );
}
