import { apiClient } from '@/shared/api/axios.instance';
import type {
  CompanyFund,
  CompanyFundCurrencyAttachPayload,
  CreateCompanyFundPayload,
  UpdateCompanyFundPayload,
} from './types';

export const companyFundsApi = {
  getCompanyFunds: async (): Promise<CompanyFund[]> => {
    const response = await apiClient.get('/company-funds');
    const payload = response.data as { data?: CompanyFund[] } | CompanyFund[];
    return Array.isArray(payload) ? payload : payload.data ?? [];
  },

  createCompanyFund: async (payload: CreateCompanyFundPayload): Promise<CompanyFund> => {
    const response = await apiClient.post('/company-funds', payload);
    return response.data;
  },

  updateCompanyFund: async (id: number, payload: UpdateCompanyFundPayload): Promise<CompanyFund> => {
    const response = await apiClient.patch(`/company-funds/${id}`, payload);
    return response.data;
  },

  deleteCompanyFund: async (id: number): Promise<void> => {
    await apiClient.delete(`/company-funds/${id}`);
  },

  attachCurrency: async (fundId: number, payload: CompanyFundCurrencyAttachPayload): Promise<CompanyFund> => {
    const response = await apiClient.post(`/company-funds/${fundId}/currencies`, payload);
    return response.data;
  },
};
