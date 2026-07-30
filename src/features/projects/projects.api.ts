import { apiClient } from '@/shared/api/axios.instance';
import type { CreateProjectPayload, Project, UpdateProjectPayload } from './types';
import type { PaginationMeta } from '@/components/ui/pagination';

export type ProjectResponse = {
  data: Project[];
  meta?: PaginationMeta;
};

export const projectsApi = {
  getProjects: (page = 1, perPage = 50): Promise<ProjectResponse> =>
    apiClient.get('/projects', { params: { paginate: true, page, per_page: perPage } }).then(({ data }: any) => {
      if (Array.isArray(data)) return { data };
      return { data: data?.data ?? [], meta: data?.meta };
    }),
  getDepartments: () => apiClient.get<{ id: number; name: string }[]>('/departments').then(({ data }: any) => data?.data ?? data),
  getProjectById: (id: number) => apiClient.get<Project>(`/projects/${id}`).then(({ data }: any) => data?.data ?? data),
  createProject: (payload: CreateProjectPayload) => apiClient.post<Project>('/projects', payload).then(({ data }: any) => data?.data ?? data),
  updateProject: (id: number, payload: UpdateProjectPayload) => apiClient.patch<Project>(`/projects/${id}`, payload).then(({ data }: any) => data?.data ?? data),
  deleteProject: (id: number) => apiClient.delete(`/projects/${id}`).then(({ data }: any) => data?.data ?? data),
};
