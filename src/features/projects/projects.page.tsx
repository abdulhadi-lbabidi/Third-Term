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
import { FolderKanban, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { SimplePagination } from '@/components/ui/pagination';
import { FilterDrawer } from '@/shared/components/ui/filter-drawer';
import { ProjectsFilterForm } from './components/projects-filter.form';
import { cn } from '@/shared/lib/utils';

export function ProjectsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const perPage = 50;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [clientId, setClientId] = useState<number | ''>('');
  const [departmentId, setDepartmentId] = useState<number | ''>('');
  const [status, setStatus] = useState<Project['status'] | ''>('');

  const [sort, setSort] = useState<string | undefined>(undefined);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, any>>({});

  const projectsQuery = useQuery<ProjectResponse>({
    queryKey: ['projects', page, perPage, appliedFilters, sort],
    queryFn: () => projectsApi.getProjects(page, perPage, {
      ...appliedFilters,
      sort: sort || undefined,
    }),
  });

  const departmentsQuery = useQuery<{ id: number; name: string }[]>({
    queryKey: ['departments'] as const,
    queryFn: () => projectsApi.getDepartments(),
    enabled: dialogOpen,
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

  const handleApplyFilters = () => {
    setAppliedFilters({
      'filter[search]': searchQuery || undefined,
      'filter[client_id]': clientId || undefined,
      'filter[department_id]': departmentId || undefined,
      'filter[status]': status || undefined,
    });
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setClientId('');
    setDepartmentId('');
    setStatus('');
    setAppliedFilters({});
    setPage(1);
    queryClient.invalidateQueries({
      queryKey: ['projects', 1, perPage, { sort: sort || undefined }],
    });
    queryClient.invalidateQueries({
      queryKey: ['projects', 1, perPage, { sort: undefined }],
    });
  };

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
        action={
          <div className="flex shrink-0 items-center gap-3">
            {(Object.values(appliedFilters).some(Boolean) || sort) ? (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => {
                  handleResetFilters();
                  setSort(undefined);
                }}
                aria-label="إعادة ضبط الفلاتر"
                title="إعادة ضبط الفلاتر"
              >
                <RotateCcw className="size-4" />
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              onClick={() => setFilterDrawerOpen(true)}
              className={cn(Object.values(appliedFilters).some(Boolean) && "border-primary text-primary")}
            >
              <SlidersHorizontal className="size-4" />
              فلترة متقدمة
            </Button>
            <Button onClick={handleCreate}>إضافة مشروع جديد</Button>
          </div>
        }
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
          navigate(`/projects/${project.id}/funds`);
        }}
        onView={(project) => {
          navigate(`/projects/${project.id}`);
        }}
        sort={sort}
        onSortChange={setSort}
      />

      <SimplePagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setPage}
        meta={meta}
      />

      <ProjectsDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        departments={departmentsQuery.data ?? []}
        project={selectedProject}
        onSubmit={handleSubmit}
        loading={saveMutation.isPending}
      />

      <FilterDrawer
        open={filterDrawerOpen}
        onOpenChange={setFilterDrawerOpen}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
      >
        <ProjectsFilterForm
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          clientId={clientId}
          setClientId={setClientId}
          departmentId={departmentId}
          setDepartmentId={setDepartmentId}
          status={status}
          setStatus={setStatus}
        />
      </FilterDrawer>
    </div>
  );
}
