export type CompanyFundCurrency = {
  id: number;
  expenseable_type?: string;
  expenseable_id?: number;
  currency: string;
  symbol: string;
  balance: string;
  user?: null;
  created_at?: string;
  pivot?: { id: number };
};

export type CompanyFund = {
  id: number;
  name: string;
  currencies?: CompanyFundCurrency[];
  created_at?: string;
  is_locked?: boolean | number;
  status?: 'pending' | 'complete' | 'canceled';
  description?: string;
  threshold?: number;
  type?: string;
  is_favorite?: boolean;
};

export type CreateCompanyFundPayload = {
  name: string;
  is_locked?: boolean | number;
  status?: 'pending' | 'complete' | 'canceled';
  description?: string;
  threshold?: number;
};

export type UpdateCompanyFundPayload = Partial<CreateCompanyFundPayload & {
  is_favorite?: boolean;
}>;

export type CompanyFundCurrencyAttachPayload = {
  currency_id: number;
  balance: string;
};
