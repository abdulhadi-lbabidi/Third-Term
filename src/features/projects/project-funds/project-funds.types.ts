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
};

export type CreateProjectFundPayload = {
  project_id: number;
  name: string;
};

export type UpdateProjectFundPayload = {
  name: string;
};

export type ProjectFundCurrencyAttachPayload = {
  currency_id: number;
  balance: string;
};
