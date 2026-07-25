export interface Currency {
  id: number;
  currency: string;
  symbol: string;
  balance?: number | null;
  user?: any | null;
  created_at: string;
}

export interface CreateCurrencyPayload {
  currency: string;
  symbol: string;
}

export interface UpdateCurrencyPayload {
  currency?: string;
  symbol?: string;
}
