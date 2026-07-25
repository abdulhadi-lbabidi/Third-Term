import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { currenciesApi } from './currencies.api';
import type { CreateCurrencyPayload } from './types';

export const useCurrencies = () => {
  return useQuery({
    queryKey: ['currencies'],
    queryFn: currenciesApi.getAll,
  });
};

export const useMutateCurrency = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, payload }: { id?: number; payload: CreateCurrencyPayload }) => {
      if (id) return currenciesApi.update(id, payload);
      return currenciesApi.create(payload);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['currencies'] });
    },
  });
};

export const useDeleteCurrency = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => currenciesApi.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['currencies'] });
    },
  });
};
