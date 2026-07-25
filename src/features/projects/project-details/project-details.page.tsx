import { useParams, useNavigate } from 'react-router-dom';
import { Wallet, User, Cloud } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/shared/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { projectsApi } from '../projects.api';
import type { Project } from '../types';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { ProjectFinancialsTab } from './components/project-financials-tab';
import { ProjectClientTab } from './components/project-client-tab';
import { ProjectCloudStorageTab } from './components/project-cloud-storage-tab';

export function ProjectDetailsPage() {
  const navigate = useNavigate();
  const params = useParams();
  const projectId = Number(params.projectId || '');
  const projectName = params.projectName ? decodeURIComponent(params.projectName) : '';

  const projectsQuery = useQuery<Project>({
    queryKey: ['projects', projectId] as const,
    queryFn: () => projectsApi.getProjectById(projectId),
  });

  const currentProject = projectsQuery.data ?? null;

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-slate-200/80 bg-white p-3 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
              تفاصيل المشروع
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
              {projectName || currentProject?.name || <Skeleton className="h-8 w-48 inline-block align-middle" />}
            </h1>
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/projects')}
              className="h-11 rounded-2xl border-slate-200 px-5 text-sm font-semibold"
            >
              العودة إلى المشاريع
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200/80 p-4 rounded-lg shadow-sm">
        <Tabs defaultValue="financials" className="w-full">
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
    </div>
  );
}
