import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="flex flex-col h-full overflow-hidden select-none">
      <div className="h-16 px-6 md:px-8 border-b border-border-subtle shrink-0 flex items-center justify-between">
        <Skeleton className="h-8 w-28" />
      </div>

      <div className="flex-1 golden-ratio-grid overflow-hidden min-h-0">
        <div className="p-8 md:p-10 border-b lg:border-b-0 lg:border-r border-border-subtle flex flex-col justify-between overflow-hidden h-full">
          <div>
            <Skeleton className="h-3 w-28 mb-5" />

            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-3.5 rounded border border-border-subtle/40 space-y-1.5">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-2.5 w-36" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-8 md:p-10 flex flex-col justify-between overflow-hidden h-full">
          <div>
            <div className="border-b border-border-subtle pb-4 mb-6">
              <Skeleton className="h-4 w-36 mb-2" />
              <Skeleton className="h-3 w-48" />
            </div>

            <div className="space-y-5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-border-subtle/50 last:border-0">
                  <div className="space-y-1">
                    <Skeleton className="h-3.5 w-28" />
                    <Skeleton className="h-2.5 w-40" />
                  </div>
                  <Skeleton className="h-8 w-24" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

