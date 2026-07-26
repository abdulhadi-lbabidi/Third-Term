import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import { currenciesApi } from '@/features/currencies/currencies.api';
import type { Currency } from '@/features/currencies/types';
import { PageHeader } from '../../components/page-header';
import { projectsApi } from '../projects.api';
import type { Project } from '../types';
import { projectFundsApi } from './project-funds.api';
import type { CreateProjectFundPayload, ProjectFund } from './project-funds.types';
import { ProjectFundsTable } from '../project-funds/components/project-funds.table';
import { ProjectFundsDialog } from '../project-funds/components/project-funds.dialog';
import { AttachCurrencyDialog } from '../project-funds/components/attach-currency.dialog';

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
    queryFn: () => currenciesApi.getAll(),
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
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'حدث خطأ أثناء حفظ الصندوق');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (fund: ProjectFund) => projectFundsApi.deleteProjectFund(fund.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: projectFundsQueryKeys.all });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'حدث خطأ أثناء حذف الصندوق');
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
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'حدث خطأ أثناء إضافة الرصيد الافتتاحي');
    },
  });

  const projectsList = Array.isArray(projectQuery.data) ? projectQuery.data : [];
  const currentProject = projectsList.find((item) => item.id === projectId) ?? null;

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
      <PageHeader
        badge="المشاريع"
        title={projectName || currentProject?.name || 'صناديق المشروع'}
        action={
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/projects')}
              className="h-11 rounded-lg border-slate-200 px-5 text-sm font-semibold"
            >
              العودة إلى المشاريع
            </Button>
            <Button
              type="button"
              onClick={() => {
                setSelectedProjectFund(null);
                setDialogOpen(true);
              }}
              className="h-11 rounded-lg bg-slate-950 px-5 text-sm font-semibold shadow-sm hover:bg-slate-800"
            >
              إضافة صندوق جديد
            </Button>
          </div>
        }
      />

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
