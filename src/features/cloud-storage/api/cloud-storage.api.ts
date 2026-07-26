import { apiClient } from '@/shared/api/axios.instance';
import type {
  CloudFile,
  Directory,
  CreateDirectoryPayload,
  UpdateDirectoryPayload,
} from '../types';

export interface PaginatedDirectories {
  data: Directory[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export const cloudStorageApi = {
  // GET /api/directories?paginate=1&per_page=10&page=1
  getDirectories: (params?: Record<string, any>): Promise<Directory[] | PaginatedDirectories | any> =>
    apiClient
      .get<PaginatedDirectories>('/directories', {
        params: { paginate: 1, per_page: 10, page: 1, ...params },
      })
      .then(({ data }: any) => data?.data ?? data),

  // GET /api/directories/{id}  → returns directory with files[] and children[]
  getDirectory: (id: number): Promise<Directory> =>
    apiClient
      .get<Directory>(`/directories/${id}`)
      .then(({ data }: any) => {
        const payload = data?.data ?? data;
        return Array.isArray(payload) ? payload[0] : payload;
      }),

  createDirectory: (payload: CreateDirectoryPayload): Promise<Directory> =>
    apiClient
      .post<Directory>('/directories', payload)
      .then(({ data }: any) => data?.data ?? data),

  updateDirectory: (id: number, payload: UpdateDirectoryPayload): Promise<Directory> =>
    apiClient
      .put<Directory>(`/directories/${id}`, payload)
      .then(({ data }: any) => data?.data ?? data),

  deleteDirectory: (id: number): Promise<void> =>
    apiClient
      .delete(`/directories/${id}`)
      .then(({ data }: any) => data?.data ?? data),

  uploadFiles: (directoryId: number, files: File[]): Promise<CloudFile[]> => {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`files[${index}]`, file);
    });

    return apiClient
      .post<CloudFile[]>(`/directories/${directoryId}/files`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then(({ data }: any) => data?.data ?? data);
  },

  deleteFile: (directoryId: number, fileId: number): Promise<void> =>
    apiClient
      .delete(`/directories/${directoryId}/files/${fileId}`)
      .then(({ data }: any) => data?.data ?? data),

  moveItems: (payload: {
    targetDirId: number | null;
    itemIds: { id: number; type: 'file' | 'folder'; data?: any }[];
  }): Promise<Directory[]> => {
    const promises = payload.itemIds.map((item) =>
      apiClient
        .put(`/directories/${item.id}`, { parent_dir_id: payload.targetDirId })
        .then(({ data }: any) => data?.data ?? data)
    );
    return Promise.all(promises);
  },
};
