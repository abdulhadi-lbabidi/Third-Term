import { TrendingUp, TrendingDown, FileText, ArrowLeftRight } from 'lucide-react';

type TabId = 'revenues' | 'expenses' | 'invoices' | 'transfers';

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
    { id: 'revenues' as const, label: 'الإيرادات', icon: TrendingUp, count: counts.revenues },
    { id: 'expenses' as const, label: 'المصروفات', icon: TrendingDown, count: counts.expenses },
    { id: 'invoices' as const, label: 'الفواتير', icon: FileText, count: counts.invoices },
    { id: 'transfers' as const, label: 'التحويلات', icon: ArrowLeftRight, count: counts.transfers },
  ];

  return (
    <div className="bg-card border w-full sm:w-fit border-border rounded-lg overflow-hidden shadow-finance">
      <div className="flex border-b border-border bg-card overflow-x-auto scrollbar-none">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
             <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`relative flex items-center justify-center gap-1.5 py-2.5 px-3 text-[10px] sm:text-xs font-semibold transition-all select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 ${
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon className="size-3.5 shrink-0" />
              <span className="whitespace-nowrap">{tab.label}</span>
              {/* {tab.count !== null && (
                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold border ${
                  isActive
                    ? 'bg-primary/10 border-primary/20 text-primary'
                    : 'bg-muted border-border text-muted-foreground'
                }`}>
                  {tab.count}
                </span>
              )} */}
              <span
                className={`absolute inset-x-2.5 bottom-0 h-0.5 rounded-full transition-colors ${
                  isActive ? 'bg-primary' : 'bg-transparent'
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
