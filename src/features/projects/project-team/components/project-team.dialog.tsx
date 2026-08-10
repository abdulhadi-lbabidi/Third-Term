import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { ProjectTeamForm, type UserOption } from './project-team.form';
import type { ProjectTeamMember } from '../project-team.types';

type ProjectTeamDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
  member?: ProjectTeamMember | null;
  users: UserOption[];
  onSubmit: (data: { name: string; user_ids: number[]; project_id: number; }) => Promise<void>;
  loading?: boolean;
};

export function ProjectTeamDialog({
  open,
  onOpenChange,
  projectId,
  member,
  users,
  onSubmit,
  loading,
}: ProjectTeamDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] overflow-y-auto p-4 sm:max-h-[90dvh] sm:max-w-xl sm:p-6">
        <DialogHeader className="pe-6">
          <DialogTitle>
            {member ? 'تعديل بيانات العضو' : 'إضافة عضو جديد لفريق المشروع'}
          </DialogTitle>
        </DialogHeader>
          <ProjectTeamForm
            projectId={projectId}
            member={member}
            users={users}
            onSubmit={onSubmit}
            loading={loading}
          />
      </DialogContent>
    </Dialog>
  );
}
