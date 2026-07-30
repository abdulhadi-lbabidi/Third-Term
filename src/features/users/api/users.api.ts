import { apiClient } from '@/shared/api/axios.instance';
import type {
  AdminRecord,
  ClientRecord,
  CraftsmanRecord,
  CreateUserPayload,
  EmployeeRecord,
  EngineerRecord,
  InvestorRecord,
  SupplierRecord,
  TrusteeRecord,
  UserRole,
} from '../types';
import type { PaginationMeta } from '@/components/ui/pagination';

const endpointByRole: Record<UserRole, string> = {
  admin: '/admins',
  client: '/clients',
  investor: '/investors',
  craftsman: '/craftsmen',
  employee: '/employees',
  engineer: '/engineers',
  supplier: '/suppliers',
  trustee: '/trustees',
};

export type UsersRoleResponse<T> = {
  data: T[];
  meta?: PaginationMeta;
};

export const usersApi = {
  getUserByRole: (
    role: UserRole,
    id: number
  ): Promise<
    AdminRecord | ClientRecord | InvestorRecord | CraftsmanRecord | EmployeeRecord | EngineerRecord | SupplierRecord | TrusteeRecord
  > => {
    return apiClient.get<any>(`${endpointByRole[role]}/${id}`).then(({ data }: any) => data);
  },

  getUsersByRole: (
    role: UserRole,
    page = 1,
    perPage = 50
  ): Promise<UsersRoleResponse<any>> => {
    return apiClient.get<any>(endpointByRole[role], {
      params: { paginate: true, page, per_page: perPage },
    }).then(({ data }: any) => {
      if (Array.isArray(data)) return { data };
      return {
        data: data?.data ?? [],
        meta: data?.meta,
      };
    });
  },

  createUser: (payload: CreateUserPayload): Promise<unknown> => {
    const endpoint = endpointByRole[payload.role];
    return apiClient.post<any>(endpoint, payload).then(res => res.data);
  },

  updateUserByRole: (role: UserRole, id: number, payload: Partial<CreateUserPayload>): Promise<unknown> => {
    return apiClient.patch<any>(`${endpointByRole[role]}/${id}`, payload).then(res => res.data);
  },

  deleteUserByRole: (role: UserRole, id: number): Promise<void> => {
    return apiClient.delete(`${endpointByRole[role]}/${id}`).then(() => { });
  },
};
