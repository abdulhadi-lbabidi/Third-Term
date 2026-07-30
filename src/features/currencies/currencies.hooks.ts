import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { currenciesApi } from './currencies.api';
import type { CreateCurrencyPayload } from './types';

export const useCurrencies = (page = 1, perPage = 50) => {
  return useQuery({
    queryKey: ['currencies', page, perPage],
    queryFn: () => currenciesApi.getAll(page, perPage),
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
