import type { StageTimeline } from '../stage-timelines/stage-timelines.types';
import type { Project } from '../types';

export type ProjectStageStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export type ProjectStage = {
  id: number;
  name: string;
  start_date: string;
  expected_end_date: string;
  status: ProjectStageStatus | string;
  stage_progress: number;
  project_id: number;
  project?: Project;
  created_at?: string;
  updated_at?: string;
  timelines?: StageTimeline[];
};

export type CreateProjectStagePayload = {
  name: string;
  start_date: string;
  expected_end_date: string;
  status: string;
  stage_progress: number;
  project_id: number;
};

export type UpdateProjectStagePayload = Partial<CreateProjectStagePayload>;
