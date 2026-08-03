import type { BaseUserProfile } from '@/features/users/types';
import type { Item } from '@/features/items/types';
import type { Expense } from '@/features/expenses/types';

export type Invoice = {
  id: number;
  item_id: number;
  expense_id: number;
  supplier_id?: number;
  target_account_id?: number;
  invoice_number: string;
  date: string;
  discount: number;
  final_total: number;
  is_posted: boolean;
  is_visible_to_client: boolean;
  
  // Relations
  item?: Item | string;
  expense?: Expense;
  expense_description?: string;
  supplier?: BaseUserProfile | string;
  target_account?: any;
  created_at?: string;
  updated_at?: string;
};

export type CreateInvoicePayload = {
  item_id: number;
  expense_id: number;
  supplier_id?: number;
  date: string;
  discount: number;
  final_total: number;
  is_posted: boolean;
  is_visible_to_client: boolean;
};

export type UpdateInvoicePayload = Partial<CreateInvoicePayload>;
