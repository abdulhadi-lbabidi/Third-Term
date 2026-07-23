import { apiClient } from '@/shared/api/axios.instance';
import type { CloudFile, RenameFilePayload } from '../types';

export const filesApi = {
  getFiles: async (folderId?: string): Promise<CloudFile[]> => {
    const response = await apiClient.get('/files', { params: { folderId } });
    return response.data;
  },
  
  deleteFile: async (id: string): Promise<void> => {
    await apiClient.delete(`/files/${id}`);
  },
  
  renameFile: async (id: string, payload: RenameFilePayload): Promise<CloudFile> => {
    const response = await apiClient.patch(`/files/${id}/rename`, payload);
    return response.data;
  },
};
