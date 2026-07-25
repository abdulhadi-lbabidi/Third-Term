import { apiClient } from '@/shared/api/axios.instance';
import type { CreateItemPayload, Item, UpdateItemPayload } from './types';

export const itemsApi = {
  getItems: async (): Promise<Item[]> => {
    const response = await apiClient.get('/items');
    return response.data;
  },
  createItem: async (payload: CreateItemPayload): Promise<Item> => {
    const response = await apiClient.post('/items', payload);
    return response.data;
  },
  updateItem: async (id: number, payload: UpdateItemPayload): Promise<Item> => {
    const response = await apiClient.patch(`/items/${id}`, payload);
    return response.data;
  },
  deleteItem: async (id: number): Promise<void> => {
    await apiClient.delete(`/items/${id}`);
  },
};
