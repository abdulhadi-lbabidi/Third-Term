import { z } from 'zod';

const numericText = (requiredMessage: string, invalidMessage: string, nonNegativeMessage: string) =>
  z
    .string()
    .min(1, requiredMessage)
    .refine((value) => !Number.isNaN(Number(value)), invalidMessage)
    .refine((value) => Number(value) >= 0, nonNegativeMessage);

export const employeePaymentFormSchema = z.object({
  employee_id: z
    .string()
    .min(1, 'الموظف مطلوب')
    .refine((value) => Number.isInteger(Number(value)) && Number(value) > 0, 'الموظف مطلوب'),
  company_fund_currency_id: z
    .string()
    .min(1, 'عملة صندوق الشركة مطلوبة')
    .refine((value) => Number.isInteger(Number(value)) && Number(value) > 0, 'عملة صندوق الشركة مطلوبة'),
  bonuses: numericText('الزيادات مطلوبة', 'الزيادات يجب أن تكون رقمًا', 'الزيادات يجب أن تكون 0 أو أكثر'),
  deductions: numericText('الاستقطاعات مطلوبة', 'الاستقطاعات يجب أن تكون رقمًا', 'الاستقطاعات يجب أن تكون 0 أو أكثر'),
  payment_date: z.string().min(1, 'تاريخ الدفع مطلوب'),
  amount: numericText('المبلغ مطلوب', 'المبلغ يجب أن يكون رقمًا', 'المبلغ يجب أن يكون 0 أو أكثر'),
});

export type EmployeePaymentFormValues = z.infer<typeof employeePaymentFormSchema>;
