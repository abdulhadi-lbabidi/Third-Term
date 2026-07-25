import { apiClient } from '@/shared/api/axios.instance';
import type { Fund, CompanyFund, ProjectFund, CreateFundPayload } from './fund.types';

export const fundsApi = {
  // Personal Funds
  getFunds: async (): Promise<Fund[]> => {
    const response = await apiClient.get('/funds');
    return response.data;
  },
  createFund: async (data: CreateFundPayload): Promise<Fund> => {
    const response = await apiClient.post('/funds', data);
    return response.data;
  },
  updateFund: async (id: number, data: Partial<CreateFundPayload>): Promise<Fund> => {
    const response = await apiClient.patch(`/funds/${id}`, data);
    return response.data;
  },
  deleteFund: async (id: number): Promise<void> => {
    await apiClient.delete(`/funds/${id}`);
  },

  // Company Funds
  getCompanyFunds: async (): Promise<CompanyFund[]> => {
    const response = await apiClient.get('/company-funds');
    return response.data;
  },
  createCompanyFund: async (data: Omit<CreateFundPayload, 'owner_id'>): Promise<CompanyFund> => {
    const response = await apiClient.post('/company-funds', data);
    return response.data;
  },
  updateCompanyFund: async (id: number, data: Partial<Omit<CreateFundPayload, 'owner_id'>>): Promise<CompanyFund> => {
    const response = await apiClient.patch(`/company-funds/${id}`, data);
    return response.data;
  },
  deleteCompanyFund: async (id: number): Promise<void> => {
    await apiClient.delete(`/company-funds/${id}`);
  },

  // Project Funds
  getProjectFunds: async (): Promise<ProjectFund[]> => {
    const response = await apiClient.get('/project-funds');
    return response.data;
  },
  createProjectFund: async (data: { project_id: number; currency_id: number; name: string }): Promise<ProjectFund> => {
    const response = await apiClient.post('/project-funds', data);
    return response.data;
  },
  updateProjectFund: async (id: number, data: Partial<{ project_id: number; currency_id: number; name: string }>): Promise<ProjectFund> => {
    const response = await apiClient.patch(`/project-funds/${id}`, data);
    return response.data;
  },
  deleteProjectFund: async (id: number): Promise<void> => {
    await apiClient.delete(`/project-funds/${id}`);
  },
};
