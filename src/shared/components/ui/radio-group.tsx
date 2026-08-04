import * as React from 'react';
import { Circle } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

type RadioGroupContextValue = {
  value?: string;
  onValueChange: (value: string) => void;
};

const RadioGroupContext = React.createContext<RadioGroupContextValue | null>(null);

type RadioGroupProps = React.HTMLAttributes<HTMLDivElement> & {
  value?: string;
  onValueChange: (value: string) => void;
};

function RadioGroup({ value, onValueChange, className, ...props }: RadioGroupProps) {
  return (
    <RadioGroupContext.Provider value={{ value, onValueChange }}>
      <div role="radiogroup" className={cn('grid gap-2', className)} {...props} />
    </RadioGroupContext.Provider>
  );
}

type RadioGroupItemProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  value: string;
};

const RadioGroupItem = React.forwardRef<HTMLButtonElement, RadioGroupItemProps>(
  ({ value, className, children, ...props }, ref) => {
    const context = React.useContext(RadioGroupContext);
    if (!context) return null;
    const checked = context.value === value;

    return (
      <button
        ref={ref}
        type="button"
        role="radio"
        aria-checked={checked}
        onClick={() => context.onValueChange(value)}
        className={cn(
          'flex items-center gap-2 rounded-lg border border-input bg-white px-4 py-3 text-sm text-slate-700 transition-colors hover:border-primary focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25',
          checked && 'border-primary bg-primary/5 text-primary',
          className
        )}
        {...props}
      >
        <span className="inline-flex size-4 items-center justify-center rounded-full border border-current">
          {checked ? <Circle className="size-2 fill-current" /> : null}
        </span>
        <span>{children}</span>
      </button>
    );
  }
);

RadioGroupItem.displayName = 'RadioGroupItem';

export { RadioGroup, RadioGroupItem };
