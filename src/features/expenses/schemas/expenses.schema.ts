import { z } from 'zod';
import type { ExpenseSource } from '../types';

export const expenseFormSchema = z
  .object({
    source: z.enum(['company_fund', 'user_fund', 'project_fund']),
    expenseable_type: z.string().optional(),
    expenseable_id: z.number().optional(),
    user_role: z.string().optional(),
    user_id: z.number().optional(),
    fund_user_role: z.string().optional(),
    fund_user_id: z.number().optional(),
    project_id: z.number().optional(),
    description: z.string().min(1, 'الرجاء إدخال الوصف'),
    amount: z.number().positive('الرجاء إدخال مبلغ صحيح'),
    is_posted: z.boolean(),
    created_by: z.number().optional(),
  })
  .superRefine((values, ctx) => {
    if (!values.user_role) {
      ctx.addIssue({
        code: 'custom',
        path: ['user_role'],
        message: 'الرجاء اختيار نوع المستخدم',
      });
    }

    if (!values.user_id) {
      ctx.addIssue({
        code: 'custom',
        path: ['user_id'],
        message: 'الرجاء اختيار المستخدم',
      });
    }

    if (values.source === 'user_fund' && !values.fund_user_role) {
      ctx.addIssue({
        code: 'custom',
        path: ['fund_user_role'],
        message: 'الرجاء اختيار نوع المستخدم لصندوق المستخدم',
      });
    }

    if (values.source === 'user_fund' && !values.fund_user_id) {
      ctx.addIssue({
        code: 'custom',
        path: ['fund_user_id'],
        message: 'الرجاء اختيار مستخدم لصندوق المستخدم',
      });
    }

    if (values.source === 'company_fund' && !values.expenseable_id) {
      ctx.addIssue({
        code: 'custom',
        path: ['expenseable_id'],
        message: 'الرجاء اختيار صندوق الشركة',
      });
    }

    if (values.source === 'user_fund' && !values.expenseable_id) {
      ctx.addIssue({
        code: 'custom',
        path: ['expenseable_id'],
        message: 'الرجاء اختيار صندوق المستخدم',
      });
    }

    if (values.source === 'project_fund' && !values.project_id) {
      ctx.addIssue({
        code: 'custom',
        path: ['project_id'],
        message: 'الرجاء اختيار المشروع',
      });
    }

    if (values.source === 'project_fund' && !values.expenseable_id) {
      ctx.addIssue({
        code: 'custom',
        path: ['expenseable_id'],
        message: 'الرجاء اختيار صندوق المشروع',
      });
    }
  });

export type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

export const expenseSourceLabels: Record<ExpenseSource, string> = {
  company_fund: 'صندوق الشركة',
  user_fund: 'صندوق مستخدم',
  project_fund: 'صندوق المشروع',
};
