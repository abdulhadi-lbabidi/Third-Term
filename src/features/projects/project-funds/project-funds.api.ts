import { apiClient } from '@/shared/api/axios.instance';
import type { CreateProjectFundPayload, ProjectFund, ProjectFundCurrencyAttachPayload, UpdateProjectFundPayload } from './project-funds.types';
import type { PaginationMeta } from '@/components/ui/pagination';

export type ProjectFundsResponse = { data: ProjectFund[]; meta?: PaginationMeta };
export type ProjectFundsListParams = {
  projectId?: number;
  page?: number;
  perPage?: number;
  search?: string;
  sort?: string;
};

export const projectFundsApi = {
  getProjectFunds: async ({ projectId, page = 1, perPage = 20, search, sort = '-created_at' }: ProjectFundsListParams = {}): Promise<ProjectFundsResponse> => {
    const response = await apiClient.get('/project-funds', { params: {
      project_id: projectId,
      paginate: true,
      page,
      per_page: perPage,
      'filter[search]': search || undefined,
      sort: sort || undefined,
    } });
    const payload = response.data;

    if (Array.isArray(payload)) return { data: payload };
    const data = payload?.data ?? payload;

    if (Array.isArray(data)) return { data, meta: payload?.meta };
    if (data && typeof data === 'object') return { data: Object.values(data), meta: payload?.meta };
    return { data: [], meta: payload?.meta };
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
