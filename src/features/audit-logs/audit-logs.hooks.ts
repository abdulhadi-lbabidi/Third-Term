import { useQuery } from '@tanstack/react-query';
import { auditLogsApi } from './audit-logs.api';

export function useAuditLogs() {
  return useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => auditLogsApi.getAuditLogs(),
  });
}
