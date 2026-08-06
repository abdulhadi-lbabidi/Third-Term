import { apiClient } from '@/shared/api/axios.instance';
import type { AuditLogResponse } from './types';

export const auditLogsApi = {
  getAuditLogs: async (page = 1, perPage = 10, filters?: Record<string, any>): Promise<AuditLogResponse> => {
    const response = await apiClient.get('/audit-logs', {
      params: { paginate: true, page, per_page: perPage, ...filters },
    });
    return response.data;
  },
};
