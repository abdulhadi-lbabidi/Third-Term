import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Button } from '@/shared/components/ui/button';
import { PageHeader } from '../components/page-header';
import { InvoiceItemDialog } from './components/invoice-item.dialog';
import { InvoiceItemsTable } from './components/invoice-items.table';
import { invoiceItemsApi } from './invoice-items.api';
import type { InvoiceItemFormValues } from './schemas/invoice-items.schema';
import type { CreateInvoiceItemPayload, InvoiceItem } from './types';
import { FileSpreadsheet } from 'lucide-react';

const invoiceItemsQueryKeys = {
  all: ['invoice-items'] as const,
};

export function InvoiceItemsPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InvoiceItem | null>(null);

  const invoiceItemsQuery = useQuery<InvoiceItem[]>({
    queryKey: invoiceItemsQueryKeys.all,
    queryFn: () => invoiceItemsApi.getInvoiceItems(),
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: CreateInvoiceItemPayload) => {
      if (selectedItem) {
        return invoiceItemsApi.updateInvoiceItem(selectedItem.id, payload);
      }
      return invoiceItemsApi.createInvoiceItem(payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: invoiceItemsQueryKeys.all });
      setDialogOpen(false);
      setSelectedItem(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (item: InvoiceItem) => invoiceItemsApi.deleteInvoiceItem(item.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: invoiceItemsQueryKeys.all });
    },
  });

  const handleSubmit = async (values: InvoiceItemFormValues) => {
    const payload: CreateInvoiceItemPayload = {
      invoice_id: values.invoice_id,
      material_id: values.material_id,
      item_description: values.item_description,
      unit: values.unit,
      quantity: values.quantity,
      unit_price: values.unit_price,
    };

    await saveMutation.mutateAsync(payload);
    toast.success(selectedItem ? 'تم تعديل صنف الفاتورة بنجاح' : 'تم إضافة صنف الفاتورة بنجاح');
  };

  const handleDelete = async (item: InvoiceItem) => {
    await deleteMutation.mutateAsync(item);
    toast.success('تم حذف صنف الفاتورة بنجاح');
  };

  return (
    <div className="space-y-5">
      <PageHeader
        badge="الفواتير"
        title="أصناف الفاتورة"
        icon={FileSpreadsheet}
        action={
          <Button
            type="button"
            onClick={() => {
              setSelectedItem(null);
              setDialogOpen(true);
            }}
          >
            إضافة صنف جديد
          </Button>
        }
      />

      <InvoiceItemsTable
        data={invoiceItemsQuery.data ?? []}
        loading={invoiceItemsQuery.isLoading}
        onEdit={(item) => {
          setSelectedItem({
            ...item,
            invoice_id: item.invoice_id ?? item.invoice?.id,
            material_id: item.material_id ?? item.material?.id,
          });
          setDialogOpen(true);
        }}
        onDelete={handleDelete}
      />

      <InvoiceItemDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setSelectedItem(null);
        }}
        invoiceItem={selectedItem}
        onSubmit={handleSubmit}
        loading={saveMutation.isPending}
      />
    </div>
  );
}
