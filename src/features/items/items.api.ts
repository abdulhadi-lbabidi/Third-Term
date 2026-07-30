import { apiClient } from '@/shared/api/axios.instance';
import type { CreateItemPayload, Item, UpdateItemPayload } from './types';
import type { PaginationMeta } from '@/components/ui/pagination';

export type ItemResponse = {
  data: Item[];
  meta?: PaginationMeta;
};

export const itemsApi = {
  getItems: async (page = 1, perPage = 50): Promise<ItemResponse> => {
    const response = await apiClient.get('/items', {
      params: { paginate: true, page, per_page: perPage },
    });
    if (Array.isArray(response.data)) {
      return { data: response.data };
    }
    return {
      data: response.data?.data ?? [],
      meta: response.data?.meta,
    };
  },
  createItem: async (payload: CreateItemPayload): Promise<Item> => {
    const response = await apiClient.post('/items', payload);
    return response.data.data ?? response.data;
  },
  updateItem: async (id: number, payload: UpdateItemPayload): Promise<Item> => {
    const response = await apiClient.patch(`/items/${id}`, payload);
    return response.data.data ?? response.data;
  },
  deleteItem: async (id: number): Promise<void> => {
    await apiClient.delete(`/items/${id}`);
  },
};
