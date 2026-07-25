import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/shared/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import type { CompanyFund } from '../types';
import { companyFundFormSchema, type CompanyFundFormValues } from '../schemas/company-funds.schema';

type CompanyFundsFormProps = {
  defaultValues?: CompanyFund | null;
  onSubmit: (data: CompanyFundFormValues) => Promise<void>;
  loading?: boolean;
};

export function CompanyFundsForm({ defaultValues, onSubmit, loading }: CompanyFundsFormProps) {
  const form = useForm<CompanyFundFormValues>({
    resolver: zodResolver(companyFundFormSchema),
    defaultValues: {
      name: defaultValues?.name ?? '',
    },
  });

  useEffect(() => {
    form.reset({
      name: defaultValues?.name ?? '',
    });
  }, [defaultValues, form]);

  return (
    <Form {...form}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(async (values) => {
          await onSubmit(values);
        })}
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>اسم صندوق الشركة</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'جاري الحفظ...' : 'حفظ'}
        </Button>
      </form>
    </Form>
  );
}
