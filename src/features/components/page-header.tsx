import type { ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { cn } from "@/shared/lib/utils";

export interface PageTab {
  value: string;
  label: string;
  icon?: ReactNode;
}

interface PageHeaderProps {
  title: string | any;
  badge?: string;
  icon?: any;
  description?: ReactNode;
  action?: ReactNode;
  tabs?: PageTab[];
  defaultTab?: string;
  tabParam?: string;
  boxed?: boolean;
}

export function PageHeader({
  title,
  badge,
  icon: Icon,
  description,
  action,
  tabs,
  defaultTab,
  tabParam = "tab",
  boxed = true,
}: PageHeaderProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab =
    tabs && tabs.length > 0
      ? (searchParams.get(tabParam) ?? defaultTab ?? tabs[0].value)
      : undefined;

  function handleTabChange(value: string) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set(tabParam, value);
      return next;
    });
  }

  const hasTabs = tabs && tabs.length > 0;

  return (
    <div className={cn("bg-white ", boxed ? "rounded-xl border border-slate-200/80 shadow-[0_10px_30px_rgba(15,23,42,0.06)]" : "")}    >
      {/* Title row */}
      <div className={cn("flex items-center justify-between gap-4 px-5 py-4", hasTabs && "pb-0")}>
        <div className="flex items-center gap-4">
          {Icon && (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-100/80 text-slate-600">
              <Icon className="h-6 w-6" />
            </div>
          )}
          <div className="space-y-1">
            {badge && (
              <div className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                {badge}
              </div>
            )}
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
              {title}
            </h1>
            {description && (
              <p className="text-sm text-slate-500 mt-1">{description}</p>
            )}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>

      {/* Tabs bar */}
      {hasTabs && activeTab && (
        <div className="mt-3 flex items-end gap-1 border-t border-slate-100 px-5">
          {tabs!.map((tab) => {
            const isActive = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => handleTabChange(tab.value)}
                className={cn(
                  "relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950/20 rounded-t-lg",
                  isActive
                    ? "text-slate-950"
                    : "text-slate-400 hover:text-slate-700"
                )}
              >
                {tab.icon}
                {tab.label}
                {/* Active underline */}
                <span
                  className={cn(
                    "absolute bottom-0 left-0 right-0 h-[2px] rounded-full transition-all duration-200",
                    isActive ? "bg-slate-950" : "bg-transparent"
                  )}
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
