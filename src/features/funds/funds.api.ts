import { apiClient } from '@/shared/api/axios.instance';
import { usersApi } from '@/features/users/api/users.api';
import type { UserRole } from '@/features/users/types';
import type { CreateFundPayload, Fund, FundCurrencyAttachPayload, UpdateFundPayload, MoneyExchangePayload } from './types';
import type { PaginationMeta } from '@/components/ui/pagination';

type UserFundsResponse = {
  user?: {
    funds?: Fund[];
  };
};

export type FundsResponse = { data: Fund[]; meta?: PaginationMeta };
export type FundsListParams = {
  page?: number;
  perPage?: number;
  search?: string;
  sort?: string;
};

export const fundsApi = {
  getFunds: async ({ page = 1, perPage = 20, search, sort = '-created_at' }: FundsListParams = {}): Promise<FundsResponse> => {
    const response = await apiClient.get('/funds', { params: {
      paginate: true,
      page,
      per_page: perPage,
      'filter[search]': search || undefined,
      sort: sort || undefined,
    } });
    return Array.isArray(response.data)
      ? { data: response.data }
      : { data: response.data?.data ?? [], meta: response.data?.meta };
  },

  getFundsByUserRole: async (role: UserRole, userId: number): Promise<Fund[]> => {
    const response = (await usersApi.getUserByRole(role, userId)) as UserFundsResponse;
    return response.user?.funds ?? [];
  },

  getFundById: async (id: number): Promise<Fund> => {
    const response = await apiClient.get(`/funds/${id}`);
    let data = response.data?.data ?? response.data;
    while (Array.isArray(data)) {
      data = data[0];
    }
    return data;
  },

  createFund: async (payload: CreateFundPayload): Promise<Fund> => {
    const response = await apiClient.post('/funds', payload);
    return response.data;
  },

  updateFund: async (id: number, payload: UpdateFundPayload): Promise<Fund> => {
    const response = await apiClient.patch(`/funds/${id}`, payload);
    return response.data;
  },

  deleteFund: async (id: number): Promise<void> => {
    await apiClient.delete(`/funds/${id}`);
  },

  attachCurrency: async (fundId: number, payload: FundCurrencyAttachPayload): Promise<Fund> => {
    const response = await apiClient.post(`/funds/${fundId}/currencies`, payload);
    return response.data;
  },

  exchangeMoney: async (payload: MoneyExchangePayload): Promise<any> => {
    const response = await apiClient.post('/money-exchanges', payload);
    return response.data;
  },

  getMoneyExchanges: async (params?: Record<string, any>): Promise<any> => {
    const response = await apiClient.get('/money-exchanges', { params });
    return response.data;
  },

  deleteMoneyExchange: async (id: number): Promise<void> => {
    await apiClient.delete(`/money-exchanges/${id}`);
  },

  updateMoneyExchange: async (id: number, payload: MoneyExchangePayload): Promise<any> => {
    const response = await apiClient.patch(`/money-exchanges/${id}`, payload);
    return response.data;
  },

  detachCurrency: async (fundId: number, payload: { currency_id: number }, sourceType?: 'user_fund' | 'company_fund' | 'project_fund'): Promise<any> => {
    let url = `/funds/${fundId}/detach-currency`;
    if (sourceType === 'company_fund') {
      url = `/company-funds/${fundId}/detach-currency`;
    } else if (sourceType === 'project_fund') {
      url = `/project-funds/${fundId}/detach-currency`;
    }
    const response = await apiClient.post(url, payload);
    return response.data;
  },
};
