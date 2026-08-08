import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Users } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { usersApi } from '@/features/users/api/users.api';
import { projectTeamApi } from '@/features/projects/project-team/project-team.api';
import { ProjectTeamTable } from '@/features/projects/project-team/components/project-team.table';
import { ProjectTeamDialog } from '@/features/projects/project-team/components/project-team.dialog';
import type { ProjectTeamMember } from '@/features/projects/project-team/project-team.types';

type ProjectTeamTabProps = {
  projectId: number;
  userRole?: string;
};

export function ProjectTeamTab({ projectId, userRole }: ProjectTeamTabProps) {
  const queryClient = useQueryClient();
  const canManage = ['engineer', 'employee'].includes(userRole || '');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<ProjectTeamMember | null>(null);

  const teamQuery = useQuery<ProjectTeamMember[]>({
    queryKey: ['project-team', projectId],
    queryFn: () => projectTeamApi.getAll({
      project_id: projectId,
      paginate: true,
      per_page: 50,
      page: 1,
    }),
  });

  const employeesQuery = useQuery({
    queryKey: ['employees'] as const,
    queryFn: async () => {
      const res = await usersApi.getUsersByRole('employee');
      return (res as any)?.data ?? res;
    },
    enabled: dialogOpen && canManage,
  });

  const members = (teamQuery.data ?? []).filter((m) => m.project?.id === projectId);
  const existingUserIds = new Set(members.map(m => m.user?.id));

  const userOptions = ((employeesQuery.data ?? []) as any[])
    .filter((e: any) => !existingUserIds.has(e.user?.id) || e.user?.id === selectedMember?.user?.id)
    .map((e: any) => ({
      id: e.user.id,
      name: e.user?.name ?? `موظف #${e.id}`,
      type: 'employee' as const,
    }));

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
      await queryClient.invalidateQueries({ queryKey: ['project-team', projectId] });
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
      await queryClient.invalidateQueries({ queryKey: ['project-team', projectId] });
      toast.success('تم حذف العضو من فريق المشروع بنجاح');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'حدث خطأ أثناء حذف العضو');
    },
  });

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">فريق العمل</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            إدارة أعضاء الفريق المرتبطين بهذا المشروع ({members.length} عضو)
          </p>
        </div>
        {canManage && (
          <Button
            type="button"
            onClick={handleAdd}
          >
            <Users className="size-4" />
            إضافة عضو جديد
          </Button>
        )}
      </div>

      <ProjectTeamTable
        data={members}
        loading={teamQuery.isLoading}
        onEdit={canManage ? handleEdit : undefined}
        onDelete={canManage ? (member) => deleteMutation.mutate(member) : undefined}
      />

      {canManage && (
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
      )}
    </div>
  );
}
