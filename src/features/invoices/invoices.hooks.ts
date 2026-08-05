import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { invoicesApi } from './invoices.api';

export const INVOICES_KEYS = {
  all: ['invoices'] as const,
  lists: () => [...INVOICES_KEYS.all, 'list'] as const,
  list: (filters: string) => [...INVOICES_KEYS.lists(), { filters }] as const,
  details: () => [...INVOICES_KEYS.all, 'detail'] as const,
  detail: (id: number) => [...INVOICES_KEYS.details(), id] as const,
};

export const useInvoices = (params?: Record<string, any>, enabled = true) => {
  return useQuery({
    queryKey: INVOICES_KEYS.list(JSON.stringify(params)),
    queryFn: () => invoicesApi.getInvoices(params),
    enabled,
  });
};

export const useInvoice = (id: number, enabled = true) => {
  return useQuery({
    queryKey: INVOICES_KEYS.detail(id),
    queryFn: () => invoicesApi.getInvoice(id),
    enabled: !!id && enabled,
  });
};

export const useCreateInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: invoicesApi.createInvoice,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: INVOICES_KEYS.lists(),
        refetchType: 'all',
      });
    },
  });
};

export const useUpdateInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: invoicesApi.updateInvoice,
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: INVOICES_KEYS.lists(),
          refetchType: 'all',
        }),
        queryClient.invalidateQueries({
          queryKey: INVOICES_KEYS.detail(variables.id),
          refetchType: 'all',
        }),
      ]);
    },
  });
};

export const useDeleteInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: invoicesApi.deleteInvoice,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: INVOICES_KEYS.lists(),
        refetchType: 'all',
      });
      await queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === 'projects' && typeof query.queryKey[1] === 'number',
        refetchType: 'active',
      });
      toast.success('تم حذف الفاتورة بنجاح');
    },
  });
};
