import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { Bell, Check, CheckSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/shared/components/ui/button';
import { apiClient } from '@/shared/api/axios.instance';
import { PageHeader } from '../components/page-header';
import { SimplePagination } from '@/components/ui/pagination';
import { cn } from '@/shared/lib/utils';

export type NotificationItem = {
  id: string;
  type: string;
  notifiable_type: string;
  notifiable_id: number;
  data: {
    title?: string;
    message?: string;
    fund_id?: number;
    balance?: number;
    [key: string]: unknown;
  };
  read_at: string | null;
  created_at: string;
  updated_at: string;
};

type NotificationsPageResponse = {
  data?: NotificationItem[];
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  counts?: {
    total?: number;
    unread?: number;
  };
  unread?: number;
};

export function NotificationsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const perPage = 20;

  const { data: notificationsData, isLoading } = useQuery<NotificationsPageResponse>({
    queryKey: ['notifications-page', page],
    queryFn: async () => {
      const response = await apiClient.get('/notifications', {
        params: { paginate: true, per_page: perPage, page },
      });
      return response.data;
    },
    placeholderData: keepPreviousData,
  });

  const notifications = useMemo(() => {
    const raw = notificationsData?.data;
    if (Array.isArray(raw)) return raw;
    if (notificationsData && typeof notificationsData === 'object' && Array.isArray((notificationsData as any).data?.data)) {
      return (notificationsData as any).data.data as NotificationItem[];
    }
    return [];
  }, [notificationsData]);

  const meta = notificationsData?.meta || (notificationsData as any)?.data;
  const totalPages = meta?.last_page ?? 1;
  const currentPage = meta?.current_page ?? page;

  const unreadCount = useMemo(() => {
    if (typeof notificationsData?.counts?.unread === 'number') {
      return notificationsData.counts.unread;
    }
    if (typeof notificationsData?.unread === 'number') {
      return notificationsData.unread;
    }
    return notifications.filter((item) => item.read_at === null).length;
  }, [notificationsData, notifications]);

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.post(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-page'] });
      toast.success('تم تحديد الإشعار كمقروء');
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post('/notifications/mark-all-read');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-page'] });
      toast.success('تم تحديد جميع الإشعارات كمقروءة');
    },
  });

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4">
      <PageHeader
        badge="النظام"
        title="الإشعارات"
        icon={Bell}
        action={
          unreadCount > 0 ? (
            <Button
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
              className="w-full sm:w-auto"
            >
              <CheckSquare className="size-4" />
              <span>تحديد الكل كمقروء</span>
            </Button>
          ) : null
        }
      />

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-4 items-start animate-pulse">
                <div className="size-3 rounded-full bg-slate-200 mt-2" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-1/4" />
                  <div className="h-3 bg-slate-200 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500">لا توجد إشعارات حالياً.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "p-4 flex items-start gap-4 transition-colors hover:bg-slate-50/50",
                  item.read_at ? "bg-white" : "bg-slate-50/60 font-medium"
                )}
              >
                {!item.read_at ? (
                  <span className="size-2.5 rounded-full bg-red-500 shrink-0 mt-2 animate-pulse" />
                ) : (
                  <div className="size-2.5 shrink-0" />
                )}

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-sm font-semibold text-slate-900">{item.data?.title || 'تنبيه'}</h3>
                    <span className="text-xs text-slate-400">
                      {new Date(item.created_at).toLocaleString('ar-SA', { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </div>
                  {item.data?.message && (
                    <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">{item.data.message}</p>
                  )}
                </div>

                {!item.read_at && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => markReadMutation.mutate(item.id)}
                    disabled={markReadMutation.isPending}
                    className="shrink-0 text-xs text-primary hover:text-primary hover:bg-primary/5 h-8 gap-1 px-2.5"
                  >
                    <Check className="size-3.5" />
                    <span>تعين كمقروء</span>
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-2 flex justify-center">
          <SimplePagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
