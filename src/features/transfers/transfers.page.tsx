import { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { PageHeader } from '@/features/components/page-header';
import { TransfersTable } from './components/transfers.table';
import { TransfersDialog } from './components/transfers.dialog';
import { useTransfers, useCreateTransfer, useUpdateTransfer, useDeleteTransfer } from './transfers.hooks';
import type { Transfer } from './types';
import { ArrowLeftRight } from 'lucide-react';
import { SimplePagination } from '@/components/ui/pagination';

export function TransfersPage() {
  const [page, setPage] = useState(1);
  const perPage = 50;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(null);

  const transfersQuery = useTransfers(page, perPage);
  const createMutation = useCreateTransfer();
  const updateMutation = useUpdateTransfer();
  const deleteMutation = useDeleteTransfer();

  const handleAddClick = () => {
    setSelectedTransfer(null);
    setDialogOpen(true);
  };

  const handleEditClick = (transfer: Transfer) => {
    setSelectedTransfer(transfer);
    setDialogOpen(true);
  };

  const handleDelete = async (transfer: Transfer) => {
    await deleteMutation.mutateAsync(transfer.id);
  };

  const handleSubmit = async (data: any) => {
    if (selectedTransfer) {
      await updateMutation.mutateAsync({ id: selectedTransfer.id, payload: data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const transfers = transfersQuery.data?.data ?? [];
  const meta = transfersQuery.data?.meta;
  const totalPages = meta?.last_page ?? 1;
  const currentPage = meta?.current_page ?? page;

  return (
    <div className="flex flex-col flex-1 space-y-4">
      <PageHeader
        badge="التحويلات"
        title="التحويلات المالية"
        icon={ArrowLeftRight}
        action={
          <Button
            type="button"
            onClick={handleAddClick}
            className="h-11 rounded-lg bg-slate-950 px-5 text-sm font-semibold shadow-sm hover:bg-slate-800"
          >
            إضافة تحويل
          </Button>
        }
      />

      <TransfersTable
        data={transfers}
        loading={transfersQuery.isLoading}
        onEdit={handleEditClick}
        onDelete={handleDelete}
      />

      <SimplePagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setPage}
        meta={meta}
      />

      {dialogOpen && (
        <TransfersDialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setSelectedTransfer(null);
          }}
          isGeneral={true}
          defaultValues={selectedTransfer}
          onSubmit={handleSubmit}
          loading={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  );
}
