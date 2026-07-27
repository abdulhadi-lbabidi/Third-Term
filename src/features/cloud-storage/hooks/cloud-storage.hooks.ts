import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cloudStorageApi } from '../api/cloud-storage.api';
import type { CreateDirectoryPayload, UpdateDirectoryPayload } from '../types';

// ──────────────────────────────────────────────────────────
// GET /api/directories?paginate=1&per_page=10&page=1
// Used for the root listing when no directory is open.
// ──────────────────────────────────────────────────────────
export const useDirectories = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: ['directories', 'list', params],
    queryFn: () => cloudStorageApi.getDirectories(params),
  });
};

// ──────────────────────────────────────────────────────────
// GET /api/directories/{id}
// Returns the directory with its `files[]` and `children[]`.
// Used when the user navigates into a specific folder.
// ──────────────────────────────────────────────────────────
export const useDirectory = (id: number | null) => {
  return useQuery({
    queryKey: ['directories', id],
    queryFn: () => cloudStorageApi.getDirectory(id!),
    enabled: id !== null && id > 0,
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
    mutationFn: (payload: {
      targetDirId: number | null;
      itemIds: { id: number; type: 'file' | 'folder'; data?: any }[];
    }) => cloudStorageApi.moveItems(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['directories'] });
    },
  });
};
