import { useQuery } from '@tanstack/react-query';
import { auditLogsApi } from './audit-logs.api';

export function useAuditLogs(page = 1, perPage = 10) {
  return useQuery({
    queryKey: ['audit-logs', page, perPage],
    queryFn: () => auditLogsApi.getAuditLogs(page, perPage),
  });
}
