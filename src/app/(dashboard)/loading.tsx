import { Skeleton, MetricCardSkeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col h-full overflow-hidden select-none">
      <div className="h-16 px-6 md:px-8 border-b border-border-subtle shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-36" />
        </div>
      </div>

      <div className="flex-1 grid grid-rows-2 overflow-hidden min-h-0">
        <div className="golden-ratio-grid border-b border-border-subtle overflow-hidden h-full">
          <div className="p-6 md:p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-border-subtle overflow-hidden">
            <div>
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="my-2">
                <Skeleton className="h-20 w-44" />
              </div>
              <div className="mt-3">
                <Skeleton className="h-3.5 w-52" />
              </div>
            </div>

            <div className="pt-4 border-t border-border-subtle/80 space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
            </div>
          </div>

          <div className="grid grid-cols-2 divide-x divide-y divide-border-subtle h-full overflow-hidden">
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border-subtle overflow-hidden h-full">
          <div className="p-6 md:p-8 flex flex-col justify-between overflow-hidden h-full">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <div className="flex-1 w-full min-h-0 flex items-end pb-4 pt-2">
              <Skeleton className="h-full w-full" />
            </div>
          </div>

          <div className="p-6 md:p-8 flex flex-col justify-between overflow-hidden h-full">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <Skeleton className="h-3 w-36" />
              <Skeleton className="h-3 w-20" />
            </div>
            <div className="flex-1 w-full min-h-0 flex items-end pb-4 pt-2">
              <Skeleton className="h-full w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

