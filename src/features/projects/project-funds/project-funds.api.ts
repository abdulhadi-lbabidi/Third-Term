import { apiClient } from '@/shared/api/axios.instance';
import type {
  CreateProjectFundPayload,
  ProjectFund,
  ProjectFundCurrencyAttachPayload,
  UpdateProjectFundPayload,
} from './project-funds.types';

export const projectFundsApi = {
  getProjectFunds: async (): Promise<ProjectFund[]> => {
    const response = await apiClient.get('/project-funds');
    const payload = response.data as { data?: ProjectFund[] } | ProjectFund[];
    return Array.isArray(payload) ? payload : payload.data ?? [];
  },
  getProjectFundById: async (id: number): Promise<ProjectFund> => {
    const response = await apiClient.get(`/project-funds/${id}`);
    return response.data;
  },
  createProjectFund: async (payload: CreateProjectFundPayload): Promise<ProjectFund> => {
    const response = await apiClient.post('/project-funds', payload);
    return response.data;
  },
  updateProjectFund: async (id: number, payload: UpdateProjectFundPayload): Promise<ProjectFund> => {
    const response = await apiClient.patch(`/project-funds/${id}`, payload);
    return response.data;
  },
  deleteProjectFund: async (id: number): Promise<void> => {
    await apiClient.delete(`/project-funds/${id}`);
  },
  attachCurrency: async (fundId: number, payload: ProjectFundCurrencyAttachPayload): Promise<ProjectFund> => {
    const response = await apiClient.post(`/project-funds/${fundId}/currencies`, payload);
    return response.data;
  },
};
