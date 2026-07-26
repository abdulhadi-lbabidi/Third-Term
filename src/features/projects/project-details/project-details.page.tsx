import { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Wallet, User, Cloud, Pencil } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Button } from '@/shared/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { projectsApi } from '../projects.api';
import { ProjectsDialog } from '../components/projects.dialog';
import type { Project, CreateProjectPayload } from '../types';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { ProjectFinancialsTab } from './components/project-financials-tab';
import { ProjectClientTab } from './components/project-client-tab';
import { PageHeader } from '../../components/page-header';
import { ProjectCloudStorageTab } from './components/project-cloud-storage-tab';

export function ProjectDetailsPage() {
  const navigate = useNavigate();
  const params = useParams();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const projectId = Number(params.projectId || '');
  const projectName = params.projectName ? decodeURIComponent(params.projectName) : '';

  const [dialogOpen, setDialogOpen] = useState(false);
  const defaultTab = searchParams.has('dirId') ? 'cloud' : 'financials';

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
        action={
          <div className="flex gap-3">
            <Button
              type="button"
              variant="default"
              onClick={() => setDialogOpen(true)}
              className="h-11 rounded-lg bg-slate-950 px-5 text-sm font-semibold shadow-sm hover:bg-slate-800 gap-2"
            >
              <Pencil className="size-4" />
              تعديل بيانات المشروع
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/projects')}
              className="h-11 rounded-2xl border-slate-200 px-5 text-sm font-semibold"
            >
              العودة إلى المشاريع
            </Button>
          </div>
        }
      />

      <div className="bg-white border border-slate-200/80 p-4 rounded-lg shadow-sm">
        <Tabs 
          defaultValue={defaultTab} 
          className="w-full"
          onValueChange={(val) => {
            if (val !== 'cloud') {
              searchParams.delete('dirId');
              setSearchParams(searchParams);
            }
          }}
        >
          <TabsList className="mb-4">
            <TabsTrigger value="financials" className="gap-2">
              <Wallet className="h-4 w-4" />
              المالية والصناديق
            </TabsTrigger>
            <TabsTrigger value="client" className="gap-2">
              <User className="h-4 w-4" />
              العميل
            </TabsTrigger>
            <TabsTrigger value="cloud" className="gap-2">
              <Cloud className="h-4 w-4" />
              التخزين السحابي
            </TabsTrigger>
          </TabsList>

          <TabsContent value="financials" className="mt-0">
            <ProjectFinancialsTab project={currentProject} />
          </TabsContent>

          <TabsContent value="client" className="mt-0">
            <ProjectClientTab project={currentProject} />
          </TabsContent>

          <TabsContent value="cloud" className="mt-0">
            <ProjectCloudStorageTab project={currentProject} />
          </TabsContent>
        </Tabs>
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

