import { useState } from 'react';
import { PageHeader } from '@/features/components/page-header';
import { AuditLogsTable } from './components/audit-logs.table';
import { useAuditLogs } from './audit-logs.hooks';
import { History } from 'lucide-react';
import { SimplePagination } from '@/components/ui/pagination';

export function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const perPage = 10;
  const { data: response, isLoading } = useAuditLogs(page, perPage);

  const auditLogs = response?.data ?? [];
  const meta = response?.meta;
  const totalPages = meta?.last_page ?? 1;
  const currentPage = meta?.current_page ?? page;

  return (
    <div className="flex flex-col flex-1 space-y-2">
      <PageHeader
        badge="سجل النظام"
        title="سجل العمليات"
        icon={History}
      />

      <AuditLogsTable data={auditLogs} loading={isLoading} />

      <SimplePagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setPage}
        meta={meta}
      />
    </div>
  );
}
