import { useQuery } from '@tanstack/react-query';
import { Menu, User, LogOut, ArrowRight } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { Button } from '@/shared/components/ui/button';
import { apiClient } from '@/shared/api/axios.instance';
import { NotificationsDropdown } from './notifications-dropdown';

type HeaderProps = {
  onLogout: () => void;
  onOpenMobileSidebar: () => void;
};

type UserProfile = {
  id: number;
  name: string;
  email: string;
  role_type?: string;
};

const ROOT_PATHS = [
  '/',
  '/users',
  '/funds',
  '/company-funds',
  '/projects',
  '/items',
  '/materials',
  '/invoice-items',
  '/employee-payments',
  '/increments',
  '/expenses',
  '/revenues',
  '/transfers',
  '/invoices',
  '/unposted-invoices',
  '/re-invoices',
  '/currencies',
  '/departments',
  '/cloud-storage',
  '/audit-logs',
];

export function Header({ onLogout, onOpenMobileSidebar }: HeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const isRootPath = ROOT_PATHS.includes(location.pathname);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      const segments = location.pathname.split('/');
      const basePath = segments.length > 1 ? `/${segments[1]}` : '/';
      navigate(basePath);
    }
  };

  const { data: currentUser } = useQuery<UserProfile | null>({
    queryKey: ['me'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/me');
        return response.data?.data ?? response.data ?? null;
      } catch {
        const cached = localStorage.getItem('user_info');
        return cached ? JSON.parse(cached) : null;
      }
    },
  });

  const userDisplayName = currentUser?.name || 'سامر كمال الدسوقي';
  const userEmail = currentUser?.email || 'admin_1@example.com';
  const userRoleName = currentUser?.role_type === 'user' ? 'مستخدم' : currentUser?.role_type || 'Admin';

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur">
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={onOpenMobileSidebar}
          className="md:hidden shrink-0"
          aria-label="فتح القائمة الجانبية"
        >
          <Menu className="size-5" />
        </Button>
        <span className="md:hidden text-sm font-semibold">نوح المالية</span>
        {!isRootPath && (
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center justify-center p-1.5 rounded-full hover:bg-accent text-slate-300 hover:text-slate-500 transition-colors shrink-0"
            aria-label="رجوع"
            title="رجوع"
          >
            <ArrowRight className="size-5" />
          </button>
        )}
      </div>
      <div className="flex items-center gap-3">
        <NotificationsDropdown />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex h-10 items-center gap-3 rounded-md px-2 text-start transition-colors hover:bg-accent hover:text-accent-foreground outline-none border border-border"
            >
              <div className="relative flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <User className="size-4" />
                <span className="absolute bottom-0 end-0 size-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
              </div>
              <div className="hidden sm:block min-w-0 text-start">
                <p className="truncate text-xs font-semibold text-foreground leading-tight">{userDisplayName}</p>
                <p className="truncate text-[10px] text-muted-foreground leading-none">{userRoleName}</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 border-border shadow-md">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{userDisplayName}</p>
                <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>
                <p className="text-xs leading-none text-muted-foreground">{userRoleName}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogout} className="cursor-pointer text-red-600 focus:bg-red-500/10 focus:text-red-600">
              <LogOut className="mr-2 size-4" />
              <span>تسجيل الخروج</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
