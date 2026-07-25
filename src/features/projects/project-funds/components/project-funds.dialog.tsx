import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { ProjectFundsForm } from './project-funds.form';
import type { CreateProjectFundPayload, ProjectFund } from '../project-funds/project-funds.types';
import type { Project } from '../types';

type ProjectFundsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project | null;
  projectFund?: ProjectFund | null;
  onSubmit: (data: CreateProjectFundPayload) => Promise<void>;
  loading?: boolean;
};

export function ProjectFundsDialog({
  open,
  onOpenChange,
  project,
  projectFund,
  onSubmit,
  loading,
}: ProjectFundsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{projectFund ? 'تعديل صندوق المشروع' : 'إضافة صندوق مشروع'}</DialogTitle>
        </DialogHeader>
        <ProjectFundsForm project={project} projectFund={projectFund} onSubmit={onSubmit} loading={loading} />
      </DialogContent>
    </Dialog>
  );
}
