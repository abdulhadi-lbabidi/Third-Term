export type ExpenseSource = 'company_fund' | 'user_fund' | 'project_fund';

export type ExpenseableType =
  | 'App\\Models\\CompanyFundCurrency'
  | 'App\\Models\\CurrencyFund'
  | 'App\\Models\\ProjectFundCurrency';

export type ExpenseUser = {
  id: number;
  name: string;
  email?: string;
  phone_number?: string;
  address?: string;
  role_type?: string;
  role_details?: Record<string, unknown>;
};

export type ExpenseProjectInfo = {
  id: number;
  name: string;
  client_id?: number;
  department_id?: number;
  expected_cost?: string;
  status?: string;
};

export type ExpenseProjectFundInfo = {
  id: number;
  project_id: number;
  name: string;
  project?: ExpenseProjectInfo;
};

export type ExpenseProjectFundCurrencyDetails = {
  id: number;
  project_fund_id: number;
  currency_id?: number;
  balance?: string;
  currency?: {
    id: number;
    currency: string;
    symbol?: string;
  };
  project_fund?: ExpenseProjectFundInfo;
};

export type ExpenseUserFundCurrencyDetails = {
  id: number;
  fund_id?: number;
  currency_id?: number;
  balance?: string;
  currency?: {
    id: number;
    currency: string;
    symbol?: string;
  };
  fund?: {
    id: number;
    name: string;
    user_id?: number;
    user?: ExpenseUser;
  };
};

export type ExpenseUserFundUserInfo = {
  id?: number;
  user_id?: number;
  role_type?: string;
  user?: ExpenseUser;
};

export type ExpenseCompanyFundCurrencyDetails = {
  id: number;
  company_fund_id?: number;
  currency_id?: number;
  balance?: string;
  currency?: {
    id: number;
    currency: string;
    symbol?: string;
  };
  company_fund?: {
    id: number;
    name: string;
  };
};

export type ExpenseableInfo = {
  type?: ExpenseSource | 'currency_fund' | string;
  company_fund_id?: number;
  project_id?: number;
  id?: number;
  details?:
    | ExpenseProjectFundCurrencyDetails
    | ExpenseUserFundCurrencyDetails
    | ExpenseCompanyFundCurrencyDetails
    | Record<string, unknown>;
  user_info?: ExpenseUserFundUserInfo;
};

export type Expense = {
  id: number;
  expenseable_type?: ExpenseableType;
  expenseable_id?: number;
  expenseable_info?: ExpenseableInfo;
  user_role?: string;
  user?: ExpenseUser | string;
  description: string;
  amount: string;
  is_posted?: boolean;
  user_id?: number;
  created_by_name?: string;
  created_by?: number | ExpenseUser;
  created_at?: string;
};

export type CreateExpensePayload = {
  expenseable_type?: ExpenseableType;
  expenseable_id?: number;
  description: string;
  amount: number;
  is_posted: boolean;
  user_id: number;
  created_by: number;
};

export type UpdateExpensePayload = CreateExpensePayload;
