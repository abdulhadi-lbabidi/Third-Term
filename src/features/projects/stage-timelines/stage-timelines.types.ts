import type { ProjectStageStatus } from '../project-stages/project-stages.types';

export type StageTimeline = {
  id: number;
  project_stage_id: number;
  stage_name: string;
  start_date: string;
  expected_end_date: string;
  actual_end_date?: string | null;
  status: ProjectStageStatus | string;
  stage_progress: number;
  created_at?: string;
  updated_at?: string;
};

export type CreateStageTimelinePayload = {
  project_stage_id: number;
  stage_name: string;
  start_date: string;
  expected_end_date: string;
  actual_end_date?: string | null;
  status: string;
  stage_progress: number;
};

export type UpdateStageTimelinePayload = Partial<CreateStageTimelinePayload>;
