import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import { projectsApi } from './projects.api';
import { ProjectsDialog } from './components/projects.dialog';
import { ProjectsTable } from './components/projects.table';
import { usersApi } from '@/features/users/api/users.api';
import type { ClientRecord } from '@/features/users/types';
import type { CreateProjectPayload, Project } from './types';

const projectsQueryKeys = {
  all: ['projects'] as const,
};

export function ProjectsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const projectsQuery = useQuery<Project[]>({
    queryKey: projectsQueryKeys.all,
    queryFn: () => projectsApi.getProjects(),
  });

  const clientsQuery = useQuery<ClientRecord[]>({
    queryKey: ['clients'] as const,
    queryFn: () => usersApi.getUsersByRole('client') as Promise<ClientRecord[]>,
  });

  const departmentsQuery = useQuery<{ id: number; name: string }[]>({
    queryKey: ['departments'] as const,
    queryFn: () => projectsApi.getDepartments(),
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: CreateProjectPayload) => {
      if (selectedProject) {
        return projectsApi.updateProject(selectedProject.id, payload);
      }
      return projectsApi.createProject(payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: projectsQueryKeys.all });
      setDialogOpen(false);
      setSelectedProject(null);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'حدث خطأ أثناء حفظ المشروع');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (project: Project) => projectsApi.deleteProject(project.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: projectsQueryKeys.all });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'حدث خطأ أثناء حذف المشروع');
    },
  });

  const handleSubmit = async (payload: CreateProjectPayload) => {
    await saveMutation.mutateAsync(payload);
    toast.success(selectedProject ? 'تم تعديل المشروع بنجاح' : 'تم إنشاء المشروع بنجاح');
  };

  const handleDelete = async (project: Project) => {
    await deleteMutation.mutateAsync(project);
    toast.success('تم حذف المشروع بنجاح');
  };

  const handleCreate = () => {
    setSelectedProject(null);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-slate-200/80 bg-white p-3 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
              المشاريع
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">المشاريع</h1>
          </div>
          <Button
            onClick={handleCreate}
            className="h-11 rounded-lg bg-slate-950 px-5 text-sm font-semibold shadow-sm hover:bg-slate-800"
          >
            إضافة مشروع جديد
          </Button>
        </div>
      </div>

      <ProjectsTable
        data={Array.isArray(projectsQuery.data) ? projectsQuery.data : []}
        loading={projectsQuery.isLoading}
        onEdit={(project) => {
          setSelectedProject(project);
          setDialogOpen(true);
        }}
        onDelete={handleDelete}
        onAddFund={(project) => {
          navigate(`/projects/${project.id}/${encodeURIComponent(project.name)}/funds`);
        }}
        onView={(project) => {
          navigate(`/projects/${project.id}/${encodeURIComponent(project.name)}`);
        }}
      />

      <ProjectsDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setSelectedProject(null);
        }}
        project={selectedProject}
        clients={clientsQuery.data ?? []}
        departments={departmentsQuery.data ?? []}
        onSubmit={handleSubmit}
        loading={saveMutation.isPending}
      />
    </div>
  );
}
