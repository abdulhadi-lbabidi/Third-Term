export type EmployeePayment = {
  id: number;
  employee_id: number;
  company_fund_currency_id?: number;
  employee: {
    id: number;
    user_id?: number;
    job_title?: string;
    user: {
      id: number;
      name: string;
      email?: string;
      phone_number?: string;
      address?: string;
      created_at?: string;
      updated_at?: string;
    };
    created_at?: string;
    updated_at?: string;
  };
  bonuses: number;
  deductions: number;
  payment_date: string;
  amount: number;
  created_at?: string;
};

export type CreateEmployeePaymentPayload = {
  employee_id: number;
  company_fund_currency_id?: number;
  bonuses: number;
  deductions: number;
  payment_date: string;
  amount: number;
};

export type UpdateEmployeePaymentPayload = CreateEmployeePaymentPayload;
