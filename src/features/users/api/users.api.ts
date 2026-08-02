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
  getUsers: async (): Promise<any[]> => {
    const roles: UserRole[] = [
      'admin',
      'client',
      'investor',
      'craftsman',
      'employee',
      'engineer',
      'supplier',
      'trustee',
    ];
    const promises = roles.map((role) => usersApi.getUsersByRole(role, 1, 1000));
    const results = await Promise.all(promises);
    return results.flatMap((res) => res.data);
  },

  getUserByRole: (
    role: UserRole,
    id: number
  ): Promise<
    AdminRecord | ClientRecord | InvestorRecord | CraftsmanRecord | EmployeeRecord | EngineerRecord | SupplierRecord | TrusteeRecord
  > => {
    const endpoint = endpointByRole[role];
    if (!endpoint) {
      return Promise.resolve(null as any);
    }
    return apiClient.get<any>(`${endpoint}/${id}`).then(({ data }: any) => data);
  },

  getUsersByRole: (
    role: UserRole,
    page = 1,
    perPage = 50
  ): Promise<UsersRoleResponse<any>> => {
    const endpoint = endpointByRole[role];
    if (!endpoint) {
      return Promise.resolve({ data: [] });
    }
    return apiClient.get<any>(endpoint, {
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
