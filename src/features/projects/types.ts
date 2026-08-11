import type { ClientRecord } from '@/features/users/types';

export type ProjectStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export type ProjectFundCurrency = {
  id: number;
  expenseable_type?: string;
  expenseable_id?: number;
  currency: string;
  symbol: string;
  balance: string;
  user?: null;
  created_at?: string;
};

export type ProjectFund = {
  id: number;
  name: string;
  currencies?: ProjectFundCurrency[];
  created_at?: string;
  is_locked?: boolean | number;
  status?: 'pending' | 'complete' | 'cancelled';
  description?: string;
  threshold?: number;
};

export type Project = {
  id: number;
  name: string;
  expected_cost: number;
  status: ProjectStatus;
  client: ClientRecord;
  department?: { id: number; name: string };
  departments?: { id: number; name: string }[];
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

export type ProjectFormPayload = CreateProjectPayload & {
  department_ids?: number[];
};

export type UpdateProjectPayload = {
  client_id: number;
  department_id: number;
  name: string;
  expected_cost: number;
  status: ProjectStatus;
};
