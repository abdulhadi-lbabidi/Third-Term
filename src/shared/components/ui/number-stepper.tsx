import { Minus, Plus } from 'lucide-react';
import { Button } from './button';
import { Input } from './input';

type NumberStepperProps = {
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  disabled?: boolean;
};

export function NumberStepper({ value, onChange, step = 1, min = 0, disabled }: NumberStepperProps) {
  const normalizedValue = Number.isFinite(value) ? Math.max(min, value) : min;
  const update = (nextValue: number) => onChange(Math.max(min, Number(nextValue.toFixed(2))));

  return (
    <div className="flex h-11 items-center rounded-md bg-muted/50 p-1">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-9 shrink-0"
        disabled={disabled || normalizedValue <= min}
        onClick={() => update(normalizedValue - step)}
        aria-label="إنقاص"
      >
        <Minus className="size-4" />
      </Button>
      <Input
        type="number"
        min={min}
        step={step}
        value={normalizedValue}
        disabled={disabled}
        onChange={(event) => update(Number(event.target.value) || 0)}
        className="h-9 border-0 bg-transparent text-center font-semibold shadow-none focus-visible:ring-0"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-9 shrink-0"
        disabled={disabled}
        onClick={() => update(normalizedValue + step)}
        aria-label="زيادة"
      >
        <Plus className="size-4" />
      </Button>
    </div>
  );
}
