import { Skeleton } from '@/shared/components/ui/skeleton';

export function ProjectDetailsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-8 w-24" />
      </div>

      <div className="bg-card border border-border rounded-lg p-6 space-y-4 shadow-finance">
        <Skeleton className="h-6 w-1/3" />
        <div className="grid grid-cols-3 gap-4 pt-4">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-card border border-border rounded-lg p-4 h-20 flex flex-col justify-between shadow-finance">
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <div className="bg-card border border-border rounded-lg p-5 h-44 shadow-finance" />
        <Skeleton className="h-10 w-full" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card border border-border rounded-lg p-4 h-12 shadow-finance" />
          ))}
        </div>
      </div>
    </div>
  );
}
