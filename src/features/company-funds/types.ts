export type CompanyFundCurrency = {
  id: number;
  expenseable_type?: string;
  expenseable_id?: number;
  currency: string;
  symbol: string;
  balance: string;
  user?: null;
  created_at?: string;
};

export type CompanyFund = {
  id: number;
  name: string;
  currencies?: CompanyFundCurrency[];
  created_at?: string;
};

export type CreateCompanyFundPayload = {
  name: string;
};

export type UpdateCompanyFundPayload = {
  name: string;
};

export type CompanyFundCurrencyAttachPayload = {
  currency_id: number;
  balance: string;
};
