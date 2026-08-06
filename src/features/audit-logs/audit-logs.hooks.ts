import { useQuery } from '@tanstack/react-query';
import { auditLogsApi } from './audit-logs.api';

export function useAuditLogs(page = 1, perPage = 10, filters?: Record<string, any>) {
  return useQuery({
    queryKey: ['audit-logs', page, perPage, filters],
    queryFn: () => auditLogsApi.getAuditLogs(page, perPage, filters),
  });
}
