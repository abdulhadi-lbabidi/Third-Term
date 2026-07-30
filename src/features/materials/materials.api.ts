import { apiClient } from '@/shared/api/axios.instance';
import type { CreateMaterialPayload, Material, MaterialResponse, UpdateMaterialPayload } from './types';

export const materialsApi = {
  getMaterials: async (page = 1, perPage = 10): Promise<MaterialResponse> => {
    const response = await apiClient.get('/materials', {
      params: { paginate: true, per_page: perPage, page, 'filter[search]': '' },
    });
    if (Array.isArray(response.data)) {
      return { data: response.data };
    }
    return {
      data: response.data?.data ?? [],
      meta: response.data?.meta,
    };
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
