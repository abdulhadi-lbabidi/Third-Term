import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fundsApi } from '@/features/funds/funds.api';

export const moneyExchangesQueryKeys = {
  all: ['money-exchanges'] as const,
  lists: () => [...moneyExchangesQueryKeys.all, 'list'] as const,
  list: (page: number, perPage: number, filters?: Record<string, any>) => [...moneyExchangesQueryKeys.lists(), page, perPage, filters] as const,
};

export function useMoneyExchanges(page: number, perPage: number, filters?: Record<string, any>) {
  return useQuery({
    queryKey: moneyExchangesQueryKeys.list(page, perPage, filters),
    queryFn: () => fundsApi.getMoneyExchanges({ page, per_page: perPage, ...filters }),
  });
}

export function useCreateMoneyExchange() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      exchangeable_type: string;
      exchangeable_id: number;
      from_currency: number;
      to_currency: number;
      amount: number;
      exchange_rate: number;
      operation: 'multiply' | 'divide';
    }) => fundsApi.exchangeMoney(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: moneyExchangesQueryKeys.all });
      await queryClient.invalidateQueries({ queryKey: ['funds'] });
      await queryClient.invalidateQueries({ queryKey: ['company-funds'] });
      await queryClient.invalidateQueries({ queryKey: ['project-funds'] });
      await queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useDeleteMoneyExchange() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => fundsApi.deleteMoneyExchange(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: moneyExchangesQueryKeys.all });
      await queryClient.invalidateQueries({ queryKey: ['funds'] });
      await queryClient.invalidateQueries({ queryKey: ['company-funds'] });
      await queryClient.invalidateQueries({ queryKey: ['project-funds'] });
      await queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useUpdateMoneyExchange() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: {
      id: number;
      payload: {
        exchangeable_type: string;
        exchangeable_id: number;
        from_currency: number;
        to_currency: number;
        amount: number;
        exchange_rate: number;
        operation: 'multiply' | 'divide';
      };
    }) => fundsApi.updateMoneyExchange(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: moneyExchangesQueryKeys.all });
      await queryClient.invalidateQueries({ queryKey: ['funds'] });
      await queryClient.invalidateQueries({ queryKey: ['company-funds'] });
      await queryClient.invalidateQueries({ queryKey: ['project-funds'] });
      await queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}
