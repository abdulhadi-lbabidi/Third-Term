import { useRef, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { cn } from "@/shared/lib/utils";

export interface PageTab {
  value: string;
  label: string;
  icon?: ReactNode;
}

export interface PageHeaderStat {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
}

interface PageHeaderProps {
  title: string | ReactNode;
  badge?: ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  description?: ReactNode;
  action?: ReactNode;
  stats?: PageHeaderStat[];
  tabs?: PageTab[];
  defaultTab?: string;
  tabParam?: string;
  resetSearchOnTabChange?: boolean;
  boxed?: boolean;
  className?: string;
}

export function PageHeader({
  title,
  badge,
  icon: Icon,
  description,
  action,
  stats,
  className,
  tabs,
  defaultTab,
  tabParam = "tab",
  resetSearchOnTabChange = false,
  boxed = true,
}: PageHeaderProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabsScrollRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, scrollLeft: 0 });
  const isDraggingRef = useRef(false);
  const dragMovedRef = useRef(false);

  const rawTab = searchParams.get(tabParam);
  const isValidTab = tabs?.some((t) => t.value === rawTab);
  const activeTab = isValidTab ? rawTab : (defaultTab ?? tabs?.[0]?.value);

  function handleTabChange(value: string) {
    setSearchParams((prev) => {
      if (resetSearchOnTabChange) {
        return new URLSearchParams([[tabParam, value]]);
      }
      const next = new URLSearchParams(prev);
      next.set(tabParam, value);
      return next;
    });
  }

  function handleTabsPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    dragMovedRef.current = false;
    if (event.button !== 0 || event.pointerType !== 'mouse') return;
    isDraggingRef.current = true;
    dragStartRef.current = {
      x: event.clientX,
      scrollLeft: event.currentTarget.scrollLeft,
    };
  }

  function handleTabsPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!isDraggingRef.current) return;
    const distance = event.clientX - dragStartRef.current.x;
    if (Math.abs(distance) > 8) dragMovedRef.current = true;
    event.currentTarget.scrollLeft = dragStartRef.current.scrollLeft - distance;
  }

  function handleTabsPointerEnd() {
    isDraggingRef.current = false;
  }

  const hasTabs = tabs && tabs.length > 0;

  return (
    <div
      className={cn(
        "bg-card",
        boxed && "rounded-lg border border-border shadow-[var(--shadow-finance)]",
        className
      )}
    >
      <div
        className={cn(
          "flex flex-col gap-4 px-4 py-3 sm:px-5 lg:flex-row lg:items-center",
          hasTabs && "pb-3"
        )}
      >
        <div className="flex min-w-0 items-start gap-3 lg:flex-1">
          {Icon ? (
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-primary">
              <Icon className="size-5" />
            </div>
          ) : null}
          <div className="min-w-0 space-y-1">
            {badge
              ? (typeof badge === 'string'
                  ? <div className="status-badge-primary tracking-[0.12em] uppercase">{badge}</div>
                  : badge)
              : null}
            <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              {title}
            </h1>
            {description ? (
              <div className="text-sm text-muted-foreground">{description}</div>
            ) : null}
          </div>
        </div>
        <div className="flex min-w-0 w-full flex-col gap-3 lg:ms-auto lg:w-auto lg:shrink-0 lg:flex-row lg:items-center lg:justify-end">
          {stats?.length ? (
            <div className="flex max-w-full items-center overflow-x-auto divide-x divide-border pb-1 lg:pb-0">
              {stats.map((stat) => (
                <div key={stat.label} className="flex shrink-0 items-center gap-2 px-3 first:ps-0 last:pe-0">
                  {stat.icon ? <span className="text-muted-foreground">{stat.icon}</span> : null}
                  <div className="leading-tight">
                    <div className="text-[11px] text-muted-foreground">{stat.label}</div>
                    <div className="mt-0.5 text-sm font-semibold text-foreground">{stat.value}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
          {action ? (
            <div className="flex w-full flex-wrap items-center justify-end gap-2 lg:w-auto lg:flex-nowrap">
              {action}
            </div>
          ) : null}
        </div>
      </div>

      {hasTabs && activeTab ? (
        <div
          ref={tabsScrollRef}
          className="flex max-w-full cursor-grab touch-pan-x select-none items-end gap-1 overflow-x-auto border-t border-border px-3 active:cursor-grabbing sm:px-5"
          onPointerDown={handleTabsPointerDown}
          onPointerMove={handleTabsPointerMove}
          onPointerUp={handleTabsPointerEnd}
          onPointerCancel={handleTabsPointerEnd}
          onPointerLeave={handleTabsPointerEnd}
        >
          {tabs!.map((tab) => {
            const isActive = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={(event) => {
                  if (dragMovedRef.current) {
                    event.preventDefault();
                    return;
                  }
                  handleTabChange(tab.value);
                }}
                className={cn(
                  "relative my-1 flex shrink-0 items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-primary/5 hover:text-primary"
                )}
              >
                {tab.icon}
                {tab.label}
                <span
                  className={cn(
                    "absolute inset-x-2 bottom-0 h-0.5 rounded-full transition-colors",
                    isActive ? "bg-primary" : "bg-transparent"
                  )}
                />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
