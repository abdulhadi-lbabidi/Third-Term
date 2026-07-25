import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { Layout } from '@/features/layouts/main.layout';
import { LoginPage } from '@/features/Auth/pages/login.page';
import { UsersPage } from '@/features/users/users.page';
import { NewUserPage } from '@/features/users/new-user.page';
import { FundsPage } from '@/features/funds/funds.page';
import { CurrenciesPage } from '@/features/currencies/currencies.page';
import { CompanyFundsPage } from '@/features/company-funds/company-funds.page';
import { ProjectsPage } from '@/features/projects/projects.page';
import { ProjectFundsPage } from '@/features/projects/project-funds.page';
import { ItemsPage } from '@/features/items/items.page';

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
            path: '/users',
            element: <UsersPage />,
          },
          {
            path: '/users/new',
            element: <NewUserPage />,
          },
          {
            path: '/users/edit/:role/:id',
            element: <NewUserPage />,
          },
          {
            path: '/users/:userId/:userName/funds',
            element: <FundsPage />,
          },
          {
            path: '/company-funds',
            element: <CompanyFundsPage />,
          },
          {
            path: '/projects',
            element: <ProjectsPage />,
          },
          {
            path: '/projects/:projectId/:projectName/funds',
            element: <ProjectFundsPage />,
          },
          {
            path: '/items',
            element: <ItemsPage />,
          },
          {
            path: '/',
            element: <Navigate to="/users" replace />,
          },
          { path: '/funds', element: <FundsPage /> },
          { path: '/currencies', element: <CurrenciesPage /> }
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
