export type IncrementEmployee = {
  id: number;
  job_title?: string;
  status?: 'active' | 'retired' | 'resigned';
  user: {
    id: number;
    name: string;
    email?: string;
    phone_number?: string;
    address?: string;
    created_at?: string;
  };
  last_payment?: unknown;
  created_at?: string;
};

export type Increment = {
  id: number;
  date: string;
  amount: number;
  reason: string;
  employee: IncrementEmployee;
  created_at?: string;
};

export type CreateIncrementPayload = {
  employee_id: number;
  date: string;
  amount: number;
  reason: string;
};

export type UpdateIncrementPayload = {
  employee_id: number;
  date: string;
  amount: number;
  reason: string;
};
