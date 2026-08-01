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
  getProjects: async (): Promise<Project[]> => {
    const response = await apiClient.get('/projects', {
      params: { paginate: false },
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

  getRevenues: async (): Promise<Revenue[]> => {
    try {
      const response = await apiClient.get('/revenues', {
        params: { paginate: false },
      });
      const result = response.data;
      if (Array.isArray(result)) return result;
      return result?.data ?? [];
    } catch {
      return [];
    }
  },

  getExpenses: async (): Promise<Expense[]> => {
    try {
      const response = await apiClient.get('/expenses', {
        params: { paginate: false },
      });
      const result = response.data;
      if (Array.isArray(result)) return result;
      return result?.data ?? [];
    } catch {
      return [];
    }
  },

  getInvoices: async (): Promise<Invoice[]> => {
    try {
      const response = await apiClient.get('/invoices', {
        params: { paginate: false },
      });
      const result = response.data;
      if (Array.isArray(result)) return result;
      return result?.data ?? [];
    } catch {
      return [];
    }
  },
};
