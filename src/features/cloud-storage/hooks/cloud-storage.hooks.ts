import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cloudStorageApi } from '../api/cloud-storage.api';
import type { CreateDirectoryPayload, UpdateDirectoryPayload } from '../types';

export const useDirectories = (params?: { parent_dir_id?: number | null; project_id?: number | null }) => {
  return useQuery({
    queryKey: ['directories', params],
    queryFn: () => cloudStorageApi.getDirectories(params),
  });
};

export const useDirectory = (id: number) => {
  return useQuery({
    queryKey: ['directories', id],
    queryFn: () => cloudStorageApi.getDirectory(id),
    enabled: !!id,
  });
};

export const useCreateDirectory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateDirectoryPayload) => cloudStorageApi.createDirectory(payload),
    onSuccess: () => {
      toast.success('تم إنشاء المجلد بنجاح');
      queryClient.invalidateQueries({ queryKey: ['directories'] });
    },
    onError: () => {
      toast.error('حدث خطأ أثناء إنشاء المجلد');
    },
  });
};

export const useUpdateDirectory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateDirectoryPayload }) =>
      cloudStorageApi.updateDirectory(id, payload),
    onSuccess: (_, variables) => {
      toast.success('تم تحديث المجلد بنجاح');
      queryClient.invalidateQueries({ queryKey: ['directories'] });
    },
    onError: () => {
      toast.error('حدث خطأ أثناء تحديث المجلد');
    },
  });
};

export const useDeleteDirectory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => cloudStorageApi.deleteDirectory(id),
    onSuccess: () => {
      toast.success('تم حذف المجلد بنجاح');
      queryClient.invalidateQueries({ queryKey: ['directories'] });
    },
    onError: () => {
      toast.error('حدث خطأ أثناء حذف المجلد');
    },
  });
};

export const useUploadFiles = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ directoryId, files }: { directoryId: number; files: File[] }) =>
      cloudStorageApi.uploadFiles(directoryId, files),
    onSuccess: (_, variables) => {
      toast.success('تم رفع الملفات بنجاح');
      queryClient.invalidateQueries({ queryKey: ['directories'] });
      queryClient.invalidateQueries({ queryKey: ['directories', variables.directoryId] });
    },
    onError: () => {
      toast.error('حدث خطأ أثناء رفع الملفات');
    },
  });
};

export const useDeleteFile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ directoryId, fileId }: { directoryId: number; fileId: number }) =>
      cloudStorageApi.deleteFile(directoryId, fileId),
    onSuccess: (_, variables) => {
      toast.success('تم حذف الملف بنجاح');
      queryClient.invalidateQueries({ queryKey: ['directories'] });
      queryClient.invalidateQueries({ queryKey: ['directories', variables.directoryId] });
    },
    onError: () => {
      toast.error('حدث خطأ أثناء حذف الملف');
    },
  });
};
