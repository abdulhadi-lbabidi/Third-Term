import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { cn } from '@/shared/lib/utils';
import { apiClient } from '@/shared/api/axios.instance';

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

type NotificationsResponse = {
  data?: {
    data?: NotificationItem[];
  };
  counts?: {
    total?: number;
    unread?: number;
  };
  unread?: number;
};

export function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: notificationsData } = useQuery<NotificationsResponse>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await apiClient.get('/notifications', {
        params: { paginate: true, per_page: 5, page: 1 },
      });
      return response.data;
    },
    refetchInterval: 5 * 60 * 1000,
  });

  const notifications: NotificationItem[] = Array.isArray(notificationsData?.data?.data)
    ? notificationsData.data.data
    : Array.isArray(notificationsData?.data)
    ? (notificationsData.data as unknown as NotificationItem[])
    : Array.isArray(notificationsData)
    ? (notificationsData as unknown as NotificationItem[])
    : [];

  const unreadCount =
    typeof notificationsData?.counts?.unread === 'number'
      ? notificationsData.counts.unread
      : typeof notificationsData?.unread === 'number'
      ? notificationsData.unread
      : notifications.filter((item) => item.read_at === null).length;

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.post(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post('/notifications/mark-all-read');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative flex size-8 shrink-0 items-center justify-center rounded-md border border-sidebar-border text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          aria-label="الإشعارات"
          title="الإشعارات"
        >
          <Bell className="size-4" />
          {unreadCount > 0 ? (
            <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          ) : null}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-2 space-y-2">
        <div className="flex items-center justify-between px-2 py-1.5 border-b border-border">
          <span className="font-semibold text-sm">الإشعارات</span>
          {unreadCount > 0 ? (
            <button
              type="button"
              onClick={() => markAllReadMutation.mutate()}
              className="text-xs text-primary hover:underline font-medium"
              disabled={markAllReadMutation.isPending}
            >
              تحديد الكل كمقروء
            </button>
          ) : null}
        </div>
        <div className="max-h-80 overflow-y-auto space-y-1">
          {notifications.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted-foreground">لا توجد إشعارات</div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                className={cn(
                  'p-2.5 rounded-lg border text-xs space-y-1 transition-colors',
                  item.read_at ? 'bg-slate-100 border-slate-100 opacity-60' : 'bg-slate-200 border-slate-200/80 font-medium'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold text-foreground">{item.data?.title || 'تنبيه'}</span>
                  {item.read_at ? (
                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">مقروء</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => markReadMutation.mutate(item.id)}
                      className="text-[11px] text-primary hover:underline shrink-0"
                      disabled={markReadMutation.isPending}
                    >
                      تعليم كمقروء
                    </button>
                  )}
                </div>
                {item.data?.message ? (
                  <p className="text-muted-foreground leading-relaxed">{item.data.message}</p>
                ) : null}
                <div className="text-[10px] text-muted-foreground/70 text-end">
                  {new Date(item.created_at).toLocaleString('ar-SA', { dateStyle: 'short', timeStyle: 'short' })}
                </div>
              </div>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
