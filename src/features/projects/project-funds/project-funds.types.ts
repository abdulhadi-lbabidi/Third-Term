export type ProjectFundCurrency = {
  id: number;
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
  project: {
    id: number;
    name: string;
    expected_cost?: number;
    status?: string;
    created_at?: string;
  };
  currencies?: ProjectFundCurrency[];
  created_at?: string;
  is_locked?: boolean | number;
  status?: 'pending' | 'complete' | 'cancelled';
  description?: string;
  threshold?: number;
};

export type CreateProjectFundPayload = {
  project_id: number;
  name: string;
  is_locked?: boolean | number;
  status?: 'pending' | 'complete' | 'cancelled';
  description?: string;
  threshold?: number;
};

export type UpdateProjectFundPayload = {
  name: string;
  is_locked?: boolean | number;
  status?: 'pending' | 'complete' | 'cancelled';
  description?: string;
  threshold?: number;
};

export type ProjectFundCurrencyAttachPayload = {
  currency_id: number;
  balance: string;
};
