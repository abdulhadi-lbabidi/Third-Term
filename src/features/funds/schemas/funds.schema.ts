import { z } from 'zod';

export const fundFormSchema = z.object({
  user_id: z.number().int().positive('المستخدم مطلوب'),
  name: z.string().trim().min(1, 'اسم الصندوق مطلوب'),
});

export const attachFundCurrencySchema = z.object({
  currency_id: z.number().int().positive('العملة مطلوبة'),
  balance: z.string().trim().min(1, 'الرصيد مطلوب'),
});

export type FundFormValues = z.infer<typeof fundFormSchema>;
export type AttachFundCurrencyValues = z.infer<typeof attachFundCurrencySchema>;
