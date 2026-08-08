import { z } from 'zod';

export const itemFormSchema = z.object({
  name: z.string().trim().min(1, 'اسم البند مطلوب'),
  description: z.string().trim().min(1, 'البيان مطلوب'),
});

export type ItemFormValues = z.infer<typeof itemFormSchema>;
