import { useParams, useSearchParams } from 'react-router-dom';
import { Wallet, User, Cloud, Pencil, Users, Layers, FolderKanban, CircleDollarSign, Clock, PlayCircle, CheckCircle2, XCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { projectsApi } from '../projects.api';
import { ProjectsDialog } from '../components/projects.dialog';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { ProjectClientTab } from './components/project-client-tab';
import { PageHeader } from '../../components/page-header';
import { ProjectCloudStorageTab } from './components/project-cloud-storage-tab';
import { ProjectTeamTab } from './components/project-team-tab';
import { ProjectFundsPage } from '../project-funds/project-funds.page';
import { ProjectStagesTab } from './components/project-stages-tab';
import type { Project, ProjectFormPayload } from '../types';
import toast from 'react-hot-toast';

const PROJECT_TABS = [
  { value: 'funds', label: 'المالية', icon: <Wallet className="h-4 w-4" /> },
  { value: 'cloud', label: 'التخزين السحابي', icon: <Cloud className="h-4 w-4" /> },
  { value: 'stages', label: 'المراحل', icon: <Layers className="h-4 w-4" /> },
  { value: 'client', label: 'العميل', icon: <User className="h-4 w-4" /> },
  { value: 'team', label: 'فريق العمل', icon: <Users className="h-4 w-4" /> },
];

const PROJECT_STATUS = {
  pending: { label: 'قيد الانتظار', icon: Clock, color: 'text-muted-foreground' },
  in_progress: { label: 'قيد التنفيذ', icon: PlayCircle, color: 'text-info' },
  completed: { label: 'مكتمل', icon: CheckCircle2, color: 'text-success' },
  cancelled: { label: 'ملغى', icon: XCircle, color: 'text-destructive' },
} as const;

export function ProjectDetailsPage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();

  const projectId = Number(params.projectId || '');
  const projectName = params.projectName ? decodeURIComponent(params.projectName) : '';

  const [dialogOpen, setDialogOpen] = useState(false);

  // Determine active tab from URL param; fall back to 'cloud' when dirId present
  const activeTab = searchParams.get('tab') ?? (searchParams.has('dirId') ? 'cloud' : 'funds');

  const projectsQuery = useQuery<Project>({
    queryKey: ['projects', projectId] as const,
    queryFn: () => projectsApi.getProjectById(projectId),
  });

  const departmentsQuery = useQuery<{ id: number; name: string }[]>({
    queryKey: ['departments'] as const,
    queryFn: () => projectsApi.getDepartments(),
    enabled: dialogOpen,
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: ProjectFormPayload) => {
      const { department_ids: selectedDepartmentIds, ...projectFields } = payload;
      const departmentIds = selectedDepartmentIds?.length
        ? selectedDepartmentIds
        : [payload.department_id];
      const updatedProject = await projectsApi.updateProject(projectId, {
        ...projectFields,
        department_id: departmentIds[0],
      });
      const currentDepartmentIds = (projectsQuery.data?.departments ?? []).map((department) => department.id);
      const departmentsToAttach = departmentIds.filter((id) => !currentDepartmentIds.includes(id));
      const departmentsToDetach = currentDepartmentIds.filter((id) => !departmentIds.includes(id));
      if (departmentsToAttach.length) {
        await projectsApi.attachDepartments(projectId, departmentsToAttach);
      }
      if (departmentsToDetach.length) {
        await projectsApi.detachDepartments(projectId, departmentsToDetach);
      }
      return updatedProject;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
      await queryClient.invalidateQueries({ queryKey: ['projects'] });
      setDialogOpen(false);
      toast.success('تم تعديل بيانات المشروع بنجاح');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'حدث خطأ أثناء حفظ المشروع');
    },
  });

  const currentProject = projectsQuery.data ?? null;
  const status = currentProject ? PROJECT_STATUS[currentProject.status] : null;

  return (
    <div className="space-y-5">
      <PageHeader
        description={currentProject ? (
          <div className="flex flex-wrap gap-1.5">
            {currentProject.departments?.length ? currentProject.departments.map((department) => (
              <Badge key={department.id} variant="secondary">{department.name}</Badge>
            )) : (
              <Badge variant="secondary">{currentProject.department?.name ?? 'لا يتبع لأي قسم'}</Badge>
            )}
          </div>
        ) : undefined}
        icon={FolderKanban}
        title={projectName || currentProject?.name || <Skeleton className="h-8 w-48 inline-block align-middle" />}
        tabs={PROJECT_TABS}
        defaultTab={searchParams.has('dirId') ? 'cloud' : 'funds'}
        stats={currentProject ? [
          {
            label: 'التكلفة المتوقعة',
            value: currentProject.expected_cost.toLocaleString(),
            icon: <CircleDollarSign className="size-4" />,
          },
          {
            label: 'الحالة',
            value: status?.label,
            icon: status ? <status.icon className={`size-4 ${status.color}`} /> : undefined,
          },
        ] : undefined}
        action={
          <div className="flex gap-3">
            <Button type="button" variant="default" onClick={() => setDialogOpen(true)}>
              <Pencil className="size-4" />
              تعديل بيانات المشروع
            </Button>
          </div>
        }
      />

      <div className="surface-panel p-4 sm:p-5">
        {activeTab === 'funds' && <ProjectFundsPage isTab projectData={currentProject} />}
        {activeTab === 'cloud' && <ProjectCloudStorageTab project={currentProject} />}
        {activeTab === 'stages' && <ProjectStagesTab projectId={projectId} />}
        {activeTab === 'client' && <ProjectClientTab project={currentProject} />}
        {activeTab === 'team' && <ProjectTeamTab projectId={projectId} />}
      </div>

      <ProjectsDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        project={currentProject}
        departments={departmentsQuery.data ?? []}
        onSubmit={async (payload) => {
          await saveMutation.mutateAsync(payload);
        }}
        loading={saveMutation.isPending}
      />
    </div>
  );
}
