import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { ArrowLeftRight, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { PageHeader } from '../components/page-header';
import { Button } from '@/shared/components/ui/button';
import { FilterDrawer } from '@/shared/components/ui/filter-drawer';
import { SimplePagination } from '@/components/ui/pagination';
import { MoneyExchangesTable } from './components/money-exchanges.table';
import { MoneyExchangesDialog } from './components/money-exchanges.dialog';
import { MoneyExchangesFilterForm } from './components/money-exchanges-filter.form';
import { useMoneyExchanges, useCreateMoneyExchange, useDeleteMoneyExchange, useUpdateMoneyExchange } from './money-exchanges.hooks';
import type { MoneyExchange } from './types';
import type { UserRole } from '@/features/users/types';
import { type DateTimeRangeValue } from '@/shared/components/ui/date-time-range-picker';
import { format } from 'date-fns';

export function MoneyExchangesPage() {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExchange, setEditingExchange] = useState<MoneyExchange | null>(null);
  const createMoneyExchange = useCreateMoneyExchange();
  const updateMoneyExchange = useUpdateMoneyExchange();
  const deleteMoneyExchange = useDeleteMoneyExchange();

  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [operation, setOperation] = useState('');
  const [fromCurrency, setFromCurrency] = useState('');
  const [toCurrency, setToCurrency] = useState('');

  const [userRole, setUserRole] = useState<UserRole | ''>('');
  const [userId, setUserId] = useState<number | ''>('');

  const [creatorRole, setCreatorRole] = useState<UserRole | ''>('');
  const [creatorId, setCreatorId] = useState<number | ''>('');

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
      'filter[operation]': operation || undefined,
      'filter[from_currency]': fromCurrency || undefined,
      'filter[to_currency]': toCurrency || undefined,
      'filter[user_id]': userId || undefined,
      'filter[created_by]': creatorId || undefined,
      'filter[date_from]': dateFrom || undefined,
      'filter[date_to]': dateTo || undefined,
    });
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setOperation('');
    setFromCurrency('');
    setToCurrency('');
    setUserRole('');
    setUserId('');
    setCreatorRole('');
    setCreatorId('');
    setDateFrom('');
    setDateTo('');
    setAppliedFilters({});
    setPage(1);
  };

  const moneyExchangesQuery = useMoneyExchanges(page, perPage, {
    ...appliedFilters,
    sort: sort || undefined,
  });

  const handleDelete = async (exchange: MoneyExchange) => {
    await deleteMoneyExchange.mutateAsync(exchange.id);
    toast.success('تم حذف عملية تصريف العملة بنجاح');
  };

  const handleEdit = (exchange: MoneyExchange) => {
    setEditingExchange(exchange);
    setDialogOpen(true);
  };

  const data = moneyExchangesQuery.data?.data ?? [];
  const meta = moneyExchangesQuery.data?.meta;
  const totalPages = meta?.last_page ?? 1;
  const currentPage = meta?.current_page ?? page;

  return (
    <div className="flex flex-col flex-1 space-y-4">
      <PageHeader
        badge="الإدارة المالية"
        title="تصريف العملات"
        icon={ArrowLeftRight}
        action={
          <div className="flex shrink-0 items-center gap-3">
            {Object.values(appliedFilters).some(Boolean) || sort ? (
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
              className="flex items-center gap-2"
            >
              <SlidersHorizontal className="size-4" />
              <span>تصفية</span>
            </Button>
            <Button type="button" onClick={() => setDialogOpen(true)}>
              إضافة تصريف
            </Button>
          </div>
        }
      />

      <FilterDrawer
        open={filterDrawerOpen}
        onOpenChange={setFilterDrawerOpen}
        onApply={() => {
          handleApplyFilters();
          setFilterDrawerOpen(false);
        }}
        onReset={handleResetFilters}
      >
        <MoneyExchangesFilterForm
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          operation={operation}
          setOperation={setOperation}
          fromCurrency={fromCurrency}
          setFromCurrency={setFromCurrency}
          toCurrency={toCurrency}
          setToCurrency={setToCurrency}
          userRole={userRole}
          setUserRole={setUserRole}
          userId={userId}
          setUserId={setUserId}
          creatorRole={creatorRole}
          setCreatorRole={setCreatorRole}
          creatorId={creatorId}
          setCreatorId={setCreatorId}
          rangeValue={rangeValue}
          handleRangeChange={handleRangeChange}
        />
      </FilterDrawer>

      <MoneyExchangesTable
        data={data}
        loading={moneyExchangesQuery.isLoading}
        onEdit={handleEdit}
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

      <MoneyExchangesDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingExchange(null);
        }}
        defaultValues={editingExchange}
        loading={createMoneyExchange.isPending || updateMoneyExchange.isPending}
        onSubmit={async (values) => {
          if (editingExchange) {
            await updateMoneyExchange.mutateAsync({ id: editingExchange.id, payload: values });
            toast.success('تم تعديل عملية تصريف العملة بنجاح');
          } else {
            await createMoneyExchange.mutateAsync(values);
            toast.success('تم إضافة عملية تصريف العملة بنجاح');
          }
          setDialogOpen(false);
        }}
      />
    </div>
  );
}
export default MoneyExchangesPage;
