import { ArrowDownRight, ArrowUpRight, Receipt, Plus } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import type { Project } from '@/features/projects/types';

export function ProjectFinancialsTab({ project }: { project: Project | null }) {
  if (!project) return null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">المالية والصناديق</h2>
          <p className="text-sm text-slate-500 mt-1">إدارة الصناديق، الإيرادات، المصروفات، والفواتير</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3 text-emerald-700">
            <div className="flex size-10 items-center justify-center rounded-full bg-emerald-100">
              <ArrowDownRight className="size-5" />
            </div>
            <h3 className="text-base font-semibold">الإيرادات</h3>
          </div>
          <div className="flex justify-between items-end mt-2">
            <span className="text-2xl font-bold text-slate-900">0</span>
            <Button variant="link" className="text-emerald-700 h-auto p-0 flex gap-1 font-medium">
              عرض الكل &larr;
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-red-100 bg-red-50/30 p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3 text-red-700">
            <div className="flex size-10 items-center justify-center rounded-full bg-red-100">
              <ArrowUpRight className="size-5" />
            </div>
            <h3 className="text-base font-semibold">المصروفات</h3>
          </div>
          <div className="flex justify-between items-end mt-2">
            <span className="text-2xl font-bold text-slate-900">0</span>
            <Button variant="link" className="text-red-700 h-auto p-0 flex gap-1 font-medium">
              عرض الكل &larr;
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-blue-50/30 p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3 text-blue-700">
            <div className="flex size-10 items-center justify-center rounded-full bg-blue-100">
              <Receipt className="size-5" />
            </div>
            <h3 className="text-base font-semibold">الفواتير</h3>
          </div>
          <div className="flex justify-between items-end mt-2">
            <span className="text-2xl font-bold text-slate-900">0</span>
            <Button variant="link" className="text-blue-700 h-auto p-0 flex gap-1 font-medium">
              عرض الكل &larr;
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/60 bg-white shadow-sm overflow-hidden mt-6">
        <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-lg font-semibold text-slate-900">أحدث الحركات</h3>
          <Button variant="outline" size="sm" className="h-8 rounded-full px-3 text-xs gap-1">
            <Plus className="size-3" />
            إضافة حركة
          </Button>
        </div>
        <div className="p-10 text-center flex flex-col items-center">
          <div className="rounded-full bg-slate-100 p-4 mb-4">
            <Receipt className="size-8 text-slate-400" />
          </div>
          <h4 className="text-base font-medium text-slate-900">لا توجد حركات مالية بعد</h4>
          <p className="text-sm text-slate-500 max-w-sm mt-1">لم يتم تسجيل أي إيرادات، مصروفات، أو فواتير لهذا المشروع حتى الآن.</p>
        </div>
      </div>
    </div>
  );
}
