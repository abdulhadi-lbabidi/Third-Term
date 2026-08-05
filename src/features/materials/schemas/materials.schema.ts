import { z } from 'zod';

export const materialFormSchema = z.object({
  item_id: z.number().int().positive('البند مطلوب'),
  name: z.string().trim().min(1, 'اسم المادة مطلوب'),
  description: z.string().trim().min(1, 'الوصف مطلوب'),
});

export type MaterialFormValues = z.infer<typeof materialFormSchema>;
