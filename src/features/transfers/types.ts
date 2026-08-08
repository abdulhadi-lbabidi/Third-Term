export type TransferableType =
  | 'App\\Models\\CompanyFundCurrency'
  | 'App\\Models\\CurrencyFund'
  | 'App\\Models\\ProjectFundCurrency';

export type TransferFundInfo = {
  type?: string;
  details?: {
    id?: number;
    company_fund_id?: number;
    project_fund_id?: number;
    fund_id?: number;
    currency_id?: number;
    currency?: {
      id: number;
      currency: string;
      symbol?: string;
    };
    company_fund?: {
      id: number;
      name: string;
    };
    project_fund?: {
      id: number;
      name: string;
      project_id?: number;
    };
    fund?: {
      id: number;
      name: string;
      user_id?: number;
      user?: {
        name: string;
      };
    };
  };
  user_info?: {
    user_id: number;
    role_type: string;
    user?: {
      id: number;
      name: string;
    };
  };
};

export type TransferUser = {
  id: number;
  name: string;
  role_type?: string;
};

export type Transfer = {
  id: number;
  name: string;
  amount: string;
  morph_from_type: TransferableType;
  morph_from_id: number;
  morph_from_info?: TransferFundInfo;
  morph_to_type: TransferableType;
  morph_to_id: number;
  morph_to_info?: TransferFundInfo;
  created_by?: number | TransferUser;
  created_at?: string;
  is_posted?: boolean;
};

export type CreateTransferPayload = {
  morph_from_type: TransferableType;
  morph_from_id: number;
  morph_to_type: TransferableType;
  morph_to_id: number;
  name: string;
  amount: number;
  created_by: number;
};
