import * as React from "react";
import { format, startOfDay, endOfDay, subDays } from "date-fns";
import { cn } from "@/shared/lib/utils";

type DateTimeRangeValue = {
  from?: Date;
  to?: Date;
};

type DateTimeRangePickerProps = {
  value?: DateTimeRangeValue;
  onChange?: (value: DateTimeRangeValue | undefined) => void;
  onBlur?: () => void;

  placeholder?: string;
  disabled?: boolean;
  error?: boolean;

  className?: string;
};

function parseDateTimeString(
  str: string,
  defaultHour: number = 0,
  defaultMinute: number = 0,
): Date | null {
  const standardized = str.replace(/\//g, "-").trim();

  const dateTimeMatch = standardized.match(
    /^(\d{1,2})-(\d{1,2})-(\d{4})\s+(\d{1,2}):(\d{1,2})$/,
  );
  if (dateTimeMatch) {
    const [_, dayStr, monthStr, yearStr, hourStr, minuteStr] = dateTimeMatch;
    const day = parseInt(dayStr, 10);
    const month = parseInt(monthStr, 10) - 1;
    const year = parseInt(yearStr, 10);
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);

    if (
      month >= 0 &&
      month <= 11 &&
      day >= 1 &&
      day <= 31 &&
      hour >= 0 &&
      hour <= 23 &&
      minute >= 0 &&
      minute <= 59
    ) {
      const date = new Date(year, month, day, hour, minute);
      if (
        !isNaN(date.getTime()) &&
        date.getDate() === day &&
        date.getMonth() === month &&
        date.getFullYear() === year
      ) {
        return date;
      }
    }
  }

  const dateMatch = standardized.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (dateMatch) {
    const [_, dayStr, monthStr, yearStr] = dateMatch;
    const day = parseInt(dayStr, 10);
    const month = parseInt(monthStr, 10) - 1;
    const year = parseInt(yearStr, 10);

    if (month >= 0 && month <= 11 && day >= 1 && day <= 31) {
      const date = new Date(year, month, day, defaultHour, defaultMinute);
      if (
        !isNaN(date.getTime()) &&
        date.getDate() === day &&
        date.getMonth() === month &&
        date.getFullYear() === year
      ) {
        return date;
      }
    }
  }

  return null;
}

function DateTimeRangePicker({
  value,
  onChange,
  onBlur,
  disabled = false,
  error = false,
  className,
}: DateTimeRangePickerProps) {
  const [fromInput, setFromInput] = React.useState("");
  const [toInput, setToInput] = React.useState("");

  React.useEffect(() => {
    if (value?.from) {
      setFromInput(format(value.from, "dd-MM-yyyy HH:mm"));
    } else {
      setFromInput("");
    }
  }, [value?.from]);

  React.useEffect(() => {
    if (value?.to) {
      setToInput(format(value.to, "dd-MM-yyyy HH:mm"));
    } else {
      setToInput("");
    }
  }, [value?.to]);

  React.useEffect(() => {
    if (onChange && (!value?.from || !value?.to)) {
      const now = new Date();
      const defaultFrom = startOfDay(subDays(now, 30));
      const defaultTo = endOfDay(now);
      onChange({
        from: value?.from ?? defaultFrom,
        to: value?.to ?? defaultTo,
      });
    }
  }, [value, onChange]);

  const isFromInvalid = React.useMemo(() => {
    if (!fromInput.trim()) return false;
    return parseDateTimeString(fromInput, 0, 0) === null;
  }, [fromInput]);

  const isToInvalid = React.useMemo(() => {
    if (!toInput.trim()) return false;
    return parseDateTimeString(toInput, 23, 59) === null;
  }, [toInput]);

  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setFromInput(text);

    if (text.trim() === "") {
      onChange?.({ from: undefined, to: value?.to });
      return;
    }

    const parsed = parseDateTimeString(text, 0, 0);
    if (parsed) {
      onChange?.({ from: parsed, to: value?.to });
    }
  };

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setToInput(text);

    if (text.trim() === "") {
      onChange?.({ from: value?.from, to: undefined });
      return;
    }

    const parsed = parseDateTimeString(text, 23, 59);
    if (parsed) {
      onChange?.({ from: value?.from, to: parsed });
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-2 sm:flex-row sm:items-center w-full",
        className,
      )}
      onBlur={onBlur}
    >
      <div className="flex flex-1 flex-col gap-1">
        <input
          type="text"
          value={fromInput}
          onChange={handleFromChange}
          disabled={disabled}
          placeholder="DD-MM-YYYY HH:mm (من)"
          dir="ltr"
          className={cn(
            "flex h-8 w-full rounded-md border bg-background px-3 py-1 text-xs shadow-sm transition-colors outline-none",
            "disabled:cursor-not-allowed disabled:opacity-50",
            isFromInvalid || error
              ? "border-destructive focus-visible:ring-1 focus-visible:ring-destructive/20 text-destructive"
              : "border-input focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          )}
        />
      </div>
      <span className="hidden sm:inline text-muted-foreground text-xs">—</span>
      <div className="flex flex-1 flex-col gap-1">
        <input
          type="text"
          value={toInput}
          onChange={handleToChange}
          disabled={disabled}
          placeholder="DD-MM-YYYY HH:mm (إلى)"
          dir="ltr"
          className={cn(
            "flex h-8 w-full rounded-md border bg-background px-3 py-1 text-xs shadow-sm transition-colors outline-none",
            "disabled:cursor-not-allowed disabled:opacity-50",
            isToInvalid || error
              ? "border-destructive focus-visible:ring-1 focus-visible:ring-destructive/20 text-destructive"
              : "border-input focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          )}
        />
      </div>
    </div>
  );
}

export { DateTimeRangePicker };
export type { DateTimeRangePickerProps, DateTimeRangeValue };
