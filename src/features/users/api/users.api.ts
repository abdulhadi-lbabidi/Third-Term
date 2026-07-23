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
  getUserByRole: async (
    role: UserRole,
    id: number
  ): Promise<
    AdminRecord | ClientRecord | InvestorRecord | CraftsmanRecord | EmployeeRecord | EngineerRecord | SupplierRecord | TrusteeRecord
  > => {
    const response = await apiClient.get(`${endpointByRole[role]}/${id}`);
    return response.data;
  },

  getUsersByRole: async (
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
    const response = await apiClient.get(endpointByRole[role]);
    return response.data;
  },

  createUser: async (payload: CreateUserPayload): Promise<unknown> => {
    const endpoint = endpointByRole[payload.role];
    const response = await apiClient.post(endpoint, payload);
    return response.data;
  },

  updateUserByRole: async (role: UserRole, id: number, payload: Partial<CreateUserPayload>): Promise<unknown> => {
    const response = await apiClient.patch(`${endpointByRole[role]}/${id}`, payload);
    return response.data;
  },

  deleteUserByRole: async (role: UserRole, id: number): Promise<void> => {
    await apiClient.delete(`${endpointByRole[role]}/${id}`);
  },
};
