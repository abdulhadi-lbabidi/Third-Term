import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { Layout } from '@/features/layouts/main.layout';
import { LoginPage } from '@/features/Auth/pages/login.page';

const AUTH_TOKEN_KEY = 'token_finance_nouh';

function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

function ProtectedRoute() {
  // if (!getAuthToken()) {
  //   return <Navigate to="/auth/login" replace />;
  // }

  return <Outlet />;
}

function PublicOnlyRoute() {
  if (getAuthToken()) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        هذه الصفحة جاهزة للربط لاحقًا داخل معمارية المشروع.
      </p>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    element: <PublicOnlyRoute />,
    children: [
      {
        path: '/auth/login',
        element: <LoginPage />,
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <Layout />,
        children: [
          {
            path: '/',
            element: <PlaceholderPage title="Dashboard" />,
          },
         
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
