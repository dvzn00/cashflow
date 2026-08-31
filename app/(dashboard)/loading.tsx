import {
  ChartSkeleton,
  PageHeaderSkeleton,
  StatCardsSkeleton,
} from "@/components/skeletons";

export default function DashboardLoading() {
  return (
    <>
      <PageHeaderSkeleton />
      <div className="grid gap-5">
        <StatCardsSkeleton />
        <ChartSkeleton height={220} />
        <div className="grid gap-5 lg:grid-cols-2">
          <ChartSkeleton height={176} />
          <ChartSkeleton height={176} />
        </div>
        <ChartSkeleton height={240} />
      </div>
    </>
  );
}
