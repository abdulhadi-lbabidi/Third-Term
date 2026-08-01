import { apiClient } from '@/shared/api/axios.instance';
import type { CreateProjectFundPayload, ProjectFund, ProjectFundCurrencyAttachPayload, UpdateProjectFundPayload } from './project-funds.types';

export const projectFundsApi = {
  getProjectFunds: async (projectId?: number): Promise<ProjectFund[]> => {
    const response = await apiClient.get('/project-funds', { params: { project_id: projectId } });
    const payload = response.data;
    
    if (Array.isArray(payload)) return payload;
    const data = payload?.data ?? payload;
    
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object') return Object.values(data);
    return [];
  },
  getProjectFundById: async (id: number): Promise<ProjectFund> => {
    const response = await apiClient.get(`/project-funds/${id}`);
    let data = response.data?.data ?? response.data;
    
    // Unroll arrays until we get to an object
    while (Array.isArray(data)) {
      data = data[0];
    }
    return data;
  },
  createProjectFund: async (payload: CreateProjectFundPayload): Promise<ProjectFund> => {
    const response = await apiClient.post('/project-funds', payload);
    return response.data?.data ?? response.data;
  },
  updateProjectFund: async (id: number, payload: UpdateProjectFundPayload): Promise<ProjectFund> => {
    const response = await apiClient.patch(`/project-funds/${id}`, payload);
    return response.data?.data ?? response.data;
  },
  deleteProjectFund: async (id: number): Promise<void> => {
    await apiClient.delete(`/project-funds/${id}`);
  },
  attachCurrency: async (fundId: number, payload: ProjectFundCurrencyAttachPayload): Promise<ProjectFund> => {
    const response = await apiClient.post(`/project-funds/${fundId}/currencies`, payload);
    return response.data?.data ?? response.data;
  },
};
