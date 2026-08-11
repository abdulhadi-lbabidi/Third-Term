export type FundCurrency = {
  id: number;
  expenseable_type?: string;
  expenseable_id?: number;
  currency: string;
  symbol: string;
  balance: string;
  user?: {
    id: number;
    name: string;
    email?: string;
    phone_number?: string;
  };
  created_at?: string;
};

export type Fund = {
  id: number;
  name: string;
  user: {
    id: number;
    name: string;
    email?: string;
    phone_number?: string;
    address?: string;
    created_at?: string;
    updated_at?: string;
  };
  currencies?: FundCurrency[];
  created_at?: string;
  is_locked?: boolean | number;
  status?: 'pending' | 'complete' | 'cancelled';
  description?: string;
  threshold?: number;
};

export type CreateFundPayload = {
  user_id: number;
  name: string;
  is_locked?: boolean | number;
  status?: 'pending' | 'complete' | 'cancelled';
  description?: string;
  threshold?: number;
};

export type UpdateFundPayload = {
  user_id: number;
  name: string;
  is_locked?: boolean | number;
  status?: 'pending' | 'complete' | 'cancelled';
  description?: string;
  threshold?: number;
};

export type FundCurrencyAttachPayload = {
  currency_id: number;
  balance: string;
};
