import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FolderKanban } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { PageHeader } from '@/features/components/page-header';
import { projectsApi } from '../projects.api';
import type { Project } from '../types';
import { ProjectStagesTab } from '../project-details/components/project-stages-tab';
// import { ProjectStagesTab } from './components/project-stages-tab';

export function ProjectStagesPage() {
  const navigate = useNavigate();
  const params = useParams();

  const projectId = Number(params.projectId || '');
  const projectName = params.projectName ? decodeURIComponent(params.projectName) : '';

  // ── Data fetching ──────────────────────────────────────────────
  const projectQuery = useQuery<Project>({
    queryKey: ['projects', projectId] as const,
    queryFn: () => projectsApi.getProjectById(projectId),
    enabled: Number.isFinite(projectId) && projectId > 0,
  });

  const currentProject = projectQuery.data ?? null;

  return (
    <div className="space-y-5 p-6 h-full flex flex-col">
      <PageHeader
        badge="المشاريع"
        icon={FolderKanban}
        title={
          projectName ||
          currentProject?.name || (
            <Skeleton className="h-8 w-48 inline-block align-middle" />
          )
        }
        description="تفاصيل مراحل المشروع وتحديثاته الزمنية"
        action={
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(-1)}

          >
            العودة
          </Button>
        }
      />

      <div className="flex-1">
        <ProjectStagesTab projectId={projectId} />
      </div>
    </div>
  );
}
