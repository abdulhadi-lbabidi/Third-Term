import { useParams, useSearchParams } from 'react-router-dom';
import { Wallet, User, Cloud, Pencil, Users, Layers, Receipt } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { projectsApi } from '../projects.api';
import { ProjectsDialog } from '../components/projects.dialog';
import type { Project, CreateProjectPayload } from '../types';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { ProjectFinancialsTab } from './components/project-financials-tab';
import { ProjectClientTab } from './components/project-client-tab';
import { PageHeader } from '../../components/page-header';
import { ProjectCloudStorageTab } from './components/project-cloud-storage-tab';
import { ProjectTeamTab } from './components/project-team-tab';
import { ProjectStagesTab } from './components/project-stages-tab';
import { ProjectFundsPage } from '../project-funds/project-funds.page';

const PROJECT_TABS = [
  { value: 'funds', label: 'الصناديق', icon: <Wallet className="h-4 w-4" /> },
  { value: 'cloud', label: 'التخزين السحابي', icon: <Cloud className="h-4 w-4" /> },
  { value: 'financials', label: 'المالية', icon: <Receipt className="h-4 w-4" /> },
  { value: 'stages', label: 'المراحل', icon: <Layers className="h-4 w-4" /> },
  { value: 'client', label: 'العميل', icon: <User className="h-4 w-4" /> },
  { value: 'team', label: 'فريق العمل', icon: <Users className="h-4 w-4" /> },
];

export function ProjectDetailsPage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();

  const projectId = Number(params.projectId || '');
  const projectName = params.projectName ? decodeURIComponent(params.projectName) : '';

  const [dialogOpen, setDialogOpen] = useState(false);

  // Determine active tab from URL param; fall back to 'cloud' when dirId present
  const activeTab = searchParams.get('tab') ?? (searchParams.has('dirId') ? 'cloud' : 'financials');

  const projectsQuery = useQuery<Project>({
    queryKey: ['projects', projectId] as const,
    queryFn: () => projectsApi.getProjectById(projectId),
  });

  const departmentsQuery = useQuery<{ id: number; name: string }[]>({
    queryKey: ['departments'] as const,
    queryFn: () => projectsApi.getDepartments(),
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: CreateProjectPayload) => {
      return projectsApi.updateProject(projectId, payload);
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

  return (
    <div className="space-y-5">
      <PageHeader
        badge="تفاصيل المشروع"
        title={projectName || currentProject?.name || <Skeleton className="h-8 w-48 inline-block align-middle" />}
        tabs={PROJECT_TABS}
        defaultTab={searchParams.has('dirId') ? 'cloud' : 'financials'}
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
        {activeTab === 'funds' && <ProjectFundsPage />}
        {activeTab === 'cloud' && <ProjectCloudStorageTab project={currentProject} />}
        {activeTab === 'financials' && <ProjectFinancialsTab project={currentProject} />}
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
