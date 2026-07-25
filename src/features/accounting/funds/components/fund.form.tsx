import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { useEffect, useState } from 'react';
import { currenciesApi } from '@/features/currencies/currencies.api';
import type { Currency } from '@/features/currencies/types';

import type { FundTabType } from './fund-tabs';

const getFundSchema = (type: FundTabType) => {
  return z.object({
    name: z.string().min(1, 'Name is required').max(255),
    currency_id: z.coerce.number().min(1, 'Currency is required'),
    owner_id: type === 'personal' ? z.coerce.number().optional() : z.any().optional(),
    project_id: type === 'projects' ? z.coerce.number().min(1, 'Project is required') : z.any().optional(),
  });
};

export type FundFormValues = z.infer<ReturnType<typeof getFundSchema>>;

interface FundFormProps {
  initialData?: Partial<FundFormValues>;
  onSubmit: (values: FundFormValues) => void;
  isLoading?: boolean;
  fundType: FundTabType;
}

export function FundForm({ initialData, onSubmit, isLoading, fundType }: FundFormProps) {
  const [currencies, setCurrencies] = useState<Currency[]>([]);

  useEffect(() => {
    currenciesApi.getCurrencies().then(setCurrencies).catch(console.error);
  }, []);

  const form = useForm<FundFormValues>({
    resolver: zodResolver(getFundSchema(fundType)) as any,
    defaultValues: {
      name: initialData?.name || '',
      currency_id: initialData?.currency_id || 0,
      owner_id: initialData?.owner_id || undefined,
      project_id: initialData?.project_id || undefined,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fund Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter fund name..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="currency_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Currency</FormLabel>
              <Select value={field.value ? String(field.value) : undefined} onValueChange={(val) => field.onChange(Number(val))}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {(Array.isArray(currencies) ? currencies : (currencies as any).data || []).map((currency: any) => (
                    <SelectItem key={currency.id} value={String(currency.id)}>
                      {currency.currency} ({currency.symbol})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {fundType === 'personal' && (
          <FormField
            control={form.control}
            name="owner_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Owner ID (Optional)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Enter owner ID..." {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {fundType === 'projects' && (
          <FormField
            control={form.control}
            name="project_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project ID</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Enter project ID..." {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        
        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Fund'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
