import { z } from 'zod';
import type { RevenueSource } from '../types';

export const revenueFormSchema = z
  .object({
    source: z.enum(['company_fund', 'user_fund', 'project_fund']),
    revenueable_type: z.string().optional(),
    revenueable_id: z.coerce.number().optional(),
    company_fund_id: z.coerce.number().optional(),
    user_role: z.string().optional(),
    user_id: z.coerce.number().optional(),
    fund_user_role: z.string().optional(),
    fund_user_id: z.coerce.number().optional(),
    user_fund_id: z.coerce.number().optional(),
    project_fund_id: z.coerce.number().optional(),
    project_id: z.coerce.number().optional(),
    statement: z.string().min(1, 'الرجاء إدخال البيان'),
    amount: z.coerce.number().min(0.01, 'الرجاء إدخال مبلغ صحيح أكبر من الصفر'),
    is_posted: z.boolean(),
    received_by: z.coerce.number().optional(),
  })
  .superRefine((values, ctx) => {
    // Removed user_role and user_id mandatory checks

    if (values.source === 'company_fund' && !values.company_fund_id && !values.revenueable_id) {
      ctx.addIssue({
        code: 'custom',
        path: ['company_fund_id'],
        message: 'الرجاء اختيار صندوق الشركة',
      });
    }

    if (values.source === 'company_fund' && !values.revenueable_id) {
      ctx.addIssue({
        code: 'custom',
        path: ['revenueable_id'],
        message: 'الرجاء اختيار عملة صندوق الشركة',
      });
    }

    if (values.source === 'user_fund' && !values.fund_user_role && !values.revenueable_id) {
      ctx.addIssue({
        code: 'custom',
        path: ['fund_user_role'],
        message: 'الرجاء اختيار نوع المستخدم لصندوق المستخدم',
      });
    }

    if (values.source === 'user_fund' && !values.fund_user_id && !values.revenueable_id) {
      ctx.addIssue({
        code: 'custom',
        path: ['fund_user_id'],
        message: 'الرجاء اختيار مستخدم لصندوق المستخدم',
      });
    }

    if (values.source === 'user_fund' && !values.user_fund_id && !values.revenueable_id) {
      ctx.addIssue({
        code: 'custom',
        path: ['user_fund_id'],
        message: 'الرجاء اختيار صندوق المستخدم',
      });
    }

    if (values.source === 'user_fund' && !values.revenueable_id) {
      ctx.addIssue({
        code: 'custom',
        path: ['revenueable_id'],
        message: 'الرجاء اختيار عملة صندوق المستخدم',
      });
    }

    if (values.source === 'project_fund' && !values.project_id && !values.revenueable_id) {
      ctx.addIssue({
        code: 'custom',
        path: ['project_id'],
        message: 'الرجاء اختيار المشروع',
      });
    }

    if (values.source === 'project_fund' && !values.project_fund_id && !values.revenueable_id) {
      ctx.addIssue({
        code: 'custom',
        path: ['project_fund_id'],
        message: 'الرجاء اختيار صندوق المشروع',
      });
    }

    if (values.source === 'project_fund' && !values.revenueable_id) {
      ctx.addIssue({
        code: 'custom',
        path: ['revenueable_id'],
        message: 'الرجاء اختيار عملة صندوق المشروع',
      });
    }
  });

export type RevenueFormValues = z.infer<typeof revenueFormSchema>;
export type RevenueFormInput = z.input<typeof revenueFormSchema>;

export const revenueSourceLabels: Record<RevenueSource, string> = {
  company_fund: 'صندوق الشركة',
  user_fund: 'صندوق مستخدم',
  project_fund: 'صندوق المشروع',
};
