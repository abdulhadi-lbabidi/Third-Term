import { z } from 'zod';

const numericText = (requiredMessage: string, invalidMessage: string, positiveMessage: string) =>
  z
    .string()
    .min(1, requiredMessage)
    .refine((value) => !Number.isNaN(Number(value)), invalidMessage)
    .refine((value) => Number(value) > 0, positiveMessage);

export const incrementFormSchema = z.object({
  employee_id: z
    .string()
    .min(1, 'الموظف مطلوب')
    .refine((value) => Number.isInteger(Number(value)) && Number(value) > 0, 'الموظف مطلوب'),
  date: z.string().min(1, 'التاريخ مطلوب'),
  amount: numericText('المبلغ مطلوب', 'المبلغ يجب أن يكون رقمًا', 'المبلغ يجب أن يكون أكبر من 0'),
  reason: z.string().min(1, 'السبب مطلوب'),
});

export type IncrementFormValues = z.infer<typeof incrementFormSchema>;
