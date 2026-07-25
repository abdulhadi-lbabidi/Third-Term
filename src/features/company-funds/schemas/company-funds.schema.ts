import { z } from 'zod';

export const companyFundFormSchema = z.object({
  name: z.string().trim().min(1, 'اسم صندوق الشركة مطلوب'),
});

export type CompanyFundFormValues = z.infer<typeof companyFundFormSchema>;
