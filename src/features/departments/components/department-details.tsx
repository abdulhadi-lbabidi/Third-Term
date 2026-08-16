import { useQuery } from '@tanstack/react-query';
import { Building2, User, FolderKanban, Calendar, Users, HardHat } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { departmentsApi } from '../departments.api';
import { cn, formatArabicDate } from '@/shared/lib/utils';

type DepartmentDetailsProps = {
  departmentId: number;
  onClose: () => void;
};

export function DepartmentDetails({ departmentId, onClose }: DepartmentDetailsProps) {
  const { data: department, isLoading } = useQuery({
    queryKey: ['departments', 'detail', departmentId],
    queryFn: () => departmentsApi.getById(departmentId),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col flex-1 space-y-4">
        <div className="h-6 w-48 animate-pulse rounded bg-slate-200" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="h-28 animate-pulse rounded-xl bg-slate-200" />
          <div className="h-28 animate-pulse rounded-xl bg-slate-200" />
          <div className="h-28 animate-pulse rounded-xl bg-slate-200" />
        </div>
        <div className="h-64 animate-pulse rounded-xl bg-slate-200" />
      </div>
    );
  }

  if (!department) {
    return (
      <div className="p-8 text-center text-slate-500">
        <p>القسم غير موجود.</p>
        <Button onClick={onClose} className="mt-4">
          إغلاق
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 space-y-6">
      <div className="min-w-0 flex-1">
        <h2 className="text-xl font-bold text-slate-900 truncate">{department.name}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">تفاصيل الهيكل التنظيمي والمشاريع المنسوبة</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="flex items-start gap-3.5 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <Building2 className="mt-1 size-5 text-primary shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">اسم القسم</p>
            <p className="mt-1 text-sm font-semibold text-slate-900 truncate">{department.name}</p>
          </div>
        </div>

        <div className="flex items-start gap-3.5 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <User className="mt-1 size-5 text-primary shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">المدير العام</p>
            <p className="mt-1 text-sm font-semibold text-slate-900 truncate">{department.main_manager || '-'}</p>
          </div>
        </div>

        <div className="flex items-start gap-3.5 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <Calendar className="mt-1 size-5 text-primary shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">تاريخ الإنشاء</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {department.created_at ? formatArabicDate(department.created_at) : '-'}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-3 flex items-center gap-2">
            <Users className="size-4.5 text-primary" />
            <h3 className="font-bold text-slate-900 text-sm">الموظفون ({department.employees?.length ?? 0})</h3>
          </div>
          {(!department.employees || department.employees.length === 0) ? (
            <div className="py-8 text-center text-xs text-slate-400">لا يوجد موظفون في هذا القسم حالياً.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500 bg-slate-50/30">
                    <th className="p-3 font-semibold">الاسم</th>
                    <th className="p-3 font-semibold">المسمى الوظيفي</th>
                    <th className="p-3 font-semibold">الهاتف</th>
                    <th className="p-3 font-semibold">البريد الإلكتروني</th>
                    <th className="p-3 font-semibold">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {department.employees.map((emp) => {
                    const status = emp.status || 'active';
                    return (
                      <tr key={emp.id} className="hover:bg-slate-50/50">
                        <td className="p-3 text-slate-900 font-medium">{emp.user?.name || emp.name}</td>
                        <td className="p-3 text-slate-600">{emp.job_title || '-'}</td>
                        <td className="p-3 text-slate-600" dir="ltr">{emp.user?.phone_number || '-'}</td>
                        <td className="p-3 text-slate-600">{emp.user?.email || '-'}</td>
                        <td className="p-3">
                          <span className={cn(
                            "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold",
                            status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                              : status === 'retired'
                              ? 'bg-amber-50 text-amber-700 border-amber-200/60'
                              : 'bg-rose-50 text-rose-700 border-rose-200/60'
                          )}>
                            {status === 'active' ? 'على رأس عمله' : status === 'retired' ? 'متقاعد' : 'مستقيل'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-3 flex items-center gap-2">
            <HardHat className="size-4.5 text-primary" />
            <h3 className="font-bold text-slate-900 text-sm">المهندسون ({department.engineers?.length ?? 0})</h3>
          </div>
          {(!department.engineers || department.engineers.length === 0) ? (
            <div className="py-8 text-center text-xs text-slate-400">لا يوجد مهندسون في هذا القسم حالياً.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500 bg-slate-50/30">
                    <th className="p-3 font-semibold">الاسم</th>
                    <th className="p-3 font-semibold">المسمى الوظيفي</th>
                    <th className="p-3 font-semibold">الهاتف</th>
                    <th className="p-3 font-semibold">البريد الإلكتروني</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {department.engineers.map((eng) => (
                    <tr key={eng.id} className="hover:bg-slate-50/50">
                      <td className="p-3 text-slate-900 font-medium">{eng.user?.name || eng.name}</td>
                      <td className="p-3 text-slate-600">{eng.job_title || '-'}</td>
                      <td className="p-3 text-slate-600" dir="ltr">{eng.user?.phone_number || '-'}</td>
                      <td className="p-3 text-slate-600">{eng.user?.email || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-3 flex items-center gap-2">
            <FolderKanban className="size-4.5 text-primary" />
            <h3 className="font-bold text-slate-900 text-sm">المشاريع ({department.projects?.length ?? 0})</h3>
          </div>
          {(!department.projects || department.projects.length === 0) ? (
            <div className="py-8 text-center text-xs text-slate-400">لا توجد مشاريع منسوبة لهذا القسم حالياً.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500 bg-slate-50/30">
                    <th className="p-3 font-semibold">اسم المشروع</th>
                    <th className="p-3 font-semibold">التكلفة المتوقعة</th>
                    <th className="p-3 font-semibold">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {department.projects.map((proj) => (
                    <tr key={proj.id} className="hover:bg-slate-50/50">
                      <td className="p-3 text-slate-900 font-medium">{proj.name}</td>
                      <td className="p-3 text-slate-600 font-semibold">{proj.expected_cost} $</td>
                      <td className="p-3">
                        <span className={cn(
                          "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold bg-slate-50 text-slate-700 border-slate-200/60"
                        )}>
                          {proj.status === 'pending' ? 'قيد الانتظار' : proj.status === 'ongoing' ? 'قيد العمل' : 'مكتمل'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
