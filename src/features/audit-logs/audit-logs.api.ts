import { apiClient } from '@/shared/api/axios.instance';
import type { AuditLog } from './types';

export const auditLogsApi = {
  getAuditLogs: async (): Promise<AuditLog[]> => {
    const response = await apiClient.get('/audit-logs', {
      params: { paginate: true },
    });
    const payload = response.data as { data?: AuditLog[] } | AuditLog[];
    return Array.isArray(payload) ? payload : payload.data ?? [];
  },
};
