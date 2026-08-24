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
    return apiClient.get<any>(`${endpoint}/${id}`).then(({ data }: any) => data?.data ?? data);
  },

  getUsersByRole: (
    role: UserRole,
    page = 1,
    perPage = 50,
    search?: string,
    sort?: string,
    address?: string
  ): Promise<UsersRoleResponse<any>> => {
    const endpoint = endpointByRole[role];
    if (!endpoint) {
      return Promise.resolve({ data: [] });
    }
    return apiClient.get<any>(endpoint, {
      params: {
        paginate: true,
        page,
        per_page: perPage,
        ...(search ? { 'filter[search]': search } : {}),
        ...(address ? { 'filter[address]': address } : {}),
        sort,
      },
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
    if (payload.images && payload.images.length > 0) {
      const formData = new FormData();
      Object.entries(payload).forEach(([key, val]) => {
        if (key === 'images') {
          const files = val as File[];
          if (files.length === 1) {
            formData.append('image', files[0]);
            formData.append('images[]', files[0]);
          } else {
            files.forEach((file) => {
              formData.append('images[]', file);
            });
          }
        } else if (val !== undefined && val !== null) {
          formData.append(key, val as any);
        }
      });
      return apiClient.post<any>(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }).then(res => res.data);
    }
    return apiClient.post<any>(endpoint, payload).then(res => res.data);
  },

  updateUserByRole: (
    role: UserRole,
    id: number,
    payload: Partial<CreateUserPayload> & { deleted_media_ids?: number[] }
  ): Promise<unknown> => {
    const endpoint = `${endpointByRole[role]}/${id}`;
    const hasImages = payload.images && payload.images.length > 0;
    const hasDeletedImages = payload.deleted_media_ids && payload.deleted_media_ids.length > 0;
    if (hasImages || hasDeletedImages) {
      const formData = new FormData();
      formData.append('_method', 'PATCH');
      Object.entries(payload).forEach(([key, val]) => {
        if (key === 'images') {
          const files = val as File[];
          if (files.length === 1) {
            formData.append('image', files[0]);
            formData.append('images[]', files[0]);
          } else {
            files.forEach((file) => {
              formData.append('images[]', file);
            });
          }
        } else if (key === 'deleted_media_ids') {
          const ids = val as number[];
          ids.forEach((imgId, idx) => {
            formData.append(`deleted_media_ids[${idx}]`, String(imgId));
          });
        } else if (val !== undefined && val !== null) {
          formData.append(key, val as any);
        }
      });
      return apiClient.post<any>(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }).then(res => res.data);
    }
    return apiClient.patch<any>(endpoint, payload).then(res => res.data);
  },

  deleteUserByRole: (role: UserRole, id: number): Promise<void> => {
    return apiClient.delete(`${endpointByRole[role]}/${id}`).then(() => { });
  },

  updatePassword: (payload: {
    email: string;
    password: string;
    password_confirmation: string;
  }): Promise<unknown> => {
    return apiClient.post('/update-password', payload).then(res => res.data);
  },
};
