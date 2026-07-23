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
    <div className="min-h-screen bg-[#f5f6fa] lg:grid lg:grid-cols-[280px_1fr]">
      <Sidebar onLogout={handleLogout} />

      <main className="p-4 md:p-6">
        <div className="mx-auto max-w-6xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
