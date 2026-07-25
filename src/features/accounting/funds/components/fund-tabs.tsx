import { cn } from '@/shared/lib/utils';
import { useTranslation } from 'react-i18next';

export type FundTabType = 'personal' | 'company' | 'projects';

interface FundTabsProps {
  activeTab: FundTabType;
  onChange: (tab: FundTabType) => void;
}

export function FundTabs({ activeTab, onChange }: FundTabsProps) {
  const { t } = useTranslation();
  
  const tabs = [
    { id: 'personal', label: t('funds.tabs.personal', 'Personal Funds') },
    { id: 'company', label: t('funds.tabs.company', 'Company Funds') },
    { id: 'projects', label: t('funds.tabs.projects', 'Project Funds') },
  ] as const;

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id as FundTabType)}
            className={cn(
              'rounded-xl px-5 py-2.5 text-sm font-medium transition-all duration-200',
              isActive
                ? 'bg-slate-950 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-slate-200/60'
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
