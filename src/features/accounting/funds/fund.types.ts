export interface Fund {
  id: number;
  name: string;
  owner_id?: number;
  owner?: { id: number; name: string };
  balance: number;
  currency?: { id: number; symbol: string; name: string };
  created_at: string;
  updated_at: string;
}

export interface CompanyFund {
  id: number;
  name: string;
  balance: number;
  currency?: { id: number; symbol: string; name: string };
  created_at: string;
  updated_at: string;
}

export interface ProjectFund {
  id: number;
  project_id: number;
  project?: { id: number; name: string };
  balance: number;
  currency?: { id: number; symbol: string; name: string };
  created_at: string;
  updated_at: string;
}

export interface CreateFundPayload {
  name: string;
  currency_id: number;
  owner_id?: number;
}
