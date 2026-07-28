import type { CreateExpensePayload, ExpenseableType } from './types';

/** نفس شكل الإضافة والتعديل — الحقول السبعة فقط */
export function toExpenseApiPayload(input: {
  expenseable_type: ExpenseableType | string;
  expenseable_id: number;
  description: string;
  amount: number;
  is_posted: boolean;
  user_id: number;
  created_by: number;
}): CreateExpensePayload {
  return {
    expenseable_type: input.expenseable_type as ExpenseableType,
    expenseable_id: Number(input.expenseable_id),
    description: String(input.description),
    amount: Number(input.amount),
    is_posted: Boolean(input.is_posted),
    user_id: Number(input.user_id),
    created_by: Number(input.created_by),
  };
}
