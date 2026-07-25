import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import { currenciesApi } from '@/features/currencies/currencies.api';
import type { Currency } from '@/features/currencies/types';
import { projectsApi } from './projects.api';
import type { Project } from './types';
import { projectFundsApi } from './project-funds.api';
import type { CreateProjectFundPayload, ProjectFund } from './project-funds.types';
import { ProjectFundsTable } from './components/project-funds.table';
import { ProjectFundsDialog } from './components/project-funds.dialog';
import { AttachCurrencyDialog } from './components/attach-currency.dialog';

const projectFundsQueryKeys = {
  all: ['project-funds'] as const,
};

export function ProjectFundsPage() {
  const navigate = useNavigate();
  const params = useParams();
  const queryClient = useQueryClient();
  const projectId = Number(params.projectId || '');
  const projectName = params.projectName ? decodeURIComponent(params.projectName) : '';
  const hasProjectId = Number.isFinite(projectId) && projectId > 0;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [attachDialogOpen, setAttachDialogOpen] = useState(false);
  const [selectedProjectFund, setSelectedProjectFund] = useState<ProjectFund | null>(null);

  const projectQuery = useQuery<Project[]>({
    queryKey: ['projects'] as const,
    queryFn: () => projectsApi.getProjects(),
  });

  const projectFundsQuery = useQuery<ProjectFund[]>({
    queryKey: projectFundsQueryKeys.all,
    queryFn: () => projectFundsApi.getProjectFunds(),
  });

  const currenciesQuery = useQuery<Currency[]>({
    queryKey: ['currencies'] as const,
    queryFn: () => currenciesApi.getCurrencies(),
  });

  const visibleProjectFunds = (projectFundsQuery.data ?? []).filter((fund) => fund.project?.id === projectId);

  const saveMutation = useMutation({
    mutationFn: async (payload: CreateProjectFundPayload) => {
      if (selectedProjectFund) {
        return projectFundsApi.updateProjectFund(selectedProjectFund.id, { name: payload.name });
      }
      return projectFundsApi.createProjectFund(payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: projectFundsQueryKeys.all });
      setDialogOpen(false);
      setSelectedProjectFund(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (fund: ProjectFund) => projectFundsApi.deleteProjectFund(fund.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: projectFundsQueryKeys.all });
    },
  });

  const attachMutation = useMutation({
    mutationFn: async (payload: { currency_id: number; balance: string }) => {
      if (!selectedProjectFund) throw new Error('صندوق المشروع غير محدد');
      return projectFundsApi.attachCurrency(selectedProjectFund.id, payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: projectFundsQueryKeys.all });
      setAttachDialogOpen(false);
      setSelectedProjectFund(null);
    },
  });

  const currentProject = projectQuery.data?.find((item) => item.id === projectId) ?? null;

  const handleSubmit = async (payload: CreateProjectFundPayload) => {
    const finalPayload: CreateProjectFundPayload = {
      project_id: hasProjectId ? projectId : payload.project_id,
      name: payload.name,
    };

    await saveMutation.mutateAsync(finalPayload);
    toast.success(selectedProjectFund ? 'تم تعديل الصندوق بنجاح' : 'تم إنشاء الصندوق بنجاح');
  };

  const handleDelete = async (fund: ProjectFund) => {
    await deleteMutation.mutateAsync(fund);
    toast.success('تم حذف الصندوق بنجاح');
  };

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-slate-200/80 bg-white p-3 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
              المشاريع
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
              {projectName || currentProject?.name || 'صناديق المشروع'}
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
            <Button
              type="button"
              onClick={() => {
                setSelectedProjectFund(null);
                setDialogOpen(true);
              }}
              className="h-11 rounded-2xl bg-slate-950 px-5 text-sm font-semibold shadow-sm hover:bg-slate-800"
            >
              إضافة صندوق جديد
            </Button>
          </div>
        </div>
      </div>

      <ProjectFundsTable
        data={visibleProjectFunds}
        loading={projectFundsQuery.isLoading}
        onEdit={(fund) => {
          setSelectedProjectFund(fund);
          setDialogOpen(true);
        }}
        onDelete={handleDelete}
        onAttachCurrency={(fund) => {
          setSelectedProjectFund(fund);
          setAttachDialogOpen(true);
        }}
      />

      <ProjectFundsDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setSelectedProjectFund(null);
        }}
        project={currentProject ?? undefined}
        projectFund={selectedProjectFund}
        onSubmit={handleSubmit}
        loading={saveMutation.isPending}
      />

      <AttachCurrencyDialog
        open={attachDialogOpen}
        onOpenChange={(open) => {
          setAttachDialogOpen(open);
          if (!open) setSelectedProjectFund(null);
        }}
        currencies={currenciesQuery.data ?? []}
        onSubmit={async (payload) => {
          await attachMutation.mutateAsync(payload);
          toast.success('تم ربط العملة بالصندوق بنجاح');
        }}
        loading={attachMutation.isPending}
      />
    </div>
  );
}
