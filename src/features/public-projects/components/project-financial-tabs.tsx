import { LayoutGrid, TrendingUp, TrendingDown, FileText, ArrowLeftRight } from 'lucide-react';

type TabId = 'overview' | 'revenues' | 'expenses' | 'invoices' | 'transfers';

type ProjectFinancialTabsProps = {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  counts: {
    revenues: number;
    expenses: number;
    invoices: number;
    transfers: number;
  };
};

export function ProjectFinancialTabs({ activeTab, onTabChange, counts }: ProjectFinancialTabsProps) {
  const tabs = [
    { id: 'overview' as const, label: 'نظرة عامة', icon: LayoutGrid, count: null, activeClass: 'text-[#17182F] border-[#C9A84C] bg-[#17182F]/5' },
    { id: 'revenues' as const, label: 'الإيرادات', icon: TrendingUp, count: counts.revenues, activeClass: 'text-emerald-700 border-emerald-500 bg-emerald-50/20' },
    { id: 'expenses' as const, label: 'المصروفات', icon: TrendingDown, count: counts.expenses, activeClass: 'text-rose-700 border-rose-500 bg-rose-50/20' },
    { id: 'invoices' as const, label: 'الفواتير', icon: FileText, count: counts.invoices, activeClass: 'text-blue-700 border-blue-500 bg-blue-50/20' },
    { id: 'transfers' as const, label: 'التحويلات', icon: ArrowLeftRight, count: counts.transfers, activeClass: 'text-amber-700 border-amber-500 bg-amber-50/20' },
  ];

  return (
    <div className="bg-white border border-[#E7E9EF] rounded-xl overflow-hidden shadow-xs">
      <div className="flex border-b border-slate-100 bg-slate-50/50 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-4 px-3 text-xs font-bold border-b-2 transition-all select-none ${isActive
                ? `border-b-2 ${tab.activeClass}`
                : 'border-transparent text-[#667085] hover:text-[#172033] hover:bg-slate-50/30'
                }`}
            >
              <tab.icon className="size-4 shrink-0" />
              <span className="whitespace-nowrap">{tab.label}</span>
              {tab.count !== null && (
                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold border ${isActive ? 'bg-white border-current' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
