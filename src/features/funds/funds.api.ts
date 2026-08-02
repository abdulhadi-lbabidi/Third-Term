import { apiClient } from '@/shared/api/axios.instance';
import { usersApi } from '@/features/users/api/users.api';
import type { UserRole } from '@/features/users/types';
import type { CreateFundPayload, Fund, FundCurrencyAttachPayload, UpdateFundPayload } from './types';

type UserFundsResponse = {
  user?: {
    funds?: Fund[];
  };
};

export const fundsApi = {
  getFunds: async (): Promise<Fund[]> => {
    const response = await apiClient.get('/funds');
    return Array.isArray(response.data) ? response.data : response.data?.data ?? [];
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
};
