import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { StageTimelineForm } from './stage-timeline.form';
import type { StageTimeline, CreateStageTimelinePayload } from '../stage-timelines.types';

type StageTimelineDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectStageId: number;
  timeline?: StageTimeline | null;
  onSubmit: (data: CreateStageTimelinePayload) => Promise<void>;
  loading?: boolean;
  onDelete?: () => void;
};

export function StageTimelineDialog({
  open,
  onOpenChange,
  projectStageId,
  timeline,
  onSubmit,
  loading,
}: StageTimelineDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] overflow-y-auto p-4 sm:max-h-[90dvh] sm:max-w-[600px] sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold mb-4">
            {timeline ? 'تعديل التفصيل الزمني' : 'إضافة تفصيل زمني جديد'}
          </DialogTitle>
        </DialogHeader>
          <StageTimelineForm
            projectStageId={projectStageId}
            timeline={timeline}
            onSubmit={onSubmit}
            loading={loading}
          />
      </DialogContent>
    </Dialog>
  );
}
