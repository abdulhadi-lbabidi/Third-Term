import { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/shared/components/ui/button';
import { PageHeader } from '@/features/components/page-header';
import { TransfersTable } from './components/transfers.table';
import { TransfersDialog } from './components/transfers.dialog';
import { useTransfers, useCreateTransfer, useUpdateTransfer, useDeleteTransfer } from './transfers.hooks';
import type { Transfer } from './types';
import { ArrowLeftRight, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { SimplePagination } from '@/components/ui/pagination';

import { type DateTimeRangeValue } from '@/shared/components/ui/date-time-range-picker';
import { FilterDrawer } from '@/shared/components/ui/filter-drawer';
import { TransfersFilterForm } from './components/transfers-filter.form';
import type { UserRole } from '@/features/users/types';
import { cn } from '@/shared/lib/utils';
import { format } from 'date-fns';

export function TransfersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(null);

  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [userRole, setUserRole] = useState<UserRole | ''>('');
  const [userId, setUserId] = useState<number | ''>('');

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [sort, setSort] = useState<string | undefined>(undefined);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, any>>({});

  const rangeValue = useMemo(() => {
    return {
      from: dateFrom ? new Date(dateFrom) : undefined,
      to: dateTo ? new Date(dateTo) : undefined,
    };
  }, [dateFrom, dateTo]);

  const handleRangeChange = (value: DateTimeRangeValue | undefined) => {
    setDateFrom(value?.from ? format(value.from, 'yyyy-MM-dd HH:mm:ss') : '');
    setDateTo(value?.to ? format(value.to, 'yyyy-MM-dd HH:mm:ss') : '');
  };

  const handleApplyFilters = () => {
    setAppliedFilters({
      'filter[search]': searchQuery || undefined,
      'filter[created_by]': userId || undefined,
      'filter[date_from]': dateFrom || undefined,
      'filter[date_to]': dateTo || undefined,
    });
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setUserRole('');
    setUserId('');
    setDateFrom('');
    setDateTo('');
    setAppliedFilters({});
    setPage(1);
    queryClient.invalidateQueries({
      queryKey: ['transfers', 1, perPage, { sort: sort || undefined }],
    });
    queryClient.invalidateQueries({
      queryKey: ['transfers', 1, perPage, { sort: undefined }],
    });
  };

  const transfersQuery = useTransfers(page, perPage, {
    ...appliedFilters,
    sort: sort || undefined,
  });
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
          <div className="flex shrink-0 items-center gap-3">
            {(Object.values(appliedFilters).some(Boolean) || sort) ? (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => {
                  handleResetFilters();
                  setSort(undefined);
                }}
                aria-label="إعادة ضبط الفلاتر"
                title="إعادة ضبط الفلاتر"
              >
                <RotateCcw className="size-4" />
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              onClick={() => setFilterDrawerOpen(!filterDrawerOpen)}
              className={cn(Object.values(appliedFilters).some(Boolean) && "border-primary text-primary")}
            >
              <SlidersHorizontal className="size-4" />
              فلترة متقدمة
            </Button>
            <Button
              type="button"
              onClick={handleAddClick}
              className="h-11 rounded-lg px-5 text-sm font-semibold shadow-sm"
            >
              إضافة تحويل
            </Button>
          </div>
        }
      />

      <FilterDrawer
        open={filterDrawerOpen}
        onOpenChange={setFilterDrawerOpen}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
      >
        <TransfersFilterForm
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          userRole={userRole}
          setUserRole={setUserRole}
          userId={userId}
          setUserId={setUserId}
          rangeValue={rangeValue}
          handleRangeChange={handleRangeChange}
        />
      </FilterDrawer>

      <TransfersTable
        data={transfers}
        loading={transfersQuery.isLoading}
        onEdit={handleEditClick}
        onDelete={handleDelete}
        sort={sort}
        onSortChange={setSort}
      />

      <SimplePagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setPage}
        meta={meta}
        limit={perPage}
        limitOptions={[5, 10, 20, 50, 100]}
        onLimitChange={setPerPage}
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
