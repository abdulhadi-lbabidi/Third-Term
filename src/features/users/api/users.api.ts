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

export const usersApi = {
  getUserByRole: (
    role: UserRole,
    id: number
  ): Promise<
    AdminRecord | ClientRecord | InvestorRecord | CraftsmanRecord | EmployeeRecord | EngineerRecord | SupplierRecord | TrusteeRecord
  > => {
    return apiClient.get<any>(`${endpointByRole[role]}/${id}`).then(({ data }: any) => data?.data);
  },

  getUsersByRole: (
    role: UserRole
  ): Promise<
    | AdminRecord[]
    | ClientRecord[]
    | InvestorRecord[]
    | CraftsmanRecord[]
    | EmployeeRecord[]
    | EngineerRecord[]
    | SupplierRecord[]
    | TrusteeRecord[]
  > => {
    return apiClient.get<any>(endpointByRole[role]).then(({ data }: any) => data?.data);
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
