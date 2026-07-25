import { apiClient } from '@/shared/api/axios.instance';
import type { 
  CloudFile, 
  Directory, 
  CreateDirectoryPayload, 
  UpdateDirectoryPayload 
} from '../types';

export const cloudStorageApi = {
  getDirectories: async (params?: { parent_dir_id?: number | null; project_id?: number | null }): Promise<Directory[]> => {
    const response = await apiClient.get('/directories', { params });
    // Assuming the response might be paginated or just an array
    return response.data.data || response.data;
  },

  getDirectory: async (id: number): Promise<Directory> => {
    const response = await apiClient.get(`/directories/${id}`);
    const data = response.data.data || response.data;
    return Array.isArray(data) ? data[0] : data;
  },

  createDirectory: async (payload: CreateDirectoryPayload): Promise<Directory> => {
    const response = await apiClient.post('/directories', payload);
    return response.data.data || response.data;
  },

  updateDirectory: async (id: number, payload: UpdateDirectoryPayload): Promise<Directory> => {
    const response = await apiClient.patch(`/directories/${id}`, payload);
    return response.data.data || response.data;
  },

  deleteDirectory: async (id: number): Promise<void> => {
    await apiClient.delete(`/directories/${id}`);
  },

  uploadFiles: async (directoryId: number, files: File[]): Promise<CloudFile[]> => {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`files[${index}]`, file);
    });

    const response = await apiClient.post(`/directories/${directoryId}/files`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data || response.data;
  },

  deleteFile: async (directoryId: number, fileId: number): Promise<void> => {
    await apiClient.delete(`/directories/${directoryId}/files/${fileId}`);
  },
};
