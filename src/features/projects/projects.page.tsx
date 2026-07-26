import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Button } from '@/shared/components/ui/button';
import { projectsApi } from './projects.api';
import { ProjectsDialog } from './components/projects.dialog';
import { ProjectsTable } from './components/projects.table';
import type { CreateProjectPayload, Project } from './types';
import { PageHeader } from '../components/page-header';

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
      <PageHeader
        badge="المشاريع"
        title="المشاريع"
        action={
          <Button
            onClick={handleCreate}
            className="h-11 rounded-lg bg-slate-950 px-5 text-sm font-semibold shadow-sm hover:bg-slate-800"
          >
            إضافة مشروع جديد
          </Button>
        }
      />

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
        departments={departmentsQuery.data ?? []}
        onSubmit={handleSubmit}
        loading={saveMutation.isPending}
      />
    </div>
  );
}

