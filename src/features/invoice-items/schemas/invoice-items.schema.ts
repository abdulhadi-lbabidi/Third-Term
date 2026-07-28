import { z } from 'zod';

export const invoiceItemFormSchema = z.object({
  invoice_id: z.number().int().positive('الفاتورة مطلوبة'),
  material_id: z.number().int().positive('المادة مطلوبة'),
  item_description: z.string().trim().min(1, 'وصف الصنف مطلوب'),
  unit: z.string().trim().min(1, 'الوحدة مطلوبة'),
  quantity: z.coerce.number().positive('الكمية يجب أن تكون أكبر من صفر'),
  unit_price: z.coerce.number().min(0, 'سعر الوحدة غير صالح'),
});

export type InvoiceItemFormValues = z.infer<typeof invoiceItemFormSchema>;
