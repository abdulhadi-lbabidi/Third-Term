import { Search } from 'lucide-react';

type ProjectsToolbarProps = {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  statusFilter: string;
  onStatusFilterChange: (val: string) => void;
  resultsCount: number;
};

export function ProjectsToolbar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  resultsCount,
}: ProjectsToolbarProps) {
  const filterTabs = [
    { id: 'all', label: 'الكل' },
    { id: 'pending', label: 'قيد الانتظار' },
    { id: 'in_progress', label: 'قيد التنفيذ' },
    { id: 'completed', label: 'مكتمل' },
  ];

  return (
    <div className="bg-white border border-[#E7E9EF] rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
      <div className="flex items-center justify-between w-full md:w-auto gap-4 shrink-0">
        <h2 className="text-base font-bold text-[#172033]">مشاريعك</h2>
        <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full">
          {resultsCount} مشروع
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto md:flex-1 md:justify-end">
        <div className="w-full sm:max-w-xs relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="ابحث باسم المشروع أو القسم..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg ps-9 pe-4 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#C9A84C] focus:border-[#C9A84C] transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onStatusFilterChange(tab.id)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 border ${statusFilter === tab.id
                  ? 'bg-[#17182F] text-[#C9A84C] border-[#17182F] shadow-sm'
                  : 'bg-white text-[#667085] border-slate-200 hover:bg-slate-50 hover:text-[#172033]'
                }`}
            >
              {statusFilter === tab.id && <span className="size-1.5 rounded-full bg-[#C9A84C]" />}
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
