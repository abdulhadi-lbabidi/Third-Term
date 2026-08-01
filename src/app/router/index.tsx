import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { Layout } from '@/features/layouts/main.layout';
import { LoginPage } from '@/features/Auth/pages/login.page';
import { UsersPage } from '@/features/users/users.page';
import { NewUserPage } from '@/features/users/new-user.page';
import { FundsPage } from '@/features/funds/funds.page';
import { FundsDashboardPage } from '@/features/funds/funds-dashboard.page';
import { CurrenciesPage } from '@/features/currencies/currencies.page';
import { CompanyFundsPage } from '@/features/company-funds/company-funds.page';
import { ProjectsPage } from '@/features/projects/projects.page';
import { ProjectDetailsPage } from '@/features/projects/project-details/project-details.page';
import { ProjectFundsPage } from '@/features/projects/project-funds/project-funds.page';
import { ProjectTeamPage } from '@/features/projects/project-team/project-team.page';
import { ItemsPage } from '@/features/items/items.page';
import { EmployeePaymentsPage } from '@/features/employee-payments/employee-payments.page';
import { DepartmentsPage } from '@/features/departments/departments.page';
import { CloudStoragePage } from '@/features/cloud-storage/cloud-storage.page';
import { ExpensesPage } from '@/features/expenses/expenses.page';
import { NewExpensePage } from '@/features/expenses/new-expense.page';
import { ProjectStagesPage } from '@/features/projects/project-stages/project-stages.page';
import { MaterialsPage } from '@/features/materials/materials.page';
import { RevenuesPage } from '@/features/revenues/revenues.page';
import { InvoiceItemsPage } from '@/features/invoice-items/invoice-items.page';
import { InvoicesPage } from '@/features/invoices/invoices.page';
import { AuditLogsPage } from '@/features/audit-logs/audit-logs.page';
import { PublicProjectsPage } from '@/features/public-projects/public-projects.page';

const AUTH_TOKEN_KEY = 'token_finance_nouh';

function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

function getUserRole(): string | null {
  try {
    const raw = localStorage.getItem('user_info');
    if (!raw) return null;
    const user = JSON.parse(raw);
    return user?.role_type || null;
  } catch {
    return null;
  }
}

function ProtectedRoute() {
  if (!getAuthToken()) {
    return <Navigate to="/auth/login" replace />;
  }

  return <Outlet />;
}

function PublicOnlyRoute() {
  if (getAuthToken()) {
    const role = getUserRole();
    if (role === 'client') {
      return <Navigate to="/client/projects" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

function RootRedirect() {
  const role = getUserRole();
  if (role === 'client') {
    return <Navigate to="/client/projects" replace />;
  }
  return <Navigate to="/users" replace />;
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
        path: '/client/projects',
        element: <PublicProjectsPage />,
      },
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
            path: '/funds',
            element: <FundsDashboardPage />,
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
            path: '/projects/:projectId/:projectName',
            element: <ProjectDetailsPage />,
          },
          {
            path: '/projects/:projectId/:projectName/funds',
            element: <ProjectFundsPage />,
          },
          {
            path: '/projects/:projectId/:projectName/team',
            element: <ProjectTeamPage />,
          },
          {
            path: '/projects/:projectId/:projectName/stages',
            element: <ProjectStagesPage />,
          },
          {
            path: '/items',
            element: <ItemsPage />,
          },
          {
            path: '/materials',
            element: <MaterialsPage />,
          },
          {
            path: '/invoice-items',
            element: <InvoiceItemsPage />,
          },
          {
            path: '/employee-payments',
            element: <EmployeePaymentsPage />,
          },
          {
            path: '/expenses',
            element: <ExpensesPage />,
          },
          {
            path: '/expenses/new',
            element: <NewExpensePage />,
          },
          {
            path: '/revenues',
            element: <RevenuesPage />,
          },
          {
            path: '/invoices',
            element: <InvoicesPage />,
          },
          {
            path: '/employees/:employeeId/:employeeName/payments',
            element: <EmployeePaymentsPage />,
          },
          {
            path: '/',
            element: <RootRedirect />,
          },
          { path: '/currencies', element: <CurrenciesPage /> },
          { path: '/departments', element: <DepartmentsPage /> },
          { path: '/cloud-storage', element: <CloudStoragePage /> },
          { path: '/audit-logs', element: <AuditLogsPage /> },
        ],
      },
    ],
  },
  {
    path: '/public-projects',
    element: <PublicProjectsPage />,
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
