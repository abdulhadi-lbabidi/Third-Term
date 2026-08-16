import { cn } from '@/shared/lib/utils';

type VoucherNumberHintProps = {
  value?: string | null;
  className?: string;
};

export function VoucherNumberHint({ value, className }: VoucherNumberHintProps) {
  if (!value) return null;

  return (
    <span
      className={cn(
        'finance-num absolute !top-[-27px] inline-flex rounded-md border border-dashed border-primary/25 bg-primary/5 px-2.5 py-1 text-xs font-semibold text-primary',
        className,
      )}
    >
      {value}
    </span>
  );
}
