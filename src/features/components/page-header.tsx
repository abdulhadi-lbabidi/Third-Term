import type { ReactNode } from "react";
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
  badge?: string;
  icon?: React.ComponentType<{ className?: string }>;
  description?: ReactNode;
  action?: ReactNode;
  stats?: PageHeaderStat[];
  tabs?: PageTab[];
  defaultTab?: string;
  tabParam?: string;
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
  boxed = true,
}: PageHeaderProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  const rawTab = searchParams.get(tabParam);
  const isValidTab = tabs?.some((t) => t.value === rawTab);
  const activeTab = isValidTab ? rawTab : (defaultTab ?? tabs?.[0]?.value);

  function handleTabChange(value: string) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set(tabParam, value);
      return next;
    });
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
          "flex flex-col gap-4 px-4 py-2 sm:flex-row sm:items-center sm:justify-between sm:px-5",
          hasTabs && "pb-3"
        )}
      >
        <div className="flex min-w-0 items-start gap-3">
          {Icon ? (
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-primary">
              <Icon className="size-5" />
            </div>
          ) : null}
          <div className="min-w-0 space-y-1">
            {badge ? (
              <div className="status-badge-primary tracking-[0.12em] uppercase">
                {badge}
              </div>
            ) : null}
            <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              {title}
            </h1>
            {description ? (
              <div className="text-sm text-muted-foreground">{description}</div>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-4">
          {stats?.length ? (
            <div className="flex flex-wrap items-center divide-x divide-x-reverse divide-border">
              {stats.map((stat) => (
                <div key={stat.label} className="flex items-center gap-2 px-3 first:pr-0 last:pl-0">
                  {stat.icon ? <span className="text-muted-foreground">{stat.icon}</span> : null}
                  <div className="leading-tight">
                    <div className="text-[11px] text-muted-foreground">{stat.label}</div>
                    <div className="mt-0.5 text-sm font-semibold text-foreground">{stat.value}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
          {action ? <div className="flex flex-wrap items-center gap-2">{action}</div> : null}
        </div>
      </div>

      {hasTabs && activeTab ? (
        <div className="flex items-end gap-1 overflow-x-auto border-t border-border px-3 sm:px-5">
          {tabs!.map((tab) => {
            const isActive = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => handleTabChange(tab.value)}
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
