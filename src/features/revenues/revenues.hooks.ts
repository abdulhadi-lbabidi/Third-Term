import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { revenuesApi } from './revenues.api';
import type { CreateRevenuePayload, UpdateRevenuePayload } from './types';
import { toast } from 'sonner';

export const revenuesQueryKeys = {
  all: ['revenues'] as const,
  list: (page: number, perPage: number, filters?: Record<string, any>) => [...revenuesQueryKeys.all, page, perPage, filters] as const,
  detail: (id: number) => [...revenuesQueryKeys.all, id] as const,
};

export function useRevenues(page = 1, perPage = 50, filters?: Record<string, any>, enabled = true) {
  return useQuery({
    queryKey: revenuesQueryKeys.list(page, perPage, filters),
    queryFn: () => revenuesApi.getRevenues(page, perPage, filters),
    enabled,
  });
}

export function useCreateRevenue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateRevenuePayload) => revenuesApi.createRevenue(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: revenuesQueryKeys.all });
      await queryClient.invalidateQueries({ queryKey: ['project-funds'] });
      await queryClient.invalidateQueries({ queryKey: ['company-funds'] });
      await queryClient.invalidateQueries({ queryKey: ['funds'] });
      toast.success('تم إضافة الإيراد بنجاح');
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
      toast.success('تم تعديل الإيراد بنجاح');
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
      await queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === 'projects' && typeof query.queryKey[1] === 'number',
        refetchType: 'active',
      });
      toast.success('تم حذف الإيراد بنجاح');
    },
    onError: () => {
      toast.error('حدث خطأ أثناء حذف الإيراد');
    },
  });
}
