import { Skeleton, MetricCardSkeleton } from "@/components/ui/skeleton";

export default function LabLoading() {
  return (
    <div className="flex flex-col h-full overflow-hidden select-none">
      <div className="h-16 px-6 md:px-8 border-b border-border-subtle shrink-0 flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-7 w-16" />
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        <div className="flex-1 p-6 border-b border-border-subtle flex flex-col justify-between overflow-hidden min-h-0">
          <div className="flex items-center justify-between mb-3 shrink-0">
            <Skeleton className="h-3 w-48" />
            <Skeleton className="h-3 w-24" />
          </div>
          <div className="relative flex-1 w-full border border-border-subtle overflow-hidden bg-surface-raised/20 min-h-[160px] flex items-center justify-center">
            <Skeleton className="h-3/4 w-11/12" />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-border-subtle border-b border-border-subtle shrink-0">
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
        </div>
      </div>
    </div>
  );
}

