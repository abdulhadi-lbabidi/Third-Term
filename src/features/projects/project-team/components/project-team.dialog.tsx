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
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {member ? 'تعديل بيانات العضو' : 'إضافة عضو جديد لفريق المشروع'}
          </DialogTitle>
        </DialogHeader>
        {open && (
          <ProjectTeamForm
            projectId={projectId}
            member={member}
            users={users}
            onSubmit={onSubmit}
            loading={loading}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
