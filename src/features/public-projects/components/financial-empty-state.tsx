import type { LucideIcon } from 'lucide-react';

type FinancialEmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export function FinancialEmptyState({ icon: Icon, title, description }: FinancialEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center bg-card border border-border rounded-lg shadow-finance">
      <div className="p-3 bg-muted rounded-full mb-3 text-muted-foreground">
        <Icon className="size-8 stroke-[1.5]" />
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="text-xs text-muted-foreground mt-1 max-w-sm leading-relaxed">{description}</p>
    </div>
  );
}
