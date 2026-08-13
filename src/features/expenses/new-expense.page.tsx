import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { PageHeader } from '../components/page-header';
import { ExpensesForm } from './components/expenses.form';
import { expensesApi } from './expenses.api';
import type { CreateExpensePayload, Expense, ExpenseSource } from './types';
import { ReceiptText } from 'lucide-react';

const expensesQueryKeys = {
  all: ['expenses'] as const,
};

function getExpenseSource(expense: Expense): ExpenseSource | undefined {
  const fromInfo =
    expense.expenseable_info?.type === 'currency_fund' || expense.expenseable_info?.type === 'user_fund'
      ? 'user_fund'
      : expense.expenseable_info?.type === 'company_fund' || expense.expenseable_info?.type === 'project_fund'
        ? expense.expenseable_info.type
        : undefined;

  if (fromInfo) {
    return fromInfo;
  }

  switch (expense.expenseable_type) {
    case 'App\\Models\\CompanyFundCurrency':
      return 'company_fund';
    case 'App\\Models\\ProjectFundCurrency':
      return 'project_fund';
    case 'App\\Models\\CurrencyFund':
      return 'user_fund';
    default:
      return undefined;
  }
}

export function NewExpensePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const isClientPath = window.location.pathname.startsWith('/client') || window.location.pathname.startsWith('/public');
  const projectId = searchParams.get('projectId') ? Number(searchParams.get('projectId')) : undefined;

  const fixedValues = useMemo(() => {
    if (isClientPath && projectId) {
      return {
        source: 'project_fund' as ExpenseSource,
        project_id: projectId,
      };
    }
    return undefined;
  }, [isClientPath, projectId]);

  const expenseId = Number(searchParams.get('expenseId') || '');
  const hasExpenseId = Number.isFinite(expenseId) && expenseId > 0;

  const expenseQuery = useQuery<Expense>({
    queryKey: ['expenses', expenseId] as const,
    queryFn: () => expensesApi.getExpenseById(expenseId),
    enabled: hasExpenseId,
  });
  const isEditMode = hasExpenseId;

  const defaultValues = useMemo<Expense | null>(() => {
    const expense = expenseQuery.data;
    if (!expense) return null;

    const source = getExpenseSource(expense);
    const expenseUser = expense.user && typeof expense.user === 'object' ? expense.user : undefined;
    const details = expense.expenseable_info?.details;
    const detailsRecord =
      details && typeof details === 'object' ? (details as Record<string, unknown>) : null;

    const projectFundDetails =
      detailsRecord && ('project_fund' in detailsRecord || 'project_fund_id' in detailsRecord)
        ? (detailsRecord as {
          project_fund_id?: number;
          project_fund?: { id?: number; project_id?: number; project?: { id?: number } };
          id?: number;
        })
        : null;

    const userFundDetails =
      detailsRecord && ('fund' in detailsRecord || 'fund_id' in detailsRecord)
        ? (detailsRecord as { id?: number; fund_id?: number })
        : null;

    // expenseable_id = معرّف عملة الصندوق المختارة فقط
    const expenseableId =
      expense.expenseable_id ??
      (source === 'user_fund' ? userFundDetails?.id : undefined) ??
      projectFundDetails?.id ??
      expense.expenseable_info?.id;

    return {
      ...expense,
      expenseable_type: expense.expenseable_type,
      expenseable_id: expenseableId,
      // المستخدم السفلي من كائن user الأعلى فقط
      user: expense.user,
      user_role: expense.user_role ?? expenseUser?.role_type,
      user_id: expense.user_id ?? expenseUser?.id,
      created_by_name: expense.created_by_name,
      // مستخدم الصندوق والصندوق من expenseable_info كما هو
      expenseable_info: expense.expenseable_info,
      ...(source === 'company_fund'
        ? {
          company_fund_id: expense.expenseable_info?.company_fund_id ?? expense.expenseable_info?.id,
        }
        : source === 'project_fund'
          ? {
            project_id:
              expense.expenseable_info?.project_id ??
              projectFundDetails?.project_fund?.project_id ??
              projectFundDetails?.project_fund?.project?.id,
          }
          : {}),
    };
  }, [expenseQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async (payload: CreateExpensePayload) => {
      if (isEditMode) {
        return expensesApi.updateExpense(expenseId, payload);
      }
      return expensesApi.createExpense(payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: expensesQueryKeys.all });
      if (hasExpenseId) {
        await queryClient.invalidateQueries({ queryKey: ['expenses', expenseId] });
      }
      await queryClient.invalidateQueries({ queryKey: ['public-expenses'] });
      await queryClient.invalidateQueries({ queryKey: ['public-project-details'] });
      if (isClientPath) {
        navigate(projectId ? `/public/projects/${projectId}?tab=expenses` : '/public/projects', { replace: true });
      } else {
        navigate('/expenses', { replace: true });
      }
    },
  });

  const handleSubmit = async (payload: CreateExpensePayload) => {
    await saveMutation.mutateAsync(payload);
    toast.success(isEditMode ? 'تم تعديل المصروف بنجاح' : 'تم إضافة المصروف بنجاح');
  };

  return (
    <div className="space-y-5">
      <PageHeader
        badge="المصروفات"
        title={isEditMode ? 'تعديل مصروف' : 'إضافة مصروف'}
        icon={ReceiptText}
      />

      <div className="surface-panel p-5 sm:p-6">
        <ExpensesForm defaultValues={defaultValues} fixedValues={fixedValues} onSubmit={handleSubmit} loading={saveMutation.isPending} />
      </div>
    </div>
  );
}
