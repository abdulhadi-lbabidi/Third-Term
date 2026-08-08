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
  const { t, i18n } = useTranslation();
  const currentLocale = (i18n?.language || "ar").startsWith("ar") ? ar : enUS;
  const effectivePlaceholder = placeholder ?? t("datePicker.selectRange", "اختر مجال التاريخ والوقت...");

  const presetLabels: Record<PresetName, string> = {
    today: t("datePicker.today", "اليوم"),
    "last-30-days": t("datePicker.last30Days", "آخر 30 يوم"),
    "custom-range": t("datePicker.customRange", "مجال مخصص"),
  };

  const [open, setOpen] = React.useState(false);

  const [draft, setDraft] = React.useState<
    DateTimeRangeValue | undefined
  >(value);

  const [activePreset, setActivePreset] =
    React.useState<PresetName>("custom-range");

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
              "flex h-8 w-full items-center justify-start gap-2 sm:h-9",
              "rounded-lg border px-2.5 sm:px-3",
              "text-[12px] sm:text-[13px] outline-none transition-fast",
              "hover:border-foreground/20",
              "focus-visible:ring-2",
              "disabled:pointer-events-none",
              "disabled:cursor-not-allowed",
              "disabled:border-muted",
              "disabled:bg-muted/50",
              "disabled:text-muted-foreground/50",
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
              className="size-3 shrink-0 text-muted-foreground sm:size-3.5"
            />

            <span
              className={cn(
                "min-w-0 flex-1 truncate text-start max-sm:text-xs",
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
                  "rounded-md text-muted-foreground",
                  "hover:bg-muted hover:text-foreground",
                )}
              >
                <X className="size-3 sm:size-3.5" />
              </span>
            ) : (
              <ChevronDown
                aria-hidden="true"
                className="size-3 shrink-0 text-muted-foreground sm:size-3.5"
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
            "z-[200] w-[min(760px,calc(100vw-16px))] max-w-[calc(100vw-16px)]",
            "max-h-[calc(100dvh-16px)] overflow-y-auto overflow-x-hidden rounded-xl",
            "border border-border",
            "bg-popover text-popover-foreground",
            "shadow-md",
            "outline-none",
            "animate-in fade-in-0 zoom-in-95",
            contentClassName,
          )}
        >
          <div className="grid grid-cols-1 lg:grid-cols-[120px_1fr_1fr]">
            <aside
              className={cn(
                "flex flex-wrap gap-1 p-1.5 sm:gap-1.5 sm:p-2",
                "border-b border-border",
                "lg:flex-col lg:border-e lg:border-b-0",
              )}
            >
              {(
                Object.keys(presetLabels) as PresetName[]
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
                      : "bg-muted/50 !border-none text-muted-foreground hover:bg-accent hover:text-foreground",
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
              className="border-b border-border md:border-e md:border-b-0"
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
            <div className="border-t border-border px-3 py-2 text-[11px] text-destructive">
              {t("datePicker.invalidRange", "تاريخ النهاية لا يمكن أن يكون قبل تاريخ البداية.")}
            </div>
          )}

          <div
            className={cn(
              "flex items-stretch gap-2 px-2 pb-2 sm:flex-row sm:items-center sm:justify-end sm:px-3 sm:py-2.5",
              "border-t border-border",
              "bg-muted/20",
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
            "[&>button]:border [&>button]:border-primary [&>button]:text-foreground",
          outside:
            "[&>button]:text-muted-foreground/40",
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
