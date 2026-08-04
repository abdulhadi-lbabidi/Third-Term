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
          'inline-flex size-4 items-center justify-center rounded border border-input bg-white text-primary transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25',
          checked ? 'border-primary bg-primary text-primary-foreground' : 'hover:border-primary',
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
