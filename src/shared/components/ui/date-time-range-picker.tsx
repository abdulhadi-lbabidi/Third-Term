import * as React from "react";
import {
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  X,
} from "lucide-react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { DayPicker } from "react-day-picker";
import {
  endOfDay,
  format,
  setHours,
  setMinutes,
  startOfDay,
  subDays,
} from "date-fns";

import { useTranslation } from "react-i18next";
import { ar, enUS, type Locale } from "date-fns/locale";

import { Button } from "@/shared/components/ui/button";
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
  contentClassName?: string;
  popoverSide?: "top" | "bottom";
  popoverAlign?: "start" | "center" | "end";
  popoverSideOffset?: number;
  popoverAvoidCollisions?: boolean;

  minDate?: Date;
  maxDate?: Date;
};

type PresetName =
  | "today"
  | "last-30-days"
  | "night-shift"
  | "day-shift"
  | "evening-shift"
  | "custom-range";

const HOURS = Array.from({ length: 24 }, (_, index) => index);
const MINUTES = Array.from({ length: 60 }, (_, index) => index);

function copyDate(date?: Date) {
  return date ? new Date(date.getTime()) : undefined;
}

function createDateWithTime(
  selectedDay: Date,
  currentValue: Date | undefined,
  defaultHour: number,
  defaultMinute: number,
) {
  const hour = currentValue?.getHours() ?? defaultHour;
  const minute = currentValue?.getMinutes() ?? defaultMinute;

  return setMinutes(setHours(selectedDay, hour), minute);
}

function setDateTimeHour(date: Date | undefined, hour: number) {
  return setHours(date ?? new Date(), hour);
}

function setDateTimeMinute(date: Date | undefined, minute: number) {
  return setMinutes(date ?? new Date(), minute);
}

function formatRange(
  value: DateTimeRangeValue | undefined,
  fromLabel: string,
  toLabel: string,
) {
  if (!value?.from && !value?.to) {
    return "";
  }

  if (value.from && value.to) {
    return `${format(value.from, "dd-MM-yyyy HH:mm")} — ${format(
      value.to,
      "dd-MM-yyyy HH:mm",
    )}`;
  }

  if (value.from) {
    return `${fromLabel} ${format(value.from, "dd-MM-yyyy HH:mm")}`;
  }

  return `${toLabel} ${format(value.to as Date, "dd-MM-yyyy HH:mm")}`;
}

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
  placeholder,
  disabled = false,
  error = false,
  className,
  contentClassName,
  popoverSide = "bottom",
  popoverAlign = "start",
  popoverSideOffset = 8,
  popoverAvoidCollisions = true,
  minDate = new Date(2000, 0, 1),
  maxDate = new Date(2035, 11, 31),
}: DateTimeRangePickerProps) {
  const { t } = useTranslation();
  const currentLocale = ar;
  const effectivePlaceholder = placeholder ?? t("datePicker.selectRange", "اختر مجال التاريخ والوقت...");

  const presetLabels = {
    today: t("datePicker.today", "اليوم"),
    "last-30-days": t("datePicker.last30Days", "آخر 30 يوم"),
  };

  const [open, setOpen] = React.useState(false);

  const [draft, setDraft] = React.useState<
    DateTimeRangeValue | undefined
  >(value);

  const [activePreset, setActivePreset] =
    React.useState<PresetName>("custom-range");

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
    if (!open) {
      setDraft(
        value
          ? {
              from: copyDate(value.from),
              to: copyDate(value.to),
            }
          : undefined,
      );
    }
  }, [open, value]);

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

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);

    if (!nextOpen) {
      onBlur?.();
    }
  };

  const applyPreset = (preset: PresetName) => {
    const now = new Date();

    setActivePreset(preset);

    switch (preset) {
      case "today":
        setDraft({
          from: startOfDay(now),
          to: endOfDay(now),
        });
        break;

      case "last-30-days":
        setDraft({
          from: startOfDay(subDays(now, 29)),
          to: endOfDay(now),
        });
        break;

      case "night-shift":
        setDraft({
          from: setMinutes(setHours(startOfDay(now), 0), 0),
          to: setMinutes(setHours(startOfDay(now), 7), 59),
        });
        break;

      case "day-shift":
        setDraft({
          from: setMinutes(setHours(startOfDay(now), 8), 0),
          to: setMinutes(setHours(startOfDay(now), 15), 59),
        });
        break;

      case "evening-shift":
        setDraft({
          from: setMinutes(setHours(startOfDay(now), 16), 0),
          to: setMinutes(setHours(startOfDay(now), 23), 59),
        });
        break;

      case "custom-range":
        break;
    }
  };

  const handleFromDaySelect = (day: Date | undefined) => {
    if (!day) return;

    setActivePreset("custom-range");

    const nextFrom = createDateWithTime(
      day,
      draft?.from,
      0,
      0,
    );

    setDraft((current) => {
      const currentTo = current?.to;

      return {
        from: nextFrom,
        to:
          currentTo && currentTo.getTime() < nextFrom.getTime()
            ? undefined
            : currentTo,
      };
    });
  };

  const handleToDaySelect = (day: Date | undefined) => {
    if (!day) return;

    setActivePreset("custom-range");

    const nextTo = createDateWithTime(
      day,
      draft?.to,
      23,
      59,
    );

    setDraft((current) => ({
      from: current?.from,
      to: nextTo,
    }));
  };

  const updateFromHour = (hour: number) => {
    setActivePreset("custom-range");

    setDraft((current) => ({
      from: setDateTimeHour(current?.from, hour),
      to: current?.to,
    }));
  };

  const updateFromMinute = (minute: number) => {
    setActivePreset("custom-range");

    setDraft((current) => ({
      from: setDateTimeMinute(current?.from, minute),
      to: current?.to,
    }));
  };

  const updateToHour = (hour: number) => {
    setActivePreset("custom-range");

    setDraft((current) => ({
      from: current?.from,
      to: setDateTimeHour(current?.to, hour),
    }));
  };

  const updateToMinute = (minute: number) => {
    setActivePreset("custom-range");

    setDraft((current) => ({
      from: current?.from,
      to: setDateTimeMinute(current?.to, minute),
    }));
  };

  const invalidDraft =
    Boolean(draft?.from) &&
    Boolean(draft?.to) &&
    (draft?.to?.getTime() ?? 0) <
    (draft?.from?.getTime() ?? 0);

  const handleApply = () => {
    if (!draft?.from || !draft.to || invalidDraft) {
      return;
    }

    onChange?.({
      from: new Date(draft.from),
      to: new Date(draft.to),
    });

    setOpen(false);
  };

  const handleCancel = () => {
    setDraft(
      value
        ? {
            from: copyDate(value.from),
            to: copyDate(value.to),
          }
        : undefined,
    );

    setOpen(false);
  };

  const handleClear = (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.stopPropagation();

    setDraft(undefined);
    onChange?.(undefined);
    setActivePreset("custom-range");
  };

  const formattedValue = formatRange(
    value,
    t("datePicker.from", "From"),
    t("datePicker.to", "To"),
  );

  return (
    <>
      <div className="hidden sm:block w-full">
        <PopoverPrimitive.Root
          open={open}
          onOpenChange={handleOpenChange}
        >
          <div className={cn("relative w-full", className)}>
            <PopoverPrimitive.Trigger asChild>
              <Button
                type="button"
                variant="outline"
                disabled={disabled}
                aria-invalid={error || undefined}
                className={cn(
                  "group flex h-8 w-full items-center justify-start gap-2 sm:h-9",
                  "rounded-lg border bg-background px-2.5 sm:px-3",
                  "text-[12px] sm:text-[13px] outline-none transition-fast",
                  "hover:border-border/80 hover:text-white",
                  "focus-visible:ring-2",
                  "disabled:pointer-events-none",
                  "disabled:cursor-not-allowed",
                  "disabled:border-border/40",
                  "disabled:bg-muted/40",
                  "disabled:text-muted-foreground",
                  error
                    ? [
                        "border-destructive",
                        "focus-visible:border-destructive",
                        "focus-visible:ring-destructive/15",
                      ]
                    : [
                        "border-border",
                        "focus-visible:border-primary",
                        "focus-visible:ring-primary/15",
                      ],
                )}
              >
                <CalendarDays
                  aria-hidden="true"
                  className="size-3 shrink-0 text-muted-foreground sm:size-3.5 group-hover:text-white"
                />

                <span
                  className={cn(
                    "min-w-0 flex-1 truncate text-start max-sm:text-xs group-hover:text-white",
                    formattedValue
                      ? "text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {formattedValue || effectivePlaceholder}
                </span>

                {formattedValue && !disabled ? (
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label="Clear date range"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();

                      handleClear(
                        event as unknown as React.MouseEvent<HTMLButtonElement>,
                      );
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setDraft(undefined);
                        onChange?.(undefined);
                        setActivePreset("custom-range");
                      }
                    }}
                    className={cn(
                      "inline-flex size-4.5 shrink-0 items-center justify-center sm:size-5",
                      "rounded-md text-muted-foreground group-hover:text-white/80 hover:text-white",
                      "hover:bg-muted/80",
                    )}
                  >
                    <X className="size-3 sm:size-3.5" />
                  </span>
                ) : (
                  <ChevronDown
                    aria-hidden="true"
                    className="size-3 shrink-0 text-muted-foreground sm:size-3.5 group-hover:text-white"
                  />
                )}
              </Button>
            </PopoverPrimitive.Trigger>
          </div>

          <PopoverPrimitive.Portal>
            <PopoverPrimitive.Content
              side={popoverSide}
              align={popoverAlign}
              sideOffset={popoverSideOffset}
              avoidCollisions={popoverAvoidCollisions}
              collisionPadding={12}
              className={cn(
                "z-[9999] w-[min(760px,calc(100vw-16px))] max-w-[calc(100vw-16px)]",
                "max-h-[calc(100dvh-16px)] overflow-y-auto overflow-x-hidden rounded-xl",
                "border border-border",
                "bg-popover text-popover-foreground",
                "shadow-[var(--shadow-dropdown)]",
                "outline-none",
                "animate-in fade-in-0 zoom-in-95",
                contentClassName,
              )}
            >
              <div className="grid grid-cols-1 lg:grid-cols-[120px_1fr_1fr]">
                <aside
                  className={cn(
                    "flex flex-wrap gap-1 p-1.5 sm:gap-1.5 sm:p-2",
                    "border-b border-border/50",
                    "lg:flex-col lg:border-e lg:border-b-0",
                  )}
                >
                  {(
                    Object.keys(presetLabels) as Array<keyof typeof presetLabels>
                  ).map((preset) => (
                    <Button
                      key={preset}
                      type="button"
                      onClick={() => applyPreset(preset)}
                      variant={activePreset === preset ? "default" : "secondary"}
                      className={cn(
                        "h-7 whitespace-nowrap rounded-md px-2 text-[11px] transition-fast sm:h-8 sm:px-2.5 sm:text-[12px]",
                        "max-sm:flex-1 max-sm:justify-center",
                        activePreset === preset
                          ? ""
                          : "bg-muted !border-none text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                      )}
                    >
                      {presetLabels[preset]}
                    </Button>
                  ))}
                </aside>

                <DatePanel
                  title={t("datePicker.fromDate", "من تاريخ")}
                  value={draft?.from}
                  selected={draft?.from}
                  onSelect={handleFromDaySelect}
                  onHourChange={updateFromHour}
                  onMinuteChange={updateFromMinute}
                  minDate={minDate}
                  maxDate={maxDate}
                  defaultMonth={draft?.from}
                  dateFnsLocale={currentLocale}
                  placeholderText={t("datePicker.selectDateTime", "اختر التاريخ والوقت")}
                  className="border-b border-border/50 md:border-e md:border-b-0"
                />

                <DatePanel
                  title={t("datePicker.toDate", "إلى تاريخ")}
                  value={draft?.to}
                  selected={draft?.to}
                  onSelect={handleToDaySelect}
                  onHourChange={updateToHour}
                  onMinuteChange={updateToMinute}
                  minDate={draft?.from ?? minDate}
                  maxDate={maxDate}
                  defaultMonth={draft?.to ?? draft?.from}
                  dateFnsLocale={currentLocale}
                  placeholderText={t("datePicker.selectDateTime", "اختر التاريخ والوقت")}
                />
              </div>

              {invalidDraft && (
                <div className="border-t border-border/50 px-3 py-2 text-[11px] text-destructive">
                  {t("datePicker.invalidRange", "تاريخ الانتهاء لا يمكن أن يكون قبل تاريخ البدء.")}
                </div>
              )}

              <div
                className={cn(
                  "flex items-stretch gap-2 px-2 pb-2 sm:flex-row sm:items-center sm:justify-end sm:px-3 sm:py-2.5",
                  "border-t border-border/50",
                  "bg-background",
                )}
              >
                <Button
                  type="button"
                  onClick={handleCancel}
                  variant="secondary"
                  className={cn(
                    "h-8 w-fit  rounded-md px-4 text-[12px] transition-fast ",
                  )}
                >
                  {t("datePicker.cancel", "إلغاء")}
                </Button>

                <Button
                  type="button"
                  disabled={
                    !draft?.from ||
                    !draft?.to ||
                    invalidDraft
                  }
                  onClick={handleApply}
                  variant="default"
                  className={cn(
                    "inline-flex h-8 w-fit items-center gap-1.5 rounded-md px-4 text-[12px] transition-fast sm:w-auto",
                  )}
                >
                  <Check className="size-3.5" />
                  {t("datePicker.apply", "تطبيق")}
                </Button>
              </div>
            </PopoverPrimitive.Content>
          </PopoverPrimitive.Portal>
        </PopoverPrimitive.Root>
      </div>

      <div
        className={cn(
          "flex sm:hidden flex-col gap-2 w-full",
          className,
        )}
        onBlur={onBlur}
      >
        <div className="flex flex-col gap-1">
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
        <div className="flex flex-col gap-1">
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
    </>
  );
}

type DatePanelProps = {
  title: string;
  value?: Date;
  selected?: Date;
  onSelect: (date: Date | undefined) => void;
  onHourChange: (hour: number) => void;
  onMinuteChange: (minute: number) => void;
  minDate: Date;
  maxDate: Date;
  defaultMonth?: Date;
  dateFnsLocale?: Locale;
  placeholderText?: string;
  className?: string;
};

function DatePanel({
  title,
  value,
  selected,
  onSelect,
  onHourChange,
  onMinuteChange,
  minDate,
  maxDate,
  defaultMonth,
  dateFnsLocale,
  placeholderText = "Select date and time",
  className,
}: DatePanelProps) {
  const displayDate = value
    ? format(value, "dd-MM-yyyy HH:mm")
    : placeholderText;

  return (
    <div className={cn("min-w-0 p-2.5", className)}>
      <h3 className="mb-2 text-center text-xs font-semibold text-foreground">
        {title}
      </h3>

      <div className="mb-2 flex items-center gap-2">
        <CalendarDays className="size-3.5 shrink-0 text-muted-foreground" />

        <div
          className={cn(
            "flex h-8 min-w-0 flex-1 items-center rounded-md",
            "border border-border bg-muted px-2.5",
            "text-[12px]",
            value ? "text-foreground" : "text-muted-foreground",
          )}
        >
          <span className="truncate">
            {displayDate}
          </span>
        </div>
      </div>

      <div className="mb-2 flex items-center justify-center gap-1.5">
        <Clock3 className="size-3.5 text-muted-foreground" />

        <TimeSelect
          value={value?.getHours() ?? 0}
          values={HOURS}
          onChange={onHourChange}
        />

        <span className="text-xs text-muted-foreground">:</span>

        <TimeSelect
          value={value?.getMinutes() ?? 0}
          values={MINUTES}
          onChange={onMinuteChange}
        />
      </div>

      <DayPicker
        mode="single"
        selected={selected}
        onSelect={onSelect}
        defaultMonth={defaultMonth}
        captionLayout="dropdown"
        navLayout="around"
        startMonth={minDate}
        endMonth={maxDate}
        disabled={{
          before: minDate,
          after: maxDate,
        }}
        locale={dateFnsLocale}
        showOutsideDays
        className="mx-auto"
        classNames={{
          root: "relative w-full ",
          months: "w-full",
          month: "relative w-full space-y-2",
          month_caption:
            "relative flex h-8 items-center justify-center px-10",
          dropdowns:
            "absolute inset-x-10 top-0 flex h-8 items-center justify-center gap-1.5",
          dropdown_root:
            "relative inline-flex h-7 items-center rounded-md border border-border bg-muted",
          dropdown:
            "absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0",
          caption_label:
            "pointer-events-none inline-flex h-7 items-center gap-1.5 px-2.5 text-[12px] font-medium text-foreground max-sm:text-[11px]",
          nav:
            "pointer-events-none absolute inset-x-0 top-0 z-10 flex h-8 items-center justify-between px-1 max-sm:hidden",
          button_previous:
            "absolute start-0 top-0 z-20 inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus:ring-0 max-sm:hidden",
          button_next:
            "absolute end-0 top-0 z-20 inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus:ring-0 max-sm:hidden",
          chevron: "size-3.5 fill-muted-foreground",
          month_grid:
            "w-full table-fixed border-collapse max-sm:hidden",
          weekdays: "grid grid-cols-7 max-sm:hidden",
          weekday:
            "flex h-6 items-center justify-center text-[10px] font-medium text-muted-foreground max-sm:hidden",
          weeks: "block max-sm:hidden",
          week: "grid grid-cols-7 max-sm:hidden",
          day:
            "relative flex aspect-square items-center justify-center p-0 text-center max-sm:hidden",
          day_button: cn(
            "inline-flex size-7 items-center justify-center max-sm:hidden",
            "rounded-md text-[12px] text-foreground",
            "outline-none transition-fast",
            "hover:bg-muted",
            "focus-visible:outline-none focus-visible:ring-0",
          ),
          selected:
            "[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary",
          today:
            "[&>button]:border [&>button]:border-primary [&>button]:text-accent-text",
          outside:
            "[&>button]:text-muted-foreground/50",
          disabled:
            "[&>button]:pointer-events-none [&>button]:text-muted-foreground/30 [&>button]:opacity-50",
          hidden: "invisible",
        }}
      />
    </div>
  );
}

type TimeSelectProps = {
  value: number;
  values: number[];
  onChange: (value: number) => void;
};

function TimeSelect({
  value,
  values,
  onChange,
}: TimeSelectProps) {
  return (
    <select
      value={value}
      onChange={(event) =>
        onChange(Number(event.target.value))
      }
      className={cn(
        "h-7 rounded-md border border-border",
        "bg-muted px-1.5",
        "text-[12px] text-foreground",
        "outline-none",
        "focus:border-primary",
        "focus:ring-2 focus:ring-primary/15",
      )}
    >
      {values.map((item) => (
        <option key={item} value={item}>
          {String(item).padStart(2, "0")}
        </option>
      ))}
    </select>
  );
}

export { DateTimeRangePicker };

export type {
  DateTimeRangePickerProps,
  DateTimeRangeValue,
};
