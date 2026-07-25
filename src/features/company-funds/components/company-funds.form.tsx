import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/shared/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import type { CompanyFund, CreateCompanyFundPayload } from '../types';

type CompanyFundsFormValues = CreateCompanyFundPayload;

type CompanyFundsFormProps = {
  defaultValues?: CompanyFund | null;
  onSubmit: (data: CompanyFundsFormValues) => Promise<void>;
  loading?: boolean;
};

export function CompanyFundsForm({ defaultValues, onSubmit, loading }: CompanyFundsFormProps) {
  const form = useForm<CompanyFundsFormValues>({
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
          rules={{ required: true }}
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
