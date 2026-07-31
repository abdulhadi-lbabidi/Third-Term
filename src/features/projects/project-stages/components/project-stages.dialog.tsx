import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { ProjectStagesForm } from './project-stages.form';
import type { ProjectStage, CreateProjectStagePayload } from '../project-stages.types';

type ProjectStagesDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
  stage?: ProjectStage | null;
  onSubmit: (data: CreateProjectStagePayload) => Promise<void>;
  loading?: boolean;
};

export function ProjectStagesDialog({
  open,
  onOpenChange,
  projectId,
  stage,
  onSubmit,
  loading,
}: ProjectStagesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold mb-4">
            {stage ? 'تعديل المرحلة' : 'إضافة مرحلة جديدة'}
          </DialogTitle>
        </DialogHeader>
        {open && (
          <ProjectStagesForm
            projectId={projectId}
            stage={stage}
            onSubmit={onSubmit}
            loading={loading}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
