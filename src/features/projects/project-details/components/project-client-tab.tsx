import { useState } from 'react';
import { User, Phone, Mail, MapPin, Building2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { projectsApi } from '../../projects.api';
import { ProjectsDialog } from '../../components/projects.dialog';
import type { Project, CreateProjectPayload, ProjectStatus } from '../../types';

const projectStatusMap: Record<ProjectStatus, { label: string; color: string }> = {
  pending: { label: 'قيد الانتظار', color: 'status-badge-warning' },
  in_progress: { label: 'قيد التنفيذ', color: 'status-badge-info' },
  completed: { label: 'مكتمل', color: 'status-badge-success' },
  cancelled: { label: 'ملغى', color: 'status-badge-danger' },
};

export function ProjectClientTab({ project }: { project: Project | null }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const departmentsQuery = useQuery<{ id: number; name: string }[]>({
    queryKey: ['departments'] as const,
    queryFn: () => projectsApi.getDepartments(),
    enabled: dialogOpen,
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
    onError: (error: unknown) => {
      const message =
        typeof error === 'object' &&
          error !== null &&
          'response' in error &&
          typeof (error as { response?: { data?: { message?: string } } }).response?.data?.message === 'string'
          ? (error as { response: { data: { message: string } } }).response.data.message
          : 'حدث خطأ أثناء تحديث المشروع';
      toast.error(message);
    },
  });

  if (!project) return null;

  const currentStatus = projectStatusMap[project.status] || projectStatusMap.pending;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-foreground">العميل والتعاقد</h2>
        <p className="mt-1 text-sm text-muted-foreground">البيانات الخاصة بالعميل وتفاصيل التعاقد للمشروع</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-5 rounded-lg border border-border bg-card p-5 shadow-[var(--shadow-finance)]">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-md border border-border bg-muted text-primary">
              <User className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">
                {project.client?.user?.name || 'اسم العميل غير متوفر'}
              </h3>
              <span className="status-badge-neutral mt-1">عميل مشروع</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="flex size-8 items-center justify-center rounded-md bg-muted">
                <Phone className="size-4" />
              </div>
              {project.client?.user?.phone_number ? (
                <a href={`tel:${project.client.user.phone_number}`} className="text-sm font-medium text-primary hover:underline" dir="ltr">
                  {project.client.user.phone_number}
                </a>
              ) : (
                <span className="text-sm font-medium">غير متوفر</span>
              )}
            </div>

            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="flex size-8 items-center justify-center rounded-md bg-muted">
                <Mail className="size-4" />
              </div>
              {project.client?.user?.email ? (
                <a href={`mailto:${project.client.user.email}`} className="text-sm font-medium text-primary hover:underline">
                  {project.client.user.email}
                </a>
              ) : (
                <span className="text-sm font-medium">غير متوفر</span>
              )}
            </div>

            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="flex size-8 items-center justify-center rounded-md bg-muted">
                <MapPin className="size-4" />
              </div>
              <span className="text-sm font-medium text-foreground">{project.client?.user?.address || 'غير متوفر'}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-5 rounded-lg border border-border bg-card p-5 shadow-[var(--shadow-finance)]">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-md border border-border bg-muted text-success">
              <Building2 className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">تفاصيل التعاقد</h3>
              <p className="mt-1 text-sm text-muted-foreground">البيانات التعاقدية للمشروع</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="text-sm text-muted-foreground">القيمة المتوقعة</span>
              <span className="finance-num text-base font-semibold text-foreground">
                {project.expected_cost?.toLocaleString() || 0} ر.س
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">حالة المشروع</span>
              <span className={currentStatus.color}>{currentStatus.label}</span>
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
