import { BadgeDollarSign } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';

type FundCurrencyEmptyStateProps = {
  onAddCurrency: () => void;
};

export function FundCurrencyEmptyState({ onAddCurrency }: FundCurrencyEmptyStateProps) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 px-5 py-10 text-center">
      <div className="mb-4 grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
        <BadgeDollarSign className="size-6" />
      </div>
      <h3 className="text-base font-semibold text-foreground">أضف عملة للبدء بإدارة الصندوق</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        يحتاج الصندوق إلى عملة واحدة على الأقل قبل تسجيل الإيرادات والمصروفات والفواتير والتحويلات.
      </p>
      <Button type="button" size="sm" className="mt-5" onClick={onAddCurrency}>
        <BadgeDollarSign className="size-4" />
        إضافة عملة للمشروع
      </Button>
    </div>
  );
}
