import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, Outlet, useLocation } from 'react-router-dom';
import { Skeleton } from '@/shared/components/ui/skeleton';

// Lazy-loaded pages for code splitting
const Layout                = lazy(() => import('@/features/layouts/main.layout').then(m => ({ default: m.Layout })));
const LoginPage             = lazy(() => import('@/features/Auth/pages/login.page').then(m => ({ default: m.LoginPage })));
const UsersPage             = lazy(() => import('@/features/users/users.page').then(m => ({ default: m.UsersPage })));
const NewUserPage           = lazy(() => import('@/features/users/new-user.page').then(m => ({ default: m.NewUserPage })));
const FundsPage             = lazy(() => import('@/features/funds/funds.page').then(m => ({ default: m.FundsPage })));
const FundsDashboardPage    = lazy(() => import('@/features/funds/funds-dashboard.page').then(m => ({ default: m.FundsDashboardPage })));
const CurrenciesPage        = lazy(() => import('@/features/currencies/currencies.page').then(m => ({ default: m.CurrenciesPage })));
const CompanyFundsPage      = lazy(() => import('@/features/company-funds/company-funds.page').then(m => ({ default: m.CompanyFundsPage })));
const FavoriteFundsPage     = lazy(() => import('@/features/favorite-funds/favorite-funds.page').then(m => ({ default: m.FavoriteFundsPage })));
const ProjectsPage          = lazy(() => import('@/features/projects/projects.page').then(m => ({ default: m.ProjectsPage })));
const ProjectDetailsPage    = lazy(() => import('@/features/projects/project-details/project-details.page').then(m => ({ default: m.ProjectDetailsPage })));
const ProjectFundsPage      = lazy(() => import('@/features/projects/project-funds/project-funds.page').then(m => ({ default: m.ProjectFundsPage })));
const ProjectTeamPage       = lazy(() => import('@/features/projects/project-team/project-team.page').then(m => ({ default: m.ProjectTeamPage })));
const ItemsPage             = lazy(() => import('@/features/items/items.page').then(m => ({ default: m.ItemsPage })));
const EmployeePaymentsPage  = lazy(() => import('@/features/employee-payments/employee-payments.page').then(m => ({ default: m.EmployeePaymentsPage })));
const IncrementsPage        = lazy(() => import('@/features/increments/increments.page').then(m => ({ default: m.IncrementsPage })));
const DepartmentsPage       = lazy(() => import('@/features/departments/departments.page').then(m => ({ default: m.DepartmentsPage })));
const DepartmentDetailsPage = lazy(() => import('@/features/departments/department-details.page').then(m => ({ default: m.DepartmentDetailsPage })));
const CloudStoragePage      = lazy(() => import('@/features/cloud-storage/cloud-storage.page').then(m => ({ default: m.CloudStoragePage })));
const ExpensesPage          = lazy(() => import('@/features/expenses/expenses.page').then(m => ({ default: m.ExpensesPage })));
const ExpenseDetailsPage    = lazy(() => import('@/features/expenses/expense-details.page').then(m => ({ default: m.ExpenseDetailsPage })));
const NewExpensePage        = lazy(() => import('@/features/expenses/new-expense.page').then(m => ({ default: m.NewExpensePage })));
const ProjectStagesPage     = lazy(() => import('@/features/projects/project-stages/project-stages.page').then(m => ({ default: m.ProjectStagesPage })));
const MaterialsPage         = lazy(() => import('@/features/materials/materials.page').then(m => ({ default: m.MaterialsPage })));
const RevenuesPage          = lazy(() => import('@/features/revenues/revenues.page').then(m => ({ default: m.RevenuesPage })));
const RevenueDetailsPage    = lazy(() => import('@/features/revenues/revenue-details.page').then(m => ({ default: m.RevenueDetailsPage })));
const TransfersPage         = lazy(() => import('@/features/transfers/transfers.page').then(m => ({ default: m.TransfersPage })));
const TransferDetailsPage   = lazy(() => import('@/features/transfers/transfer-details.page').then(m => ({ default: m.TransferDetailsPage })));
const InvoiceItemsPage      = lazy(() => import('@/features/invoice-items/invoice-items.page').then(m => ({ default: m.InvoiceItemsPage })));
const InvoicesPage          = lazy(() => import('@/features/invoices/invoices.page').then(m => ({ default: m.InvoicesPage })));
const InvoiceDetailsPage    = lazy(() => import('@/features/invoices/invoice-details.page').then(m => ({ default: m.InvoiceDetailsPage })));
const UnpostedInvoicesPage  = lazy(() => import('@/features/invoices/unposted-invoices.page').then(m => ({ default: m.UnpostedInvoicesPage })));
const NewInvoicePage        = lazy(() => import('@/features/invoices/new-invoice.page').then(m => ({ default: m.NewInvoicePage })));
const AuditLogsPage         = lazy(() => import('@/features/audit-logs/audit-logs.page').then(m => ({ default: m.AuditLogsPage })));
const MoneyExchangesPage    = lazy(() => import('@/features/money-exchanges/money-exchanges.page').then(m => ({ default: m.MoneyExchangesPage })));
const PublicProjectsPage    = lazy(() => import('@/features/public-projects/public-projects.page').then(m => ({ default: m.PublicProjectsPage })));
const PublicProjectDetailsPage = lazy(() => import('@/features/public-projects/public-project-details.page').then(m => ({ default: m.PublicProjectDetailsPage })));
const ReInvoicesPage        = lazy(() => import('@/features/re-invoices/re-invoices.page').then(m => ({ default: m.ReInvoicesPage })));
const ReInvoiceDetailsPage  = lazy(() => import('@/features/re-invoices/re-invoice-details.page').then(m => ({ default: m.ReInvoiceDetailsPage })));
const NotificationsPage     = lazy(() => import('@/features/notifications/notifications.page').then(m => ({ default: m.NotificationsPage })));

const AUTH_TOKEN_KEY = 'token_finance_nouh';

const limitedRoles = ['client', 'engineer', 'employee'];

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

function PageFallback() {
  return (
    <div className="flex flex-col flex-1 space-y-4 p-6">
      <Skeleton className="h-16 w-full rounded-lg" />
      <div className="grid grid-cols-4 gap-4">
        <Skeleton className="h-28 rounded-lg" />
        <Skeleton className="h-28 rounded-lg" />
        <Skeleton className="h-28 rounded-lg" />
        <Skeleton className="h-28 rounded-lg" />
      </div>
      <Skeleton className="h-96 w-full rounded-lg" />
    </div>
  );
}

function ProtectedRoute() {
  const location = useLocation();
  if (!getAuthToken()) {
    return <Navigate to="/auth/login" replace />;
  }

  const role = getUserRole();
  const isPublicPath = location.pathname.startsWith('/public');

  if (role && limitedRoles.includes(role) && !isPublicPath) {
    return <Navigate to="/public/projects" replace />;
  }

  if (role && !limitedRoles.includes(role) && isPublicPath) {
    return <Navigate to="/" replace />;
  }

  return (
    <Suspense fallback={<PageFallback />}>
      <Outlet />
    </Suspense>
  );
}

function PublicOnlyRoute() {
  if (getAuthToken()) {
    const role = getUserRole();
    if (role && limitedRoles.includes(role)) {
      return <Navigate to="/public/projects" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return (
    <Suspense fallback={<PageFallback />}>
      <Outlet />
    </Suspense>
  );
}

function RootRedirect() {
  const role = getUserRole();
  if (role && limitedRoles.includes(role)) {
    return <Navigate to="/public/projects" replace />;
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
        path: '/public/projects',
        element: <PublicProjectsPage />,
      },
      {
        path: '/public/projects/:projectId',
        element: <PublicProjectDetailsPage />,
      },
      {
        path: '/public/expenses/new',
        element: <NewExpensePage />,
      },
      {
        path: '/public/invoices/new',
        element: <NewInvoicePage />,
      },
      {
        element: (
          <Suspense fallback={<PageFallback />}>
            <Layout />
          </Suspense>
        ),
        children: [
          {
            path: '/users',
            element: <UsersPage />,
          },
          {
            path: '/users/view/:role/:id',
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
            path: '/favorite-funds',
            element: <FavoriteFundsPage />,
          },
          {
            path: '/projects',
            element: <ProjectsPage />,
          },
          {
            path: '/projects/:projectId',
            element: <ProjectDetailsPage />,
          },
          {
            path: '/projects/:projectId/funds',
            element: <ProjectFundsPage />,
          },
          {
            path: '/projects/:projectId/team',
            element: <ProjectTeamPage />,
          },
          {
            path: '/projects/:projectId/stages',
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
            path: '/increments',
            element: <IncrementsPage />,
          },
          {
            path: '/expenses',
            element: <ExpensesPage />,
          },
          {
            path: '/expenses/:expenseId',
            element: <ExpenseDetailsPage />,
          },
          {
            path: '/revenues',
            element: <RevenuesPage />,
          },
          {
            path: '/revenues/:revenueId',
            element: <RevenueDetailsPage />,
          },
          {
            path: '/transfers',
            element: <TransfersPage />,
          },
          {
            path: '/transfers/:transferId',
            element: <TransferDetailsPage />,
          },
          {
            path: '/invoices',
            element: <InvoicesPage />,
          },
          {
            path: '/invoices/:invoiceId',
            element: <InvoiceDetailsPage />,
          },
          {
            path: '/unposted-invoices',
            element: <UnpostedInvoicesPage />,
          },
          {
            path: '/re-invoices',
            element: <ReInvoicesPage />,
          },
          {
            path: '/re-invoices/:reinvoiceId',
            element: <ReInvoiceDetailsPage />,
          },
          {
            path: '/employees/:employeeId/:employeeName/payments',
            element: <EmployeePaymentsPage />,
          },
          {
            path: '/employees/:employeeId/:employeeName/increments',
            element: <IncrementsPage />,
          },
          {
            path: '/',
            element: <RootRedirect />,
          },
          { path: '/money-exchanges', element: <MoneyExchangesPage /> },
          { path: '/currencies', element: <CurrenciesPage /> },
          { path: '/departments', element: <DepartmentsPage /> },
          { path: '/departments/:departmentId', element: <DepartmentDetailsPage /> },
          { path: '/cloud-storage', element: <CloudStoragePage /> },
          { path: '/audit-logs', element: <AuditLogsPage /> },
          { path: '/notifications', element: <NotificationsPage /> },
        ],
      },
    ],
  },
  {
    path: '/public-projects',
    element: (
      <Suspense fallback={<PageFallback />}>
        <PublicProjectsPage />
      </Suspense>
    ),
  },
  {
    path: '/public-projects/:projectId',
    element: (
      <Suspense fallback={<PageFallback />}>
        <PublicProjectDetailsPage />
      </Suspense>
    ),
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
