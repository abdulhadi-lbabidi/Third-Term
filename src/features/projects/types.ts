import type { ClientRecord } from '@/features/users/types';

export type ProjectStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export type ProjectFund = {
  id: number;
  name: string;
  created_at?: string;
};

export type Project = {
  id: number;
  name: string;
  expected_cost: number;
  status: ProjectStatus;
  client: ClientRecord;
  funds?: ProjectFund[];
  created_at?: string;
};

export type CreateProjectPayload = {
  client_id: number;
  department_id: number;
  name: string;
  expected_cost: number;
  status: ProjectStatus;
};

export type UpdateProjectPayload = {
  client_id: number;
  department_id: number;
  name: string;
  expected_cost: number;
  status: ProjectStatus;
};
