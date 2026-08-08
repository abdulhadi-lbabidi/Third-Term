import { z } from 'zod';
import type { ExpenseSource } from '../types';

export const expenseFormSchema = z.object({
  source: z.enum(['company_fund', 'user_fund', 'project_fund']),
  expenseable_type: z.string().optional(),
  expenseable_id: z.number().nullable().optional(),
  company_fund_id: z.number().optional(),
  user_role: z.string().optional(),
  user_id: z.number().optional(),
  fund_user_role: z.string().optional(),
  fund_user_id: z.number().optional(),
  user_fund_id: z.number().optional(),
  project_fund_id: z.number().optional(),
  project_id: z.number().optional(),
  description: z.string().min(1, 'الرجاء إدخال البيان'),
  amount: z.number().positive('الرجاء إدخال مبلغ صحيح'),
  is_posted: z.boolean(),
  created_by: z.number().optional(),
}).superRefine((values, ctx) => {
  const requireField = (condition: boolean, path: keyof typeof values, message: string) => {
    if (condition) ctx.addIssue({ code: 'custom', path: [path], message });
  };

  requireField(values.source === 'company_fund' && !values.company_fund_id && !values.expenseable_id, 'company_fund_id', 'الرجاء اختيار صندوق الشركة');
  requireField(values.source === 'company_fund' && !values.expenseable_id, 'expenseable_id', 'الرجاء اختيار عملة صندوق الشركة');

  requireField(values.source === 'user_fund' && !values.fund_user_role && !values.expenseable_id, 'fund_user_role', 'الرجاء اختيار نوع مستخدم الصندوق');
  requireField(values.source === 'user_fund' && !values.fund_user_id && !values.expenseable_id, 'fund_user_id', 'الرجاء اختيار مستخدم الصندوق');
  requireField(values.source === 'user_fund' && !values.user_fund_id && !values.expenseable_id, 'user_fund_id', 'الرجاء اختيار صندوق المستخدم');
  requireField(values.source === 'user_fund' && !values.expenseable_id, 'expenseable_id', 'الرجاء اختيار عملة صندوق المستخدم');

  requireField(values.source === 'project_fund' && !values.project_id && !values.expenseable_id, 'project_id', 'الرجاء اختيار المشروع');
  requireField(values.source === 'project_fund' && !values.project_fund_id && !values.expenseable_id, 'project_fund_id', 'الرجاء اختيار صندوق المشروع');
  requireField(values.source === 'project_fund' && !values.expenseable_id, 'expenseable_id', 'الرجاء اختيار عملة صندوق المشروع');
});

export type ExpenseFormValues = z.infer<typeof expenseFormSchema>;
export type ExpenseFormInput = z.input<typeof expenseFormSchema>;

export const expenseSourceLabels: Record<ExpenseSource, string> = {
  company_fund: 'صندوق الشركة',
  user_fund: 'صندوق مستخدم',
  project_fund: 'صندوق المشروع',
};
