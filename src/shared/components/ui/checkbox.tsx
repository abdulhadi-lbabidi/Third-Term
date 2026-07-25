import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

type CheckboxProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> & {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
};

export const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ className, checked = false, onCheckedChange, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        role="checkbox"
        aria-checked={checked}
        onClick={() => onCheckedChange?.(!checked)}
        className={cn(
          'inline-flex size-4 items-center justify-center rounded border border-slate-300 bg-white text-slate-950 transition-colors',
          checked ? 'border-slate-950 bg-slate-950 text-white' : 'hover:border-slate-400',
          className
        )}
        {...props}
      >
        {checked ? <Check className="size-3" /> : null}
      </button>
    );
  }
);

Checkbox.displayName = 'Checkbox';
