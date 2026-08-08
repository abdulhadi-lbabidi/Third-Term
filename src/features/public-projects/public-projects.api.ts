import { apiClient } from '@/shared/api/axios.instance';
import type { Project } from '@/features/projects/types';
import type { Revenue } from '@/features/revenues/types';
import type { Expense } from '@/features/expenses/types';
import type { Invoice } from '@/features/invoices/types';

export type PublicProjectsResponse = {
  data: Project[];
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

export const publicProjectsApi = {
  getProjects: async (filters?: Record<string, any>): Promise<Project[]> => {
    const response = await apiClient.get('/projects', {
      params: { paginate: false, ...filters },
    });
    const result = response.data;
    if (Array.isArray(result)) return result;
    return result?.data ?? [];
  },

  getProjectById: async (id: number): Promise<Project> => {
    const response = await apiClient.get(`/projects/${id}`);
    const result = response.data;
    return result?.data ?? result;
  },

  getRevenues: async (projectFundId?: number | null): Promise<Revenue[]> => {
    try {
      const response = await apiClient.get('/revenues', {
        params: {
          paginate: false,
          'filter[project_fund_id]': projectFundId,
        },
      });
      const result = response.data;
      if (Array.isArray(result)) return result;
      return result?.data ?? [];
    } catch {
      return [];
    }
  },

  getExpenses: async (projectFundId?: number | null): Promise<Expense[]> => {
    try {
      const response = await apiClient.get('/expenses', {
        params: {
          paginate: false,
          'filter[project_fund_id]': projectFundId,
        },
      });
      const result = response.data;
      if (Array.isArray(result)) return result;
      return result?.data ?? [];
    } catch {
      return [];
    }
  },

  getInvoices: async (projectFundId?: number | null): Promise<Invoice[]> => {
    try {
      const response = await apiClient.get('/invoices', {
        params: {
          paginate: false,
          'filter[project_fund_id]': projectFundId,
        },
      });
      const result = response.data;
      if (Array.isArray(result)) return result;
      return result?.data ?? [];
    } catch {
      return [];
    }
  },

  getTransfers: async (projectFundId?: number | null): Promise<any[]> => {
    try {
      const response = await apiClient.get('/transactions', {
        params: {
          paginate: false,
          'filter[project_fund_id]': projectFundId,
        },
      });
      const result = response.data;
      if (Array.isArray(result)) return result;
      return result?.data ?? [];
    } catch {
      return [];
    }
  },
};
