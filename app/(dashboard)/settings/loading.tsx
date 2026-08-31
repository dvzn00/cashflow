import {
  ListSkeleton,
  PageHeaderSkeleton,
  SectionSkeleton,
} from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <>
      <PageHeaderSkeleton withActions={false} />
      <div className="grid gap-5">
        <SectionSkeleton>
          <ListSkeleton rows={3} />
        </SectionSkeleton>
        <SectionSkeleton>
          <ListSkeleton rows={3} />
        </SectionSkeleton>
        <SectionSkeleton>
          <div className="grid max-w-sm gap-4">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-10 w-32" />
          </div>
        </SectionSkeleton>
      </div>
    </>
  );
}
