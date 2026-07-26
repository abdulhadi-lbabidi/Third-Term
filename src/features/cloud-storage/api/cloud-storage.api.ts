import { apiClient } from '@/shared/api/axios.instance';
import type {
  CloudFile,
  Directory,
  CreateDirectoryPayload,
  UpdateDirectoryPayload
} from '../types';

export const cloudStorageApi = {
  getDirectories: (params?: { parent_dir_id?: number | null; project_id?: number | null }) =>
    apiClient.get<Directory[]>('/directories', { params }).then(({ data }: any) => data?.data ?? data),

  getDirectory: (id: number) =>
    apiClient.get<Directory>(`/directories/${id}`).then(({ data }: any) => {
      const payload = data?.data ?? data;
      return Array.isArray(payload) ? payload[0] : payload;
    }),

  createDirectory: (payload: CreateDirectoryPayload) =>
    apiClient.post<Directory>('/directories', payload).then(({ data }: any) => data?.data ?? data),

  updateDirectory: (id: number, payload: UpdateDirectoryPayload) =>
    apiClient.put<Directory>(`/directories/${id}`, payload).then(({ data }: any) => data?.data ?? data),

  deleteDirectory: (id: number) =>
    apiClient.delete(`/directories/${id}`).then(({ data }: any) => data?.data ?? data),

  uploadFiles: (directoryId: number, files: File[]) => {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`files[${index}]`, file);
    });

    return apiClient.post<CloudFile[]>(`/directories/${directoryId}/files`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    }).then(({ data }: any) => data?.data ?? data);
  },

  deleteFile: (directoryId: number, fileId: number) =>
    apiClient.delete(`/directories/${directoryId}/files/${fileId}`).then(({ data }: any) => data?.data ?? data),

  moveItems: (payload: { targetDirId: number | null; itemIds: { id: number; type: 'file' | 'folder'; data?: any }[] }) => {
    const promises = payload.itemIds.map((item) =>
      apiClient.put(`/directories/${item.id}`, {
        parent_dir_id: payload.targetDirId
      }).then(({ data }: any) => data?.data ?? data)
    );

    return Promise.all(promises);
  },
};
