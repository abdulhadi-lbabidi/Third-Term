export type UserRole =
  | 'admin'
  | 'client'
  | 'investor'
  | 'craftsman'
  | 'employee'
  | 'engineer'
  | 'supplier'
  | 'trustee';

export interface BaseUserProfile {
  id: number;
  name: string;
  email: string;
  phone_number: string;
  address: string;
  funds?: unknown[];
  created_at?: string;
  images?: string[] | { url: string }[] | string | null;
  all_images?: { id: number; url: string; name: string }[] | null;
}

export type UserEntity<TExtra = Record<string, unknown>> = {
  id: number;
  created_at: string;
  user: BaseUserProfile;
  role?: UserRole;
} & TExtra;

export interface ClientRecord extends UserEntity<{
  investment_ratio: string;
}> { }

export interface InvestorRecord extends UserEntity<{
  investment_ratio?: string;
}> { }

export interface CraftsmanRecord extends UserEntity<{
  job_title: string;
}> { }

export type EmployeeLastPayment = {
  id: number;
  amount: number;
  bonuses: number;
  deductions: number;
  payment_date: string;
  created_at?: string;
};

export interface EmployeeRecord extends UserEntity<{
  job_title: string;
  status?: 'active' | 'retired' | 'resigned';
  department_id?: number | null;
  department?: { id: number; name: string; main_manager?: string } | null;
  last_payment?: EmployeeLastPayment | null;
}> { }

export interface EngineerRecord extends UserEntity<{
  job_title: string;
  base_salary: string;
  department_id?: number | null;
  department?: { id: number; name: string } | null;
}> { }

export interface SupplierRecord extends UserEntity { }

export interface TrusteeRecord extends UserEntity<{
  kinship_relation: string;
}> { }

export interface AdminRecord {
  id: number;
  created_at: string;
  user: BaseUserProfile;
}

export interface CreateUserBasePayload {
  name: string;
  email: string;
  password: string;
  phone_number: string;
  address: string;
  role: UserRole;
  images?: File[];
}

export interface CreateInvestorPayload extends CreateUserBasePayload {
  role: 'investor';
  investment_ratio: string;
}

export interface CreateEmployeePayload extends CreateUserBasePayload {
  role: 'employee';
  job_title: string;
  status?: 'active' | 'retired' | 'resigned';
  department_id?: number | null;
}

export interface CreateEngineerPayload extends CreateUserBasePayload {
  role: 'engineer';
  job_title: string;
  base_salary: string;
  department_id?: number | null;
}

export interface CreateTrusteePayload extends CreateUserBasePayload {
  role: 'trustee';
  kinship_relation: string;
}

export type CreateUserPayload =
  | CreateUserBasePayload
  | CreateInvestorPayload
  | CreateEmployeePayload
  | CreateEngineerPayload
  | CreateTrusteePayload;
