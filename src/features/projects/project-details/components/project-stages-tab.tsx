import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { projectStagesApi } from '../../project-stages/project-stages.api';
import { stageTimelinesApi } from '../../stage-timelines/stage-timelines.api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/shared/components/ui/dialog';
import { ProjectStagesDialog } from '../../project-stages/components/project-stages.dialog';
import { ProjectStagesTimeline } from '../../stage-timelines/components/project-stages-timeline';
import { StageTimelineDialog } from '../../stage-timelines/components/stage-timeline.dialog';
import type {
  ProjectStage,
  CreateProjectStagePayload,
} from '../../project-stages/project-stages.types';
import type {
  StageTimeline,
  CreateStageTimelinePayload
} from '../../stage-timelines/stage-timelines.types';

type ProjectStagesTabProps = {
  projectId: number;
};

export function ProjectStagesTab({ projectId }: ProjectStagesTabProps) {
  const queryClient = useQueryClient();

  // Stages state
  const [stageDialogOpen, setStageDialogOpen] = useState(false);
  const [selectedStage, setSelectedStage] = useState<ProjectStage | null>(null);

  // Timelines state
  const [timelineDialogOpen, setTimelineDialogOpen] = useState(false);
  const [selectedStageId, setSelectedStageId] = useState<number | null>(null);
  const [selectedTimeline, setSelectedTimeline] = useState<StageTimeline | null>(null);
  const [parentStageForTimeline, setParentStageForTimeline] = useState<ProjectStage | null>(null);

  // Delete confirmations
  const [stageToDelete, setStageToDelete] = useState<ProjectStage | null>(null);
  const [timelineToDelete, setTimelineToDelete] = useState<StageTimeline | null>(null);

  // ── Data fetching ──────────────────────────────────────────────
  const stagesQuery = useQuery<ProjectStage[]>({
    queryKey: ['project-stages', projectId],
    queryFn: () => projectStagesApi.getAll({
      'filter[project_id]': projectId,
      paginate: true,
      per_page: 5,
      page: 1,
    }),
  });

  const timelinesQuery = useQuery<StageTimeline[]>({
    queryKey: ['stage-timelines', selectedStageId],
    queryFn: () => stageTimelinesApi.getAll({ project_stage_id: selectedStageId }),
    enabled: selectedStageId !== null,
  });

  // Combine data
  const rawStages = (stagesQuery.data ?? []).filter((s) => s.project?.id === projectId);
  const rawTimelines = timelinesQuery.data ?? [];

  useEffect(() => {
    if (!rawStages.length) {
      setSelectedStageId(null);
      return;
    }

    if (rawStages.some((stage) => stage.id === selectedStageId)) return;

    const preferredStage = rawStages.find(
      (stage) => stage.status !== 'completed' && stage.status !== 'canceled'
    );
    setSelectedStageId((preferredStage ?? rawStages[0]).id);
  }, [stagesQuery.data, projectId, selectedStageId]);

  const stagesWithTimelines: ProjectStage[] = rawStages.map((stage) => ({
    ...stage,
    timelines: rawTimelines.filter((tl) => tl.project_stage_id === stage.id).sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime()),
  }))
    .sort((a, b) => new Date(a.start_date)
      .getTime() - new Date(b.start_date)
        .getTime());

  // ── Stage Mutations ─────────────────────────────────────────────
  const saveStageMutation = useMutation({
    mutationFn: async (payload: CreateProjectStagePayload) => {
      if (selectedStage) {
        return projectStagesApi.update(selectedStage.id, payload);
      }
      return projectStagesApi.create(payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['project-stages', projectId] });
      setStageDialogOpen(false);
      setSelectedStage(null);
      toast.success(selectedStage ? 'تم تعديل المرحلة بنجاح' : 'تمت إضافة المرحلة بنجاح');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'حدث خطأ أثناء حفظ المرحلة');
    },
  });

  const deleteStageMutation = useMutation({
    mutationFn: (stage: ProjectStage) => projectStagesApi.delete(stage.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['project-stages', projectId] });
      setStageToDelete(null);
      toast.success('تم حذف المرحلة بنجاح');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'حدث خطأ أثناء حذف المرحلة');
    },
  });

  // ── Timeline Mutations ──────────────────────────────────────────
  const saveTimelineMutation = useMutation({
    mutationFn: async (payload: CreateStageTimelinePayload) => {
      if (selectedTimeline) {
        return stageTimelinesApi.update(selectedTimeline.id, payload);
      }
      return stageTimelinesApi.create(payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['stage-timelines'] });
      setTimelineDialogOpen(false);
      setSelectedTimeline(null);
      setParentStageForTimeline(null);
      toast.success(selectedTimeline ? 'تم تعديل التفصيل الزمني بنجاح' : 'تمت إضافة التفصيل الزمني بنجاح');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'حدث خطأ أثناء حفظ التفصيل الزمني');
    },
  });

  const deleteTimelineMutation = useMutation({
    mutationFn: (timeline: StageTimeline) => stageTimelinesApi.delete(timeline.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['stage-timelines'] });
      setTimelineToDelete(null);
      toast.success('تم حذف التفصيل الزمني بنجاح');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'حدث خطأ أثناء حذف التفصيل الزمني');
    },
  });

  // ── Handlers ────────────────────────────────────────────────────
  const handleEditStage = (stage: ProjectStage) => {
    setSelectedStage(stage);
    setStageDialogOpen(true);
  };

  const handleAddStage = () => {
    setSelectedStage(null);
    setStageDialogOpen(true);
  };

  const handleDeleteStage = (stage: ProjectStage) => {
    setStageToDelete(stage);
  };

  const handleAddTimeline = (stage: ProjectStage) => {
    setParentStageForTimeline(stage);
    setSelectedTimeline(null);
    setTimelineDialogOpen(true);
  };

  const handleEditTimeline = (timeline: StageTimeline, stage: ProjectStage) => {
    setParentStageForTimeline(stage);
    setSelectedTimeline(timeline);
    setTimelineDialogOpen(true);
  };

  const handleDeleteTimeline = (timeline: StageTimeline) => {
    setTimelineToDelete(timeline);
  };

  return (
    <div className="min-w-0 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-foreground">مراحل المشروع</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            إدارة وتتبع المراحل المرتبطة بهذا المشروع ({stagesWithTimelines.length} مرحلة)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            onClick={handleAddStage}
            className="w-full sm:w-auto"
          >
            <Plus className="size-4" />
            إضافة مرحلة
          </Button>
        </div>
      </div>

      <div className="min-w-0 bg-white sm:min-h-[400px]">
        <ProjectStagesTimeline
          stages={stagesWithTimelines}
          selectedStageId={selectedStageId}
          onSelectStage={setSelectedStageId}
          onAddTimeline={handleAddTimeline}
          onEditTimeline={handleEditTimeline}
          onDeleteTimeline={handleDeleteTimeline}
          onEditStage={handleEditStage}
          onDeleteStage={handleDeleteStage}
        />
      </div>

      <ProjectStagesDialog
        open={stageDialogOpen}
        onOpenChange={(open) => {
          setStageDialogOpen(open);
          if (!open) setSelectedStage(null);
        }}
        projectId={projectId}
        stage={selectedStage}
        onSubmit={async (payload) => {
          await saveStageMutation.mutateAsync(payload);
        }}
        loading={saveStageMutation.isPending}
      />

      {parentStageForTimeline && (
        <StageTimelineDialog
          open={timelineDialogOpen}
          onOpenChange={(open) => {
            setTimelineDialogOpen(open);
            if (!open) {
              setSelectedTimeline(null);
              setParentStageForTimeline(null);
            }
          }}
          projectStageId={parentStageForTimeline.id}
          timeline={selectedTimeline}
          onSubmit={async (payload) => {
            await saveTimelineMutation.mutateAsync(payload);
          }}
          loading={saveTimelineMutation.isPending}
          onDelete={selectedTimeline ? () => {
            setTimelineDialogOpen(false);
            handleDeleteTimeline(selectedTimeline);
          } : undefined}
        />
      )}

      {/* Delete Stage Dialog */}
      <Dialog open={!!stageToDelete} onOpenChange={(open) => !open && setStageToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد الحذف</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من حذف هذه المرحلة؟ لا يمكن التراجع عن هذا الإجراء.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setStageToDelete(null)} disabled={deleteStageMutation.isPending}>
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (stageToDelete) deleteStageMutation.mutate(stageToDelete);
              }}
              disabled={deleteStageMutation.isPending}
            >
              {deleteStageMutation.isPending ? 'جاري الحذف...' : 'تأكيد الحذف'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Timeline Dialog */}
      <Dialog open={!!timelineToDelete} onOpenChange={(open) => !open && setTimelineToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد الحذف</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من حذف هذا التفصيل الزمني؟ لا يمكن التراجع عن هذا الإجراء.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setTimelineToDelete(null)} disabled={deleteTimelineMutation.isPending}>
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (timelineToDelete) deleteTimelineMutation.mutate(timelineToDelete);
              }}
              disabled={deleteTimelineMutation.isPending}
            >
              {deleteTimelineMutation.isPending ? 'جاري الحذف...' : 'تأكيد الحذف'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
