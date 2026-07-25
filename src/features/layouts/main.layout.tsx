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
    <div className="flex h-screen overflow-hidden bg-[#f5f6fa]">
      <Sidebar onLogout={handleLogout} />

      <main className="flex-1 py-3 px-4 overflow-x-auto">
        <div className="mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
