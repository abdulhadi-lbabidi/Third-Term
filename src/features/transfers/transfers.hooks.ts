import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { transfersApi } from './transfers.api';
import type { CreateTransferPayload } from './types';

export function useTransfers(page = 1, perPage = 50, filters?: Record<string, any>) {
  return useQuery({
    queryKey: ['transfers', page, perPage, filters],
    queryFn: () => transfersApi.getTransfers(page, perPage, filters),
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      queryClient.invalidateQueries({ queryKey: ['project-funds'] });
      queryClient.invalidateQueries({ queryKey: ['company-funds'] });
      queryClient.invalidateQueries({ queryKey: ['funds'] });
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
