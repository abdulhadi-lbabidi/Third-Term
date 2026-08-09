import { apiClient } from '@/shared/api/axios.instance';
import type {
  CompanyFund,
  CompanyFundCurrencyAttachPayload,
  CreateCompanyFundPayload,
  UpdateCompanyFundPayload,
} from './types';
import type { PaginationMeta } from '@/components/ui/pagination';

export type CompanyFundResponse = {
  data: CompanyFund[];
  meta?: PaginationMeta;
};

export type CompanyFundsListParams = {
  page?: number;
  perPage?: number;
  search?: string;
  sort?: string;
};

export const companyFundsApi = {
  getCompanyFunds: async ({ page = 1, perPage = 50, search, sort = '-created_at' }: CompanyFundsListParams = {}): Promise<CompanyFundResponse> => {
    const response = await apiClient.get('/company-funds', {
      params: {
        paginate: true,
        page,
        per_page: perPage,
        'filter[search]': search || undefined,
        sort: sort || undefined,
      },
    });
    if (Array.isArray(response.data)) {
      return { data: response.data };
    }
    return {
      data: response.data?.data ?? [],
      meta: response.data?.meta,
    };
  },

  getCompanyFundById: async (id: number): Promise<CompanyFund> => {
    const response = await apiClient.get(`/company-funds/${id}`);
    return response.data?.data ?? response.data;
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
