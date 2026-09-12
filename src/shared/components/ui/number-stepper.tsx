import { useState, useEffect, type ChangeEvent } from 'react';
import { Minus, Plus } from 'lucide-react';
import { Button } from './button';
import { Input } from './input';

function formatNumberWithCommas(value: unknown): string {
  if (value === undefined || value === null || value === '' || Number.isNaN(value)) return '';
  const parts = String(value).replace(/,/g, '').split('.');
  const integer = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.length > 1 ? `${integer}.${parts[1]}` : integer;
}

type NumberStepperProps = {
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  disabled?: boolean;
};

export function NumberStepper({ value, onChange, step = 1, min = 0, disabled }: NumberStepperProps) {
  const normalizedValue = Number.isFinite(value) ? Math.max(min, value) : min;
  const [inputValue, setInputValue] = useState(() => formatNumberWithCommas(normalizedValue));
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setInputValue(formatNumberWithCommas(normalizedValue));
    }
  }, [normalizedValue, isFocused]);

  const update = (nextValue: number) => {
    const clamped = Math.max(min, Number(nextValue.toFixed(2)));
    setInputValue(formatNumberWithCommas(clamped));
    onChange(clamped);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value.replace(/,/g, '');
    if (/^\d*\.?\d*$/.test(raw)) {
      if (raw === '' || raw === '.') {
        setInputValue(raw);
        onChange(min);
        return;
      }
      const [integer, decimal] = raw.split('.');
      const formattedInteger = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      const formatted = decimal !== undefined ? `${formattedInteger}.${decimal}` : formattedInteger;
      setInputValue(formatted);
      const num = Number(raw);
      if (!Number.isNaN(num)) {
        onChange(Math.max(min, num));
      }
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    setInputValue(formatNumberWithCommas(normalizedValue));
  };

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
        type="text"
        inputMode="decimal"
        value={inputValue}
        disabled={disabled}
        onFocus={(event) => {
          setIsFocused(true);
          event.currentTarget.select();
        }}
        onBlur={handleBlur}
        onChange={handleChange}
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
