import { apiClient } from '@/shared/api/axios.instance';
import type { CreateProjectPayload, Project, UpdateProjectPayload } from './types';
import type { PaginationMeta } from '@/components/ui/pagination';

export type ProjectResponse = {
  data: Project[];
  meta?: PaginationMeta;
};

export const projectsApi = {
  getProjects: (page = 1, perPage = 50, filters?: Record<string, any>): Promise<ProjectResponse> =>
    apiClient.get('/projects', { params: { paginate: true, page, per_page: perPage, ...filters } }).then(({ data }: any) => {
      if (Array.isArray(data)) return { data };
      return { data: data?.data ?? [], meta: data?.meta };
    }),
  getDepartments: (): Promise<{ id: number; name: string }[]> =>
    apiClient.get('/departments').then(({ data }: any) => data?.data ?? data),
  getProjectById: (id: number) => apiClient.get<Project>(`/projects/${id}`).then(({ data }: any) => data?.data ?? data),
  createProject: (payload: CreateProjectPayload) => apiClient.post<Project>('/projects', payload).then(({ data }: any) => data?.data ?? data),
  attachDepartments: (projectId: number, departmentIds: number[]): Promise<void> =>
    apiClient
      .post(`/projects/${projectId}/departments/attach`, { department_ids: departmentIds })
      .then(({ data }: any) => data?.data ?? data),
  detachDepartments: (projectId: number, departmentIds: number[]): Promise<void> =>
    apiClient
      .post(`/projects/${projectId}/departments/detach`, { department_ids: departmentIds })
      .then(({ data }: any) => data?.data ?? data),
  updateProject: (id: number, payload: Partial<UpdateProjectPayload>) => apiClient.patch<Project>(`/projects/${id}`, payload).then(({ data }: any) => data?.data ?? data),
  deleteProject: (id: number) => apiClient.delete(`/projects/${id}`).then(({ data }: any) => data?.data ?? data),
  activateProjectIfPending: async (projectId: number): Promise<boolean> => {
    try {
      const project = await projectsApi.getProjectById(projectId);
      if (project && project.status === 'pending') {
        const clientId = project.client?.id ?? (project as any).client_id;
        const departmentId =
          project.department?.id ??
          project.departments?.[0]?.id ??
          (project as any).department_id ??
          1;
        await projectsApi.updateProject(projectId, {
          name: project.name,
          expected_cost: project.expected_cost,
          status: 'in_progress',
          client_id: clientId,
          department_id: departmentId,
        });
        return true;
      }
    } catch {
      return false;
    }
    return false;
  },
};
