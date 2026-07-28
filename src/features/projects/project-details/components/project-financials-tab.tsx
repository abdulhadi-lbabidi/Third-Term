import { ArrowDownRight, ArrowUpRight, Receipt, Plus } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import type { Project } from '@/features/projects/types';

export function ProjectFinancialsTab({ project }: { project: Project | null }) {
  if (!project) return null;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-foreground">المالية والصناديق</h2>
        <p className="mt-1 text-sm text-muted-foreground">إدارة الصناديق، الإيرادات، المصروفات، والفواتير</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5 shadow-[var(--shadow-finance)]">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-md bg-success/10 text-success">
              <ArrowDownRight className="size-4" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">الإيرادات</h3>
          </div>
          <div className="mt-1 flex items-end justify-between">
            <span className="finance-num text-2xl font-semibold text-foreground">0</span>
            <Button variant="link" className="h-auto p-0 text-success">
              عرض الكل
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5 shadow-[var(--shadow-finance)]">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-md bg-destructive/10 text-destructive">
              <ArrowUpRight className="size-4" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">المصروفات</h3>
          </div>
          <div className="mt-1 flex items-end justify-between">
            <span className="finance-num text-2xl font-semibold text-foreground">0</span>
            <Button variant="link" className="h-auto p-0 text-destructive">
              عرض الكل
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5 shadow-[var(--shadow-finance)]">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-md bg-info/10 text-info">
              <Receipt className="size-4" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">الفواتير</h3>
          </div>
          <div className="mt-1 flex items-end justify-between">
            <span className="finance-num text-2xl font-semibold text-foreground">0</span>
            <Button variant="link" className="h-auto p-0 text-info">
              عرض الكل
            </Button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-[var(--shadow-finance)]">
        <div className="flex items-center justify-between border-b border-border bg-muted/50 px-5 py-3">
          <h3 className="text-sm font-semibold text-foreground">أحدث الحركات</h3>
          <Button variant="outline" size="sm">
            <Plus className="size-3.5" />
            إضافة حركة
          </Button>
        </div>
        <div className="flex flex-col items-center p-10 text-center">
          <div className="mb-3 rounded-md bg-muted p-3">
            <Receipt className="size-7 text-muted-foreground" />
          </div>
          <h4 className="text-sm font-medium text-foreground">لا توجد حركات مالية بعد</h4>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            لم يتم تسجيل أي إيرادات، مصروفات، أو فواتير لهذا المشروع حتى الآن.
          </p>
        </div>
      </div>
    </div>
  );
}
