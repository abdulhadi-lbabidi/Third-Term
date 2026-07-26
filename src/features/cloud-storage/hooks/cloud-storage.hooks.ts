import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
      void queryClient.invalidateQueries({ queryKey: ['directories'] });
    },
  });
};

export const useUpdateDirectory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateDirectoryPayload }) =>
      cloudStorageApi.updateDirectory(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['directories'] });
    },
  });
};

export const useDeleteDirectory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => cloudStorageApi.deleteDirectory(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['directories'] });
    },
  });
};

export const useUploadFiles = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ directoryId, files }: { directoryId: number; files: File[] }) =>
      cloudStorageApi.uploadFiles(directoryId, files),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['directories'] });
      void queryClient.invalidateQueries({ queryKey: ['directories', variables.directoryId] });
    },
  });
};

export const useDeleteFile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ directoryId, fileId }: { directoryId: number; fileId: number }) =>
      cloudStorageApi.deleteFile(directoryId, fileId),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['directories'] });
      void queryClient.invalidateQueries({ queryKey: ['directories', variables.directoryId] });
    },
  });
};

export const useMoveItems = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { targetDirId: number | null; itemIds: { id: number; type: 'file' | 'folder'; data?: any }[] }) => {
      return cloudStorageApi.moveItems(payload);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['directories'] });
    },
  });
};
