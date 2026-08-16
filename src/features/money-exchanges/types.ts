export type MoneyExchange = {
  id: number;
  exchangeable_type: string;
  exchangeable_id: number;
  exchangeable_info?: {
    type: 'currency_fund' | 'company_fund' | 'project_fund';
    details?: {
      id: number;
      balance: string;
      fund_id?: number;
      company_fund_id?: number;
      project_fund_id?: number;
      fund?: {
        id: number;
        name: string;
        user_id?: number;
        user?: {
          id: number;
          name: string;
          role_type?: string;
        };
      };
      project_fund?: {
        id: number;
        name: string;
        project_id?: number;
        project?: {
          id: number;
          name: string;
        };
      };
    };
    user_info?: {
      user_name?: string;
      role_type?: string;
      user?: {
        id: number;
        name: string;
      };
    };
  };
  from_currency: {
    id: number;
    currency: string;
    symbol: string;
  };
  to_currency: {
    id: number;
    currency: string;
    symbol: string;
  };
  amount: string;
  exchange_rate: number;
  operation: 'multiply' | 'divide';
  converted_amount: number;
  created_by?: {
    id: number;
    name: string;
  };
  created_at: string;
};
