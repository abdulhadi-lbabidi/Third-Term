import { apiClient } from '@/shared/api/axios.instance';
import type { CreateMaterialPayload, Material, UpdateMaterialPayload } from './types';

export const materialsApi = {
  getMaterials: async (): Promise<Material[]> => {
    const response = await apiClient.get('/materials', {
      params: { paginate: true, per_page: 5, page: 1, 'filter[search]': '' },
    });
    return response.data?.data ?? response.data ?? [];
  },
  getMaterialById: async (id: number): Promise<Material> => {
    const response = await apiClient.get(`/materials/${id}`);
    return response.data.data ?? response.data;
  },
  createMaterial: async (payload: CreateMaterialPayload): Promise<Material> => {
    const response = await apiClient.post('/materials', payload);
    return response.data.data ?? response.data;
  },
  updateMaterial: async (id: number, payload: UpdateMaterialPayload): Promise<Material> => {
    const response = await apiClient.patch(`/materials/${id}`, payload);
    return response.data.data ?? response.data;
  },
  deleteMaterial: async (id: number): Promise<void> => {
    await apiClient.delete(`/materials/${id}`);
  },
};
