import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form';
import type { CreateUserPayload } from '../types';

const schema = z.object({
  name: z.string().min(1, 'الاسم مطلوب'),
  phone_number: z.string().min(6, 'رقم الهاتف مطلوب'),
  address: z.string().min(1, 'العنوان مطلوب'),
});

type QuickSupplierFormValues = z.infer<typeof schema>;

type QuickSupplierDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateUserPayload) => Promise<void>;
  loading?: boolean;
};

export function QuickSupplierDialog({ open, onOpenChange, onSubmit, loading }: QuickSupplierDialogProps) {
  const form = useForm<QuickSupplierFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      phone_number: '',
      address: '',
    },
  });

  const handleSubmit = async (values: QuickSupplierFormValues) => {
    await onSubmit({
      ...values,
      email: `${Date.now()}@supplier.local`, // Auto-generate email since it's required by backend but maybe not needed by user
      password: '',
      role: 'supplier',
    });
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>إضافة مورد جديد</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>اسم المورد</FormLabel>
                  <FormControl>
                    <Input placeholder="أدخل اسم المورد" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>رقم الهاتف</FormLabel>
                  <FormControl>
                    <Input placeholder="أدخل رقم الهاتف" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>العنوان</FormLabel>
                  <FormControl>
                    <Input placeholder="أدخل العنوان" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'جاري الحفظ...' : 'حفظ'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
