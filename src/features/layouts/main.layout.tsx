import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './components/sidebar';

const AUTH_TOKEN_KEY = 'token_finance_nouh';

export function Layout() {
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    navigate('/auth/login', { replace: true });
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[#f5f6fa] lg:flex">
      <Sidebar onLogout={handleLogout} />

      <main className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-3">
        <div className="mx-auto flex min-h-0 w-full flex-1 flex-col">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
