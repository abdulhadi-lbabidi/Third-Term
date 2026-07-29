export type RevenueSource = 'company_fund' | 'user_fund' | 'project_fund';

export type RevenueableType =
  | 'App\\Models\\CompanyFundCurrency'
  | 'App\\Models\\CurrencyFund'
  | 'App\\Models\\ProjectFundCurrency';

export type RevenueableInfo = {
  type?: RevenueSource | 'currency_fund' | string;
  company_fund_id?: number;
  project_id?: number;
  id?: number;
  details?: Record<string, any>;
  user_info?: Record<string, any>;
};

export type Revenue = {
  id: number;
  revenueable_type?: RevenueableType;
  revenueable_id?: number;
  revenueable_info?: RevenueableInfo;
  user_role?: string;
  statement: string;
  amount: string;
  is_posted?: boolean;
  user_id?: number;
  received_by?: number;
  created_at?: string;
};

export type CreateRevenuePayload = {
  revenueable_type: RevenueableType;
  revenueable_id: number;
  statement: string;
  amount: number;
  is_posted: boolean;
  user_id: number;
  received_by: number;
};

export type UpdateRevenuePayload = Partial<CreateRevenuePayload>;
