import type { LucideIcon } from 'lucide-react';

type FinancialEmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export function FinancialEmptyState({ icon: Icon, title, description }: FinancialEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center bg-white border border-[#E7E9EF] rounded-xl">
      <div className="p-3 bg-slate-50 rounded-full mb-3 text-slate-400">
        <Icon className="size-8 stroke-[1.5]" />
      </div>
      <h3 className="text-sm font-semibold text-[#172033]">{title}</h3>
      <p className="text-xs text-[#667085] mt-1 max-w-sm leading-relaxed">{description}</p>
    </div>
  );
}
