import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { departmentsApi } from './departments.api';
import type { CreateDepartmentPayload, UpdateDepartmentPayload } from './types';

export const useDepartments = (page = 1, perPage = 50) => {
  return useQuery({
    queryKey: ['departments', page, perPage],
    queryFn: () => departmentsApi.getAll(page, perPage),
  });
};

export const useMutateDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id?: number; payload: CreateDepartmentPayload | UpdateDepartmentPayload }) => {
      if (id) return departmentsApi.update(id, payload);
      return departmentsApi.create(payload);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });
};

export const useDeleteDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => departmentsApi.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });
};
