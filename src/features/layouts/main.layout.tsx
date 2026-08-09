import { Outlet, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Menu } from 'lucide-react';
import { apiClient } from '@/shared/api/axios.instance';
import { Sidebar } from './components/sidebar';
import { Button } from '@/shared/components/ui/button';

const AUTH_TOKEN_KEY = 'token_finance_nouh';

export function Layout() {
  const navigate = useNavigate();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  async function handleLogout() {
    try {
      await apiClient.post('/logout');
    } catch {
    }
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_info');
    navigate('/auth/login', { replace: true });
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        onLogout={handleLogout}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />
      <main className="flex min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto">
        <div className="sticky top-0 z-30 flex h-14 shrink-0 items-center border-b border-border bg-background/95 px-4 backdrop-blur md:hidden">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => setMobileSidebarOpen(true)}
            aria-label="فتح القائمة الجانبية"
          >
            <Menu className="size-5" />
          </Button>
          <span className="ms-3 text-sm font-semibold">نوح المالية</span>
        </div>
        <div className="page-shell flex flex-col flex-1 px-4 py-4 sm:px-5 sm:py-5 lg:px-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
