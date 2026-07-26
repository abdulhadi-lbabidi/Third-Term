import { apiClient } from '@/shared/api/axios.instance';
import type {
  CloudFile,
  Directory,
  CreateDirectoryPayload,
  UpdateDirectoryPayload
} from '../types';

export const cloudStorageApi = {
  getDirectories: (params?: { parent_dir_id?: number | null; project_id?: number | null }) =>
    apiClient.get<Directory[]>('/directories', { params }).then(res => res.data as any),

  getDirectory: (id: number) =>
    apiClient.get<Directory>(`/directories/${id}`).then(res => Array.isArray(res.data) ? res.data[0] : res.data),

  createDirectory: (payload: CreateDirectoryPayload) =>
    apiClient.post<Directory>('/directories', payload),

  updateDirectory: (id: number, payload: UpdateDirectoryPayload) =>
    apiClient.put<Directory>(`/directories/${id}`, payload),

  deleteDirectory: (id: number) =>
    apiClient.delete(`/directories/${id}`),

  uploadFiles: (directoryId: number, files: File[]) => {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`files[${index}]`, file);
    });

    return apiClient.post<CloudFile[]>(`/directories/${directoryId}/files`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });
  },

  deleteFile: (directoryId: number, fileId: number) =>
    apiClient.delete(`/directories/${directoryId}/files/${fileId}`),

  moveItems: (payload: { targetDirId: number | null; itemIds: { id: number; type: 'file' | 'folder'; data?: any }[] }) => {
    const promises = payload.itemIds.map((item) =>
      apiClient.put(`/directories/${item.id}`, {
        parent_dir_id: payload.targetDirId
      })
    );

    return Promise.all(promises);
  },
};
