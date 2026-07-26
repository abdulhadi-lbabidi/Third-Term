import { useState } from 'react';
import { User, Phone, Mail, MapPin, Building2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { projectsApi } from '../../projects.api';
import { ProjectsDialog } from '../../components/projects.dialog';
import type { Project, CreateProjectPayload, ProjectStatus } from '../../types';

const projectStatusMap: Record<ProjectStatus, { label: string; color: string }> = {
  pending: { label: 'قيد الانتظار', color: 'text-amber-600 bg-amber-50 border-amber-100' },
  in_progress: { label: 'قيد التنفيذ', color: 'text-blue-600 bg-blue-50 border-blue-100' },
  completed: { label: 'مكتمل', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
  cancelled: { label: 'ملغى', color: 'text-rose-600 bg-rose-50 border-rose-100' },
};

export function ProjectClientTab({ project }: { project: Project | null }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();


  const departmentsQuery = useQuery<{ id: number; name: string }[]>({
    queryKey: ['departments'] as const,
    queryFn: () => projectsApi.getDepartments(),
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: CreateProjectPayload) => {
      if (project) {
        return projectsApi.updateProject(project.id, payload);
      }
      return Promise.reject(new Error('Project not found'));
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['projects', project?.id] });
      await queryClient.invalidateQueries({ queryKey: ['projects'] });
      setDialogOpen(false);
      toast.success('تم تحديث بيانات المشروع بنجاح');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'حدث خطأ أثناء تحديث المشروع');
    },
  });

  if (!project) return null;

  const currentStatus = projectStatusMap[project.status] || projectStatusMap.pending;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">العميل والتعاقد</h2>
          <p className="text-sm text-slate-500 mt-1">البيانات الخاصة بالعميل وتفاصيل التعاقد للمشروع</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm flex flex-col gap-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-full bg-blue-50 text-blue-600 border border-blue-100">
              <User className="size-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{project.client?.user?.name || 'اسم العميل غير متوفر'}</h3>
              <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 mt-1">عميل مشروع</span>
            </div>
          </div>

          <div className="space-y-4 mt-2">
            <div className="flex items-center gap-3 text-slate-600">
              <div className="flex size-8 items-center justify-center rounded-full bg-slate-50">
                <Phone className="size-4" />
              </div>
              {project.client?.user?.phone_number ? (
                <a href={`tel:${project.client.user.phone_number}`} className="text-sm font-medium text-blue-600 hover:underline" dir="ltr">
                  {project.client.user.phone_number}
                </a>
              ) : (
                <span className="text-sm font-medium">غير متوفر</span>
              )}
            </div>

            <div className="flex items-center gap-3 text-slate-600">
              <div className="flex size-8 items-center justify-center rounded-full bg-slate-50">
                <Mail className="size-4" />
              </div>
              {project.client?.user?.email ? (
                <a href={`mailto:${project.client.user.email}`} className="text-sm font-medium text-blue-600 hover:underline">
                  {project.client.user.email}
                </a>
              ) : (
                <span className="text-sm font-medium">غير متوفر</span>
              )}
            </div>

            <div className="flex items-center gap-3 text-slate-600">
              <div className="flex size-8 items-center justify-center rounded-full bg-slate-50">
                <MapPin className="size-4" />
              </div>
              <span className="text-sm font-medium">{project.client?.user?.address || 'غير متوفر'}</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm flex flex-col gap-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Building2 className="size-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">تفاصيل التعاقد</h3>
              <p className="text-sm text-slate-500 mt-1">البيانات التعاقدية للمشروع</p>
            </div>
          </div>

          <div className="space-y-4 mt-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-sm text-slate-500">القيمة المتوقعة</span>
              <span className="text-base font-semibold text-slate-900">
                {project.expected_cost?.toLocaleString() || 0} ر.س
              </span>
            </div>
            <div className="flex items-center justify-between pb-1">
              <span className="text-sm text-slate-500">حالة المشروع</span>
              <span className={`text-sm font-medium px-2.5 py-1 rounded-full border ${currentStatus.color}`}>
                {currentStatus.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      <ProjectsDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        project={project}
        departments={departmentsQuery.data || []}
        onSubmit={async (data) => {
          await saveMutation.mutateAsync(data);
        }}
        loading={saveMutation.isPending}
      />
    </div>
  );
}

