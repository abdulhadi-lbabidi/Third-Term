import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { revenuesApi } from './revenues.api';
import type { CreateRevenuePayload, UpdateRevenuePayload } from './types';
import { toast } from 'sonner';

export const revenuesQueryKeys = {
  all: ['revenues'] as const,
  list: (page: number, perPage: number) => [...revenuesQueryKeys.all, page, perPage] as const,
  detail: (id: number) => [...revenuesQueryKeys.all, id] as const,
};

export function useRevenues(page = 1, perPage = 50) {
  return useQuery({
    queryKey: revenuesQueryKeys.list(page, perPage),
    queryFn: () => revenuesApi.getRevenues(page, perPage),
  });
}

export function useCreateRevenue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateRevenuePayload) => revenuesApi.createRevenue(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: revenuesQueryKeys.all });
    },
    onError: () => {
      toast.error('حدث خطأ أثناء إضافة الإيراد');
    },
  });
}

export function useUpdateRevenue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateRevenuePayload }) =>
      revenuesApi.updateRevenue(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: revenuesQueryKeys.all });
    },
    onError: () => {
      toast.error('حدث خطأ أثناء تعديل الإيراد');
    },
  });
}

export function useDeleteRevenue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => revenuesApi.deleteRevenue(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: revenuesQueryKeys.all });
    },
    onError: () => {
      toast.error('حدث خطأ أثناء حذف الإيراد');
    },
  });
}
