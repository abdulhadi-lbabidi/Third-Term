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
    <div className="min-h-screen bg-[#f5f6fa] lg:flex">
      <Sidebar onLogout={handleLogout} />

      <main className="flex-1 p-2 md:p-3">
        <div className="mx-auto max-w-6xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
