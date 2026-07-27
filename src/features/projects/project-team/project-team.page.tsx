import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Users } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { usersApi } from '@/features/users/api/users.api';
import type { EmployeeRecord } from '@/features/users/types';
import { PageHeader } from '../../components/page-header';
import { projectsApi } from '../projects.api';
import type { Project } from '../types';
import { projectTeamApi } from './project-team.api';
import { ProjectTeamTable } from './components/project-team.table';
import { ProjectTeamDialog } from './components/project-team.dialog';
import type { ProjectTeamMember } from './project-team.types';

const QUERY_KEY = ['project-team'] as const;

export function ProjectTeamPage() {
  const navigate = useNavigate();
  const params = useParams();
  const queryClient = useQueryClient();

  const projectId = Number(params.projectId || '');
  const projectName = params.projectName ? decodeURIComponent(params.projectName) : '';

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<ProjectTeamMember | null>(null);

  // ── Data fetching ──────────────────────────────────────────────
  const projectQuery = useQuery<Project>({
    queryKey: ['projects', projectId] as const,
    queryFn: () => projectsApi.getProjectById(projectId),
    enabled: Number.isFinite(projectId) && projectId > 0,
  });

  const teamQuery = useQuery<ProjectTeamMember[]>({
    queryKey: QUERY_KEY,
    queryFn: () => projectTeamApi.getAll(),
  });

  const employeesQuery = useQuery<EmployeeRecord[]>({
    queryKey: ['employees'] as const,
    queryFn: () => usersApi.getUsersByRole('employee') as Promise<EmployeeRecord[]>,
  });

  const members = (teamQuery.data ?? []).filter((m) => m.project?.id === projectId);

  const userOptions = (employeesQuery.data ?? []).map((e) => ({
    id: e.user.id,
    name: e.user?.name ?? `موظف #${e.id}`,
  }));

  const currentProject = projectQuery.data ?? null;

  // ── Mutations ──────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: async (payload: { name: string; user_ids: number[]; project_id: number; }) => {
      if (selectedMember) {
        return projectTeamApi.update(selectedMember.id, {
          name: payload.name,
          project_id: payload.project_id,
          user_id: payload.user_ids[0],
        });
      }

      const promises = payload.user_ids.map(userId =>
        projectTeamApi.create({
          name: payload.name,
          project_id: payload.project_id,
          user_id: userId,
        })
      );

      return Promise.all(promises);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      setDialogOpen(false);
      setSelectedMember(null);
      toast.success(selectedMember ? 'تم تعديل بيانات العضو بنجاح' : 'تم إضافة الأعضاء بنجاح');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'حدث خطأ أثناء حفظ بيانات العضو');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (member: ProjectTeamMember) => projectTeamApi.delete(member.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('تم حذف العضو من فريق المشروع بنجاح');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'حدث خطأ أثناء حذف العضو');
    },
  });

  return (
    <div className="space-y-5">
      <PageHeader
        badge="المشاريع"
        title={
          projectName ||
          currentProject?.name || (
            <Skeleton className="h-8 w-48 inline-block align-middle" />
          )
        }
        action={
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
              className="h-11 rounded-lg border-slate-200 px-5 text-sm font-semibold"
            >
              العودة
            </Button>
            <Button
              type="button"
              onClick={() => {
                setSelectedMember(null);
                setDialogOpen(true);
              }}
              className="h-11 rounded-lg bg-slate-950 px-5 text-sm font-semibold shadow-sm hover:bg-slate-800 gap-2"
            >
              <Users className="size-4" />
              إضافة عضو جديد
            </Button>
          </div>
        }
      />

      <ProjectTeamTable
        data={members}
        loading={teamQuery.isLoading}
        onEdit={(member) => {
          setSelectedMember(member);
          setDialogOpen(true);
        }}
        onDelete={(member) => deleteMutation.mutate(member)}
      />

      <ProjectTeamDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setSelectedMember(null);
        }}
        projectId={projectId}
        member={selectedMember}
        users={userOptions}
        onSubmit={async (payload) => {
          await saveMutation.mutateAsync(payload);
        }}
        loading={saveMutation.isPending}
      />
    </div>
  );
}
