import type { ReactNode } from "react";


interface PageHeaderProps {
  title: string | any;
  badge?: string;
  action?: ReactNode
}

export function PageHeader({ title, badge, action }: PageHeaderProps) {
  return (
    <div className="rounded-lg border border-slate-200/80 bg-white p-3 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          {badge && (
            <div className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
              {badge}
            </div>
          )}
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{title}</h1>
        </div>
        {action && <div>{action}</div>}
      </div>
    </div>
  );
}
