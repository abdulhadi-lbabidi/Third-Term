import { Outlet, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { apiClient } from '@/shared/api/axios.instance';
import { Sidebar } from './components/sidebar';
import { Header } from './components/header';

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
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />
      <main className="flex min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto">
        <Header
          onLogout={handleLogout}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
        />
        <div className="page-shell flex flex-col flex-1 px-4 py-4 sm:px-5 sm:py-5 lg:px-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
