export function ProjectDetailsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="h-4 bg-slate-200 rounded w-1/4" />
        <div className="h-8 bg-slate-200 rounded w-24" />
      </div>

      <div className="bg-white border border-[#E7E9EF] rounded-xl p-6 space-y-4">
        <div className="h-6 bg-slate-200 rounded w-1/3" />
        <div className="grid grid-cols-3 gap-4 pt-4">
          <div className="h-4 bg-slate-200 rounded w-1/2" />
          <div className="h-4 bg-slate-200 rounded w-1/2" />
          <div className="h-4 bg-slate-200 rounded w-1/2" />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-white border border-[#E7E9EF] rounded-xl p-4 h-20 flex flex-col justify-between">
            <div className="h-3 bg-slate-200 rounded w-3/4" />
            <div className="h-4 bg-slate-200 rounded w-1/2" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6">
        <div className="space-y-3">
          <div className="bg-white border border-[#E7E9EF] rounded-xl p-5 h-44" />
          <div className="h-10 bg-slate-200 rounded w-full" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-[#E7E9EF] rounded-xl p-4 h-12" />
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="bg-white border border-[#E7E9EF] rounded-xl p-5 h-56" />
        </div>
      </div>
    </div>
  );
}
