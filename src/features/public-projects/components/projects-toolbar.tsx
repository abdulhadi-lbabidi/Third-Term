import { Search, RotateCcw } from 'lucide-react';

type ProjectsToolbarProps = {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  onSearchSubmit: () => void;
  onReset: () => void;
  statusFilter: string;
  onStatusFilterChange: (val: string) => void;
  resultsCount: number;
  hideStatusButtons?: boolean;
};

export function ProjectsToolbar({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  onReset,
  statusFilter,
  onStatusFilterChange,
  resultsCount,
  hideStatusButtons,
}: ProjectsToolbarProps) {
  const filterTabs = [
    { id: 'all', label: 'الكل' },
    { id: 'pending', label: 'قيد الانتظار' },
    { id: 'in_progress', label: 'قيد التنفيذ' },
    { id: 'completed', label: 'مكتمل' },
  ];

  return (
    <div className="bg-card border border-border rounded-lg p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-finance">
      <div className="flex items-center justify-between w-full md:w-auto gap-4 shrink-0">
        <h2 className="text-base font-semibold text-foreground">مشاريعك</h2>
        <span className="bg-secondary text-secondary-foreground text-xs font-semibold px-2 py-0.5 rounded-md">
          {resultsCount} مشروع
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto md:flex-1 md:justify-end">
        <div className="w-full sm:max-w-xs relative">
          <button
            type="button"
            onClick={onSearchSubmit}
            className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground inline-flex items-center justify-center p-0 border-none bg-transparent cursor-pointer z-10"
          >
            <Search className="size-4" />
          </button>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onSearchSubmit();
              }
            }}
            placeholder="ابحث باسم المشروع أو القسم..."
            className="w-full bg-card border border-input rounded-md ps-9 pe-9 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/25 focus:border-ring transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={onReset}
              className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 inline-flex items-center justify-center p-0 border-none bg-transparent cursor-pointer z-10"
            >
              <RotateCcw className="size-3.5" />
            </button>
          )}
        </div>

        {!hideStatusButtons && (
          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {filterTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => onStatusFilterChange(tab.id)}
                className={`px-4 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                  statusFilter === tab.id
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
