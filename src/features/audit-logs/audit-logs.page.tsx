import { useState } from 'react';
import { PageHeader } from '@/features/components/page-header';
import { AuditLogsTable } from './components/audit-logs.table';
import { useAuditLogs } from './audit-logs.hooks';
import { History, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { SimplePagination } from '@/components/ui/pagination';
import { useQueryClient } from '@tanstack/react-query';
import type { UserRole } from '@/features/users/types';
import { Button } from '@/shared/components/ui/button';
import { FilterDrawer } from '@/shared/components/ui/filter-drawer';
import { AuditLogsFilterForm } from './components/audit-logs-filter.form';
import { cn } from '@/shared/lib/utils';

export function AuditLogsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const perPage = 10;

  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [actionType, setActionType] = useState<string>('all');
  const [userRole, setUserRole] = useState<UserRole | 'all'>('all');
  const [userId, setUserId] = useState<string>('all');
  const [affectedTable, setAffectedTable] = useState<string>('all');
  const [appliedFilters, setAppliedFilters] = useState<Record<string, any>>({});

  const { data: response, isLoading } = useAuditLogs(page, perPage, appliedFilters);

  const auditLogs = response?.data ?? [];
  const meta = response?.meta;
  const totalPages = meta?.last_page ?? 1;
  const currentPage = meta?.current_page ?? page;

  const handleApplyFilters = () => {
    const filters: Record<string, any> = {};
    if (actionType !== 'all') {
      filters['filter[action_type]'] = actionType;
    }
    if (userId !== 'all') {
      filters['filter[user_id]'] = userId;
    }
    if (affectedTable !== 'all') {
      filters['filter[affected_table]'] = affectedTable;
    }
    setAppliedFilters(filters);
    setPage(1);
  };

  const handleResetFilters = () => {
    setActionType('all');
    setUserRole('all');
    setUserId('all');
    setAffectedTable('all');
    setAppliedFilters({});
    setPage(1);
    queryClient.invalidateQueries({
      queryKey: ['audit-logs'],
    });
  };

  return (
    <div className="flex flex-col flex-1 space-y-4">
      <PageHeader
        badge="سجل النظام"
        title="سجل العمليات"
        icon={History}
        action={
          <div className="flex flex-wrap gap-2">
            {Object.keys(appliedFilters).length > 0 ? (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleResetFilters}
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
              className={cn(Object.keys(appliedFilters).length > 0 && "border-primary text-primary")}
            >
              <SlidersHorizontal className="size-4" />
              فلترة متقدمة
            </Button>
          </div>
        }
      />

      <AuditLogsTable data={auditLogs} loading={isLoading} />

      <SimplePagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setPage}
        meta={meta}
      />

      <FilterDrawer
        open={filterDrawerOpen}
        onOpenChange={setFilterDrawerOpen}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
      >
        <AuditLogsFilterForm
          actionType={actionType}
          setActionType={setActionType}
          affectedTable={affectedTable}
          setAffectedTable={setAffectedTable}
          userRole={userRole}
          setUserRole={setUserRole}
          userId={userId}
          setUserId={setUserId}
        />
      </FilterDrawer>
    </div>
  );
}
