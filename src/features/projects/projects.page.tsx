import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Button } from '@/shared/components/ui/button';
import { projectsApi, type ProjectResponse } from './projects.api';
import { ProjectsDialog } from './components/projects.dialog';
import { ProjectsTable } from './components/projects.table';
import type { CreateProjectPayload, Project } from './types';
import { PageHeader } from '../components/page-header';
import { FolderKanban } from 'lucide-react';
import { SimplePagination } from '@/components/ui/pagination';

export function ProjectsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const perPage = 50;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const projectsQuery = useQuery<ProjectResponse>({
    queryKey: ['projects', page, perPage],
    queryFn: () => projectsApi.getProjects(page, perPage),
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
      await queryClient.invalidateQueries({ queryKey: ['projects'] });
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
      await queryClient.invalidateQueries({ queryKey: ['projects'] });
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

  const projects = projectsQuery.data?.data ?? [];
  const meta = projectsQuery.data?.meta;
  const totalPages = meta?.last_page ?? 1;
  const currentPage = meta?.current_page ?? page;

  return (
    <div className="flex flex-col flex-1 space-y-4">
      <PageHeader
        badge="المشاريع"
        title="المشاريع"
        icon={FolderKanban}
        action={<Button onClick={handleCreate}>إضافة مشروع جديد</Button>}
      />

      <ProjectsTable
        data={projects}
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

      <SimplePagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setPage}
        meta={meta}
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
