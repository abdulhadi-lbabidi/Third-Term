export type ExpenseSource = 'company_fund' | 'user_fund' | 'project_fund';

export type ExpenseableType =
  | 'App\\Models\\CompanyFundCurrency'
  | 'App\\Models\\CurrencyFund'
  | 'App\\Models\\ProjectFundCurrency';

export type Expense = {
  id: number;
  expenseable_type?: ExpenseableType;
  expenseable_id?: number;
  expenseable_info?: {
    type?: ExpenseSource;
    company_fund_id?: number;
    project_id?: number;
    id?: number;
  };
  user_role?: string;
  user?: string;
  description: string;
  amount: string;
  is_posted?: boolean;
  user_id?: number;
  created_by_name?: string;
  created_by?: number;
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
