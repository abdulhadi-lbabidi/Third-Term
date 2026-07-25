import { z } from 'zod';

export const projectFormSchema = z.object({
  client_id: z.coerce.number().int().positive('العميل مطلوب'),
  name: z.string().trim().min(1, 'اسم المشروع مطلوب'),
  expected_cost: z.coerce.number().nonnegative('التكلفة المتوقعة يجب أن تكون 0 أو أكثر'),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']),
});

export const projectFundFormSchema = z.object({
  project_id: z.coerce.number().int().positive('المشروع مطلوب'),
  name: z.string().trim().min(1, 'اسم الصندوق مطلوب'),
});

export const attachProjectCurrencySchema = z.object({
  currency_id: z.coerce.number().int().positive('العملة مطلوبة'),
  balance: z.string().trim().min(1, 'الرصيد مطلوب'),
});

export type ProjectFormValues = z.infer<typeof projectFormSchema>;
export type ProjectFundFormValues = z.infer<typeof projectFundFormSchema>;
export type AttachProjectCurrencyValues = z.infer<typeof attachProjectCurrencySchema>;
