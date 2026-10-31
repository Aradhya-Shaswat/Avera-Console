import { Skeleton } from "@/components/ui/skeleton";

export default function DevicesLoading() {
  return (
    <div className="flex flex-col h-full overflow-hidden select-none">
      <div className="h-16 px-6 md:px-8 border-b border-border-subtle shrink-0 flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
      </div>

      <div className="flex-1 golden-ratio-grid overflow-hidden min-h-0">
        <div className="p-8 md:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-border-subtle overflow-hidden h-full">
          <div>
            <div className="flex items-center justify-between mb-6">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-5 w-24" />
            </div>

            <div className="my-4">
              <Skeleton className="h-12 w-64" />
            </div>

            <Skeleton className="h-4 w-40 mt-3" />
          </div>

          <div className="pt-6 border-t border-border-subtle">
            <Skeleton className="h-9 w-36" />
          </div>
        </div>

        <div className="p-8 md:p-10 flex flex-col justify-start overflow-hidden h-full">
          <div>
            <div className="flex items-center justify-between mb-6">
              <Skeleton className="h-3 w-36" />
            </div>

            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-border-subtle/50 last:border-0">
                  <Skeleton className="h-3.5 w-36" />
                  <Skeleton className="h-3.5 w-24" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

