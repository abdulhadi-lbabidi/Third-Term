import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { transfersApi } from './transfers.api';
import type { CreateTransferPayload } from './types';

export function useTransfers(page = 1, perPage = 50, filters?: Record<string, any>, enabled = true) {
  return useQuery({
    queryKey: ['transfers', page, perPage, filters],
    queryFn: () => transfersApi.getTransfers(page, perPage, filters),
    enabled,
  });
}

export function useCreateTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTransferPayload) => transfersApi.createTransfer(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      queryClient.invalidateQueries({ queryKey: ['project-funds'] });
      queryClient.invalidateQueries({ queryKey: ['company-funds'] });
      queryClient.invalidateQueries({ queryKey: ['funds'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'حدث خطأ أثناء إجراء عملية التحويل');
    },
  });
}

export function useDeleteTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => transfersApi.deleteTransfer(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['transfers'] });
      await queryClient.invalidateQueries({ queryKey: ['project-funds'] });
      await queryClient.invalidateQueries({ queryKey: ['company-funds'] });
      await queryClient.invalidateQueries({ queryKey: ['funds'] });
      await queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === 'projects' && typeof query.queryKey[1] === 'number',
        refetchType: 'active',
      });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'حدث خطأ أثناء حذف عملية التحويل');
    },
  });
}

export function useUpdateTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: CreateTransferPayload }) =>
      transfersApi.updateTransfer(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      queryClient.invalidateQueries({ queryKey: ['project-funds'] });
      queryClient.invalidateQueries({ queryKey: ['company-funds'] });
      queryClient.invalidateQueries({ queryKey: ['funds'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'حدث خطأ أثناء تعديل عملية التحويل');
    },
  });
}

export function useTransfer(id: number | undefined, enabled = true) {
  return useQuery({
    queryKey: ['transfers', 'detail', id],
    queryFn: () => transfersApi.getTransfer(id!),
    enabled: Boolean(id) && enabled,
  });
}
