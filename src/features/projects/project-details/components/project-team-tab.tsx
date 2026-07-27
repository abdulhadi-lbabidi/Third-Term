import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Users } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { usersApi } from '@/features/users/api/users.api';
import type { EmployeeRecord } from '@/features/users/types';
import { projectTeamApi } from '../../project-team/project-team.api';
import { ProjectTeamTable } from '../../project-team/components/project-team.table';
import { ProjectTeamDialog } from '../../project-team/components/project-team.dialog';
import type { ProjectTeamMember, CreateProjectTeamPayload } from '../../project-team/project-team.types';

const QUERY_KEY = ['project-team'] as const;

type ProjectTeamTabProps = {
  projectId: number;
};

export function ProjectTeamTab({ projectId }: ProjectTeamTabProps) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<ProjectTeamMember | null>(null);

  // ── Data fetching ──────────────────────────────────────────────
  const teamQuery = useQuery<ProjectTeamMember[]>({
    queryKey: QUERY_KEY,
    queryFn: () => projectTeamApi.getAll(),
  });

  const employeesQuery = useQuery<EmployeeRecord[]>({
    queryKey: ['employees'] as const,
    queryFn: () => usersApi.getUsersByRole('employee') as Promise<EmployeeRecord[]>,
  });

  // Filter by current project
  const members = (teamQuery.data ?? []).filter((m) => m.project?.id === projectId);

  // Map employees to simple options for the form
  const userOptions = (employeesQuery.data ?? []).map((e) => ({
    id: e.user.id,
    name: e.user?.name ?? `موظف #${e.id}`,
  }));

  // ── Mutations ──────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: async (payload: CreateProjectTeamPayload) => {
      if (selectedMember) {
        return projectTeamApi.update(selectedMember.id, payload);
      }
      return projectTeamApi.create(payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      setDialogOpen(false);
      setSelectedMember(null);
      toast.success(selectedMember ? 'تم تعديل بيانات العضو بنجاح' : 'تمت إضافة العضو بنجاح');
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

  // ── Handlers ───────────────────────────────────────────────────
  const handleEdit = (member: ProjectTeamMember) => {
    setSelectedMember(member);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setSelectedMember(null);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Sub-header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">فريق العمل</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            إدارة أعضاء الفريق المرتبطين بهذا المشروع ({members.length} عضو)
          </p>
        </div>
        <Button
          type="button"
          onClick={handleAdd}
          className="h-10 rounded-lg bg-slate-950 px-4 text-sm font-semibold shadow-sm hover:bg-slate-800 gap-2"
        >
          <Users className="size-4" />
          إضافة عضو جديد
        </Button>
      </div>

      {/* Table */}
      <ProjectTeamTable
        data={members}
        loading={teamQuery.isLoading}
        onEdit={handleEdit}
        onDelete={(member) => deleteMutation.mutate(member)}
      />

      {/* Dialog */}
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
