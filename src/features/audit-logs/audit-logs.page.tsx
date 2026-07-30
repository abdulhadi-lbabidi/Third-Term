import { PageHeader } from '@/features/components/page-header';
import { AuditLogsTable } from './components/audit-logs.table';
import { useAuditLogs } from './audit-logs.hooks';
import { History } from 'lucide-react';

export function AuditLogsPage() {
  const { data: auditLogs = [], isLoading } = useAuditLogs();

  return (
    <div className="space-y-5">
      <PageHeader
        badge="سجل النظام"
        title="سجل العمليات"
        icon={History}
        description="عرض وتتبع كافة العمليات والأنشطة المنفذة في النظام"
      />

      <AuditLogsTable data={auditLogs} loading={isLoading} />
    </div>
  );
}
