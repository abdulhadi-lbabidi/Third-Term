import { ApiClient } from '@/shared/api/api-client';
import type {
  CloudFile,
  Directory,
  CreateDirectoryPayload,
  UpdateDirectoryPayload
} from '../types';

export const cloudStorageApi = {
  getDirectories: (params?: { parent_dir_id?: number | null; project_id?: number | null }) => 
    ApiClient.get<Directory[]>('/directories', { params }).then(res => res.data as any),

  getDirectory: (id: number) => 
    ApiClient.get<Directory>(`/directories/${id}`).then(res => Array.isArray(res.data) ? res.data[0] : res.data),

  createDirectory: (payload: CreateDirectoryPayload) => 
    ApiClient.post<Directory>('/directories', payload, { successMessage: "تم إنشاء المجلد بنجاح" }),

  updateDirectory: (id: number, payload: UpdateDirectoryPayload) => 
    ApiClient.put<Directory>(`/directories/${id}`, payload, { successMessage: "تم تحديث المجلد بنجاح" }),

  deleteDirectory: (id: number) => 
    ApiClient.delete(`/directories/${id}`, { successMessage: "تم حذف المجلد بنجاح" }),

  uploadFiles: (directoryId: number, files: File[]) => {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`files[${index}]`, file);
    });

    return ApiClient.post<CloudFile[]>(`/directories/${directoryId}/files`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      successMessage: "تم رفع الملفات بنجاح"
    });
  },

  deleteFile: (directoryId: number, fileId: number) => 
    ApiClient.delete(`/directories/${directoryId}/files/${fileId}`, { successMessage: "تم حذف الملف بنجاح" }),

  moveItems: (payload: { targetDirId: number | null; itemIds: { id: number; type: 'file' | 'folder'; data?: any }[] }) => {
    const promises = payload.itemIds.map((item) =>
      ApiClient.put(`/directories/${item.id}`, {
        parent_dir_id: payload.targetDirId
      }, { successMessage: "تم نقل العناصر بنجاح" })
    );

    return Promise.all(promises);
  },
};
