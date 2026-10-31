import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded bg-surface-raised/70", className)}
      {...props}
    />
  );
}

export function MetricCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col justify-between p-3 md:p-4 overflow-hidden", className)}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-2 w-8" />
      </div>
      <div className="my-1">
        <Skeleton className="h-8 md:h-10 w-28" />
      </div>
      <div className="mt-2">
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}
