import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Button } from '@/shared/components/ui/button';
import { PageHeader } from '../components/page-header';
import { InvoiceItemDialog } from './components/invoice-item.dialog';
import { InvoiceItemsTable } from './components/invoice-items.table';
import { invoiceItemsApi } from './invoice-items.api';
import type { InvoiceItemFormValues } from './schemas/invoice-items.schema';
import type { CreateInvoiceItemPayload, InvoiceItem, InvoiceItemResponse } from './types';
import { FileSpreadsheet } from 'lucide-react';
import { SimplePagination } from '@/components/ui/pagination';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export function InvoiceItemsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fixedInvoiceId = Number(searchParams.get('invoiceId') || 0) || undefined;
  const isWizard = searchParams.get('wizard') === 'true' && !!fixedInvoiceId;
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const perPage = 10;
  const [dialogOpen, setDialogOpen] = useState(isWizard);
  const [selectedItem, setSelectedItem] = useState<InvoiceItem | null>(null);

  const invoiceItemsQuery = useQuery<InvoiceItemResponse>({
    queryKey: ['invoice-items', page, perPage, fixedInvoiceId],
    queryFn: () => invoiceItemsApi.getInvoiceItems(
      page,
      perPage,
      fixedInvoiceId ? { 'filter[invoice_id]': fixedInvoiceId } : undefined,
    ),
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: CreateInvoiceItemPayload) => {
      if (selectedItem) {
        return invoiceItemsApi.updateInvoiceItem(selectedItem.id, payload);
      }
      return invoiceItemsApi.createInvoiceItem(payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['invoice-items'] });
      setDialogOpen(false);
      setSelectedItem(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (item: InvoiceItem) => invoiceItemsApi.deleteInvoiceItem(item.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['invoice-items'] });
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

  const invoiceItems = invoiceItemsQuery.data?.data ?? [];
  const meta = invoiceItemsQuery.data?.meta;
  const totalPages = meta?.last_page ?? 1;
  const currentPage = meta?.current_page ?? page;

  return (
    <div className="flex flex-col flex-1 space-y-4">
      <PageHeader
        badge="الفواتير"
        title={fixedInvoiceId ? `أصناف الفاتورة #${fixedInvoiceId}` : 'أصناف الفاتورة'}
        icon={FileSpreadsheet}
        action={
          <div className="flex flex-wrap gap-2">
            {isWizard && (
              <Button type="button" variant="outline" onClick={() => navigate(`/invoices/new?invoiceId=${fixedInvoiceId}`)}>
                <ArrowRight className="ml-2 size-4" />
                تعديل بيانات الفاتورة
              </Button>
            )}
            <Button
              type="button"
              onClick={() => {
                setSelectedItem(null);
                setDialogOpen(true);
              }}
            >
              إضافة صنف جديد
            </Button>
            {isWizard && (
              <Button type="button" variant="secondary" onClick={() => navigate('/invoices')}>
                <CheckCircle2 className="ml-2 size-4" />
                إنهاء
              </Button>
            )}
          </div>
        }
      />

      <InvoiceItemsTable
        data={invoiceItems}
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

      <SimplePagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setPage}
        meta={meta}
      />

      <InvoiceItemDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setSelectedItem(null);
        }}
        invoiceItem={selectedItem}
        fixedInvoiceId={fixedInvoiceId}
        onSubmit={handleSubmit}
        loading={saveMutation.isPending}
      />
    </div>
  );
}
