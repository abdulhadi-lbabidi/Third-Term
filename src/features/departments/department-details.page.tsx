import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Building2, User, FolderKanban, Calendar, Users, HardHat, ArrowRight } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { PageHeader } from '@/features/components/page-header';
import { departmentsApi } from './departments.api';
import { cn, formatArabicDate } from '@/shared/lib/utils';

export function DepartmentDetailsPage() {
  const { departmentId } = useParams<{ departmentId: string }>();
  const navigate = useNavigate();
  const parsedId = Number(departmentId);

  const { data: department, isLoading, isError } = useQuery({
    queryKey: ['departments', 'detail', parsedId],
    queryFn: () => departmentsApi.getById(parsedId),
    enabled: Boolean(parsedId && !Number.isNaN(parsedId)),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col flex-1 space-y-5">
        <Skeleton className="h-20 w-full rounded-xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (isError || !department) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center space-y-4 py-16 text-center">
        <Building2 className="size-12 text-muted-foreground/60" />
        <p className="text-base font-medium text-foreground">تعذر العثور على بيانات القسم.</p>
        <Button variant="outline" onClick={() => navigate('/departments')}>
          العودة للأقسام
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 space-y-6">
      <PageHeader
        badge="الهيكلية الإدارية"
        title={department.name}
        description="تفاصيل الهيكل التنظيمي والمشاريع المنسوبة"
        icon={Building2}
        action={
          <Button
            variant="outline"
            onClick={() => navigate('/departments')}
            className="gap-2"
          >
            <ArrowRight className="size-4" />
            العودة للأقسام
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="flex items-start gap-3.5 rounded-xl border border-border bg-card p-4 shadow-sm">
          <Building2 className="mt-1 size-5 text-primary shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">اسم القسم</p>
            <p className="mt-1 text-sm font-semibold text-foreground truncate">{department.name}</p>
          </div>
        </div>

        <div className="flex items-start gap-3.5 rounded-xl border border-border bg-card p-4 shadow-sm">
          <User className="mt-1 size-5 text-primary shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">المدير العام</p>
            <p className="mt-1 text-sm font-semibold text-foreground truncate">{department.main_manager || '-'}</p>
          </div>
        </div>

        <div className="flex items-start gap-3.5 rounded-xl border border-border bg-card p-4 shadow-sm">
          <Calendar className="mt-1 size-5 text-primary shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">تاريخ الإنشاء</p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {department.created_at ? formatArabicDate(department.created_at) : '-'}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2 items-start">
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="border-b border-border bg-muted/40 px-4 py-3 flex items-center gap-2">
              <Users className="size-4.5 text-primary" />
              <h3 className="font-bold text-foreground text-sm">الموظفون ({department.employees?.length ?? 0})</h3>
            </div>
            {(!department.employees || department.employees.length === 0) ? (
              <div className="py-8 text-center text-xs text-muted-foreground">لا يوجد موظفون في هذا القسم حالياً.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground bg-muted/20">
                      <th className="p-3 font-semibold">الاسم</th>
                      <th className="p-3 font-semibold">المسمى الوظيفي</th>
                      <th className="p-3 font-semibold">الهاتف</th>
                      <th className="p-3 font-semibold">البريد الإلكتروني</th>
                      <th className="p-3 font-semibold">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {department.employees.map((emp) => {
                      const status = emp.status || 'active';
                      return (
                        <tr key={emp.id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-3 text-foreground font-medium">{emp.user?.name || emp.name}</td>
                          <td className="p-3 text-muted-foreground">{emp.job_title || '-'}</td>
                          <td className="p-3 text-muted-foreground" dir="ltr">{emp.user?.phone_number || '-'}</td>
                          <td className="p-3 text-muted-foreground">{emp.user?.email || '-'}</td>
                          <td className="p-3">
                            <span className={cn(
                              "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold",
                              status === 'active'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800'
                                : status === 'retired'
                                ? 'bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800'
                                : 'bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800'
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

          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="border-b border-border bg-muted/40 px-4 py-3 flex items-center gap-2">
              <HardHat className="size-4.5 text-primary" />
              <h3 className="font-bold text-foreground text-sm">المهندسون ({department.engineers?.length ?? 0})</h3>
            </div>
            {(!department.engineers || department.engineers.length === 0) ? (
              <div className="py-8 text-center text-xs text-muted-foreground">لا يوجد مهندسون في هذا القسم حالياً.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground bg-muted/20">
                      <th className="p-3 font-semibold">الاسم</th>
                      <th className="p-3 font-semibold">المسمى الوظيفي</th>
                      <th className="p-3 font-semibold">الهاتف</th>
                      <th className="p-3 font-semibold">البريد الإلكتروني</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {department.engineers.map((eng) => (
                      <tr key={eng.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3 text-foreground font-medium">{eng.user?.name || eng.name}</td>
                        <td className="p-3 text-muted-foreground">{eng.job_title || '-'}</td>
                        <td className="p-3 text-muted-foreground" dir="ltr">{eng.user?.phone_number || '-'}</td>
                        <td className="p-3 text-muted-foreground">{eng.user?.email || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="border-b border-border bg-muted/40 px-4 py-3 flex items-center gap-2">
            <FolderKanban className="size-4.5 text-primary" />
            <h3 className="font-bold text-foreground text-sm">المشاريع ({department.projects?.length ?? 0})</h3>
          </div>
          {(!department.projects || department.projects.length === 0) ? (
            <div className="py-8 text-center text-xs text-muted-foreground">لا توجد مشاريع منسوبة لهذا القسم حالياً.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground bg-muted/20">
                    <th className="p-3 font-semibold">اسم المشروع</th>
                    <th className="p-3 font-semibold">التكلفة المتوقعة</th>
                    <th className="p-3 font-semibold">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {department.projects.map((proj) => (
                    <tr key={proj.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3 text-foreground font-medium">{proj.name}</td>
                      <td className="p-3 text-muted-foreground font-semibold">{Number(proj.expected_cost || 0).toLocaleString()} $</td>
                      <td className="p-3">
                        <span className="inline-flex items-center rounded-md border border-border bg-muted/60 px-2 py-0.5 text-[10px] font-semibold text-foreground">
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
