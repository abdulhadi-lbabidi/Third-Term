import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components/ui/button';
import { PageHeader } from '../components/page-header';
import { RevenuesTable } from './components/revenues.table';
import { useRevenues, useDeleteRevenue } from './revenues.hooks';
import { useQueryClient } from '@tanstack/react-query';
import type { Revenue } from './types';
import { TrendingUp, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { SimplePagination } from '@/components/ui/pagination';

import { type DateTimeRangeValue } from '@/shared/components/ui/date-time-range-picker';
import { FilterDrawer } from '@/shared/components/ui/filter-drawer';
import { RevenuesFilterForm } from './components/revenues-filter.form';
import type { UserRole } from '@/features/users/types';
import { cn } from '@/shared/lib/utils';
import { format } from 'date-fns';

export function RevenuesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);

  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPosted, setIsPosted] = useState<string>('');

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
      'filter[is_posted]': isPosted === 'true' ? true : isPosted === 'false' ? false : undefined,
      'filter[user_id]': userId || undefined,
      'filter[received_by]': creatorId || undefined,
      'filter[date_from]': dateFrom || undefined,
      'filter[date_to]': dateTo || undefined,
    });
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setIsPosted('');
    setUserRole('');
    setUserId('');
    setCreatorRole('');
    setCreatorId('');
    setDateFrom('');
    setDateTo('');
    setAppliedFilters({});
    setPage(1);
    queryClient.invalidateQueries({
      queryKey: ['revenues', 1, perPage, { sort: sort || undefined }],
    });
    queryClient.invalidateQueries({
      queryKey: ['revenues', 1, perPage, { sort: undefined }],
    });
  };

  const { data: response, isLoading } = useRevenues(page, perPage, {
    ...appliedFilters,
    sort: sort || undefined,
  });
  const deleteMutation = useDeleteRevenue();

  const handleAddClick = () => {
    navigate('/revenues/new');
  };

  const handleEditClick = async (revenue: Revenue) => {
    navigate(`/revenues/new?revenueId=${revenue.id}`);
  };

  const handleDelete = async (revenue: Revenue) => {
    await deleteMutation.mutateAsync(revenue.id);
  };

  const revenues = response?.data ?? [];
  const meta = response?.meta;
  const totalPages = meta?.last_page ?? 1;
  const currentPage = meta?.current_page ?? page;

  return (
    <div className="flex flex-col flex-1 space-y-4">
      <PageHeader
        badge="الإيرادات"
        title="الإيرادات"
        icon={TrendingUp}
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
              onClick={() => setFilterDrawerOpen(true)}
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
              إضافة إيراد جديد
            </Button>
          </div>
        }
      />

      <RevenuesTable
        data={revenues}
        loading={isLoading}
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

      <FilterDrawer
        open={filterDrawerOpen}
        onOpenChange={setFilterDrawerOpen}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
      >
        <RevenuesFilterForm
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isPosted={isPosted}
          setIsPosted={setIsPosted}
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
    </div>
  );
}
