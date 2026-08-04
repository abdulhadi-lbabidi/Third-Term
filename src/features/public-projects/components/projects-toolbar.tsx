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
    <div className="bg-card border border-border rounded-lg p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-finance">
      <div className="flex items-center justify-between w-full md:w-auto gap-4 shrink-0">
        <h2 className="text-base font-semibold text-foreground">مشاريعك</h2>
        <span className="bg-secondary text-secondary-foreground text-xs font-semibold px-2 py-0.5 rounded-md">
          {resultsCount} مشروع
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto md:flex-1 md:justify-end">
        <div className="w-full sm:max-w-xs relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="ابحث باسم المشروع أو القسم..."
            className="w-full bg-card border border-input rounded-md ps-9 pe-4 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/25 focus:border-ring transition-all"
          />
        </div>

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
              {statusFilter === tab.id && <span className="size-1.5 rounded-full bg-accent-gold" />}
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
