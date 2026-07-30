import { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/components/ui/tabs';
import { Wallet, TrendingUp, ArrowDownToLine, Receipt, ArrowRight, Edit2, Trash2, Banknote, PlusCircle } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/components/ui/alert-dialog';
import { currenciesApi } from '@/features/currencies/currencies.api';
import type { Currency } from '@/features/currencies/types';
import { PageHeader } from '../../components/page-header';
import { projectsApi } from '../projects.api';
import { projectFundsApi } from './project-funds.api';
import type { CreateProjectFundPayload, ProjectFund, ProjectFundCurrency } from './project-funds.types';
import { ProjectFundCard } from '../project-funds/components/project-fund.card';
import { ProjectFundsDialog } from '../project-funds/components/project-funds.dialog';
import { AttachCurrencyDialog } from '../project-funds/components/attach-currency.dialog';
import { ProjectFundCurrenciesDialog } from '../project-funds/components/project-fund-currencies.dialog';
import { ProjectFundCurrencyDialog } from '../project-funds/components/project-fund-currency.dialog';
import { useRevenues, useCreateRevenue, useUpdateRevenue, useDeleteRevenue } from '@/features/revenues/revenues.hooks';
import { RevenuesTable } from '@/features/revenues/components/revenues.table';
import { RevenuesDialog } from '@/features/revenues/components/revenues.dialog';
import type { Revenue } from '@/features/revenues/types';
import { useExpenses, useCreateExpense, useUpdateExpense, useDeleteExpense } from '@/features/expenses/expenses.hooks';
import { ExpensesTable } from '@/features/expenses/components/expenses.table';
import { ExpensesDialog } from '@/features/expenses/components/expenses.dialog';
import { ExpenseDetailsDialog } from '@/features/expenses/components/expense-details.dialog';
import type { Expense } from '@/features/expenses/types';
const projectFundsQueryKeys = { all: ['project-funds'] as const };

export function ProjectFundsPage({ isTab = false }: { isTab?: boolean }) {
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('fundTab') || 'funds';
  const selectedFundId = searchParams.get('fundId') ? Number(searchParams.get('fundId')) : null;

  const handleTabChange = (value: string) => {
    setSearchParams((prev) => {
      prev.set('fundTab', value);
      return prev;
    });
  };
  const queryClient = useQueryClient();
  const projectId = Number(params.projectId || '');
  const hasProjectId = Number.isFinite(projectId) && projectId > 0;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [attachDialogOpen, setAttachDialogOpen] = useState(false);
  const [currenciesDialogOpen, setCurrenciesDialogOpen] = useState(false);
  const [currencyEditDialogOpen, setCurrencyEditDialogOpen] = useState(false);
  const [selectedProjectFund, setSelectedProjectFund] = useState<ProjectFund | null>(null);
  const [selectedProjectFundForView, setSelectedProjectFundForView] = useState<ProjectFund | null>(null);
  const [selectedProjectFundCurrency, setSelectedProjectFundCurrency] = useState<ProjectFundCurrency | null>(null);
  const [revenueDialogOpen, setRevenueDialogOpen] = useState(false);
  const [selectedRevenue, setSelectedRevenue] = useState<Revenue | null>(null);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [expenseDetailsOpen, setExpenseDetailsOpen] = useState(false);
  const [selectedExpenseForView, setSelectedExpenseForView] = useState<number | null>(null);

  const projectQuery = useQuery({
    queryKey: ['projects'] as const,
    queryFn: () => projectsApi.getProjects(),
  });

  const projectFundsQuery = useQuery<ProjectFund[]>({
    queryKey: projectFundsQueryKeys.all,
    queryFn: () => projectFundsApi.getProjectFunds(),
  });

  const currenciesQuery = useQuery({
    queryKey: ['currencies'] as const,
    queryFn: () => currenciesApi.getAll(),
  });

  const fundDetailsQuery = useQuery({
    queryKey: ['project-funds', selectedFundId],
    queryFn: () => projectFundsApi.getProjectFundById(selectedFundId!),
    enabled: !!selectedFundId,
  });

  const currentFund = fundDetailsQuery.data || projectFundsQuery.data?.find((f) => f.id === selectedFundId) || null;

  const revenuesQuery = useRevenues();
  const allRevenues = revenuesQuery.data?.data ?? (Array.isArray(revenuesQuery.data) ? revenuesQuery.data : []);
  const isLoadingRevenues = revenuesQuery.isLoading;
  const createRevenueMutation = useCreateRevenue();
  const updateRevenueMutation = useUpdateRevenue();
  const deleteRevenueMutation = useDeleteRevenue();

  const fundRevenues = allRevenues.filter(
    (r: any) =>
      r.revenueable_type === 'App\\Models\\ProjectFundCurrency' &&
      currentFund?.currencies?.some((c) => c.id === r.revenueable_id)
  );

  const handleRevenueSubmit = async (data: any) => {
    if (selectedRevenue) {
      await updateRevenueMutation.mutateAsync({ id: selectedRevenue.id, payload: data });
    } else {
      await createRevenueMutation.mutateAsync(data);
    }
  };

  const expensesQuery = useExpenses();
  const allExpenses = expensesQuery.data?.data ?? (Array.isArray(expensesQuery.data) ? expensesQuery.data : []);
  const isLoadingExpenses = expensesQuery.isLoading;
  const createExpenseMutation = useCreateExpense();
  const updateExpenseMutation = useUpdateExpense();
  const deleteExpenseMutation = useDeleteExpense();

  const fundExpenses = allExpenses.filter(
    (e: any) =>
      e.expenseable_type === 'App\\Models\\ProjectFundCurrency' &&
      currentFund?.currencies?.some((c) => c.id === e.expenseable_id)
  );

  const handleExpenseSubmit = async (data: any) => {
    if (selectedExpense) {
      await updateExpenseMutation.mutateAsync({ id: selectedExpense.id, payload: data });
    } else {
      await createExpenseMutation.mutateAsync(data);
    }
  };

  const visibleProjectFunds = hasProjectId 
    ? (projectFundsQuery.data ?? []).filter((fund) => fund.project?.id === projectId)
    : (projectFundsQuery.data ?? []);

  const saveMutation = useMutation({
    mutationFn: async (payload: CreateProjectFundPayload) => {
      if (selectedProjectFund) {
        return projectFundsApi.updateProjectFund(selectedProjectFund.id, { name: payload.name });
      }
      return projectFundsApi.createProjectFund(payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: projectFundsQueryKeys.all });
      setDialogOpen(false);
      setSelectedProjectFund(null);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'حدث خطأ أثناء حفظ الصندوق');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (fund: ProjectFund) => projectFundsApi.deleteProjectFund(fund.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: projectFundsQueryKeys.all });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'حدث خطأ أثناء حذف الصندوق');
    },
  });

  const attachMutation = useMutation({
    mutationFn: async (payload: { currency_id: number; balance: string }) => {
      if (!selectedProjectFund) throw new Error('صندوق المشروع غير محدد');
      return projectFundsApi.attachCurrency(selectedProjectFund.id, payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: projectFundsQueryKeys.all });
      setAttachDialogOpen(false);
      setSelectedProjectFund(null);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'حدث خطأ أثناء إضافة الرصيد الافتتاحي');
    },
  });

  const updateCurrencyMutation = useMutation({
    mutationFn: async (payload: { currency_id: number; balance: string }) => {
      if (!selectedProjectFund) throw new Error('صندوق المشروع غير محدد');
      return projectFundsApi.attachCurrency(selectedProjectFund.id, payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: projectFundsQueryKeys.all });
      setCurrencyEditDialogOpen(false);
      setSelectedProjectFundCurrency(null);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'حدث خطأ أثناء تعديل العملة');
    },
  });

  const projectsList = Array.isArray(projectQuery.data) ? projectQuery.data : [];
  const currentProject = projectsList.find((item) => item.id === projectId) ?? null;

  const handleSubmit = async (payload: CreateProjectFundPayload) => {
    const finalPayload: CreateProjectFundPayload = {
      project_id: hasProjectId ? projectId : payload.project_id,
      name: payload.name,
    };

    await saveMutation.mutateAsync(finalPayload);
    toast.success(selectedProjectFund ? 'تم تعديل الصندوق بنجاح' : 'تم إنشاء الصندوق بنجاح');
  };

  const handleDelete = async (fund: ProjectFund) => {
    await deleteMutation.mutateAsync(fund);
    toast.success('تم حذف الصندوق بنجاح');
  };

  return (
    <div className={cn("space-y-5", isTab && "space-y-0")}>
      {!selectedFundId ? (
        <>
          {!isTab && (
            <PageHeader
              title={'صناديق المشروع'}
              boxed={false}
              icon={Wallet}
              action={
                <div className="flex gap-3" >
                  <Button
                    type="button"
                    onClick={() => {
                      setSelectedProjectFund(null);
                      setDialogOpen(true);
                    }}
                  >
                    إضافة صندوق جديد
                  </Button>
                </div>
              }
            />
          )}

          {projectFundsQuery.isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-[200px] rounded-lg border border-border bg-card animate-pulse" />
              ))}
            </div>
          ) : visibleProjectFunds.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
              <Wallet className="mb-4 size-10 text-muted-foreground" />
              <h4 className="text-sm font-medium text-foreground">لا توجد صناديق</h4>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                لم يتم إضافة أي صناديق لهذا المشروع بعد.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {visibleProjectFunds.map((fund) => (
                <ProjectFundCard
                  key={fund.id}
                  fund={fund}
                  onClick={(fund) => {
                    setSearchParams((prev) => {
                      prev.set('fundId', fund.id.toString());
                      if (currentTab === 'funds') {
                        prev.set('fundTab', 'revenues');
                      }
                      return prev;
                    });
                  }}
                  onMoreCurrenciesClick={(fund) => {
                    setSelectedProjectFundForView(fund);
                    setCurrenciesDialogOpen(true);
                  }}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-5">
          <div className="flex items-start gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                setSearchParams((prev) => {
                  prev.delete('fundId');
                  return prev;
                });
              }}
              title="العودة إلى صناديق المشروع"
            >
              <ArrowRight className="size-4" />
            </Button>
            <div>
              <h3 className="text-lg font-semibold">صندوق: {currentFund?.name}</h3>
              <p className="mb-3 text-sm text-muted-foreground">
                إدارة الحركات المالية المتعلقة بهذا الصندوق
              </p>

              <div className="flex flex-wrap gap-2">
                {currentFund?.currencies?.map((currency) => (
                  <button
                    key={currency.id}
                    className="inline-flex cursor-default items-center gap-1.5 rounded-md border border-sky-100 bg-sky-50/50 px-2.5 py-1 text-sm font-medium text-sky-900 transition-colors"
                  >
                    <span>
                      {currency.currency} {currency.symbol}
                    </span>
                    <span className="text-[11px] text-sky-700/80">({currency.balance})</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mr-auto flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (currentFund) setSelectedProjectFund(currentFund);
                  setAttachDialogOpen(true);
                }}
              >
                <Banknote className="ml-2 size-4" />
                إرفاق عملة
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (currentFund) setSelectedProjectFund(currentFund);
                  setDialogOpen(true);
                }}
              >
                <Edit2 className="ml-2 size-4" />
                تعديل
              </Button>
              <AlertDialog>
                <AlertDialogTrigger>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="ml-2 size-4" />
                    حذف
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                    <AlertDialogDescription>
                      هل أنت متأكد من حذف صندوق "{currentFund?.name}"؟ لا يمكن التراجع عن هذا الإجراء.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        if (currentFund) handleDelete(currentFund);
                        setSearchParams((prev) => {
                          prev.delete('fundId');
                          return prev;
                        });
                      }}
                    >
                      حذف
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          <Tabs value={currentTab === 'funds' ? 'revenues' : currentTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="mb-5 justify-start">
              <TabsTrigger value="revenues">
                <TrendingUp className="ml-2 size-4" />
                الإيرادات
              </TabsTrigger>
              <TabsTrigger value="expenses">
                <ArrowDownToLine className="ml-2 size-4" />
                المصروفات
              </TabsTrigger>
              <TabsTrigger value="invoices">
                <Receipt className="ml-2 size-4" />
                الفواتير
              </TabsTrigger>
            </TabsList>

            <TabsContent value="revenues" className="space-y-5">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-foreground">جدول الإيرادات</h4>
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedRevenue(null);
                    setRevenueDialogOpen(true);
                  }}
                >
                  إضافة إيراد جديد
                </Button>
              </div>

              {isLoadingRevenues ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-[150px] rounded-xl border border-border bg-card animate-pulse" />
                  ))}
                </div>
              ) : fundRevenues.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
                  <TrendingUp className="mb-4 size-10 text-muted-foreground" />
                  <h4 className="text-sm font-medium text-foreground">لا توجد إيرادات</h4>
                  <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                    لم يتم إضافة أي إيرادات لهذا الصندوق بعد.
                  </p>
                </div>
              ) : (
                <RevenuesTable
                  data={fundRevenues}
                  onEdit={(revenue) => {
                    setSelectedRevenue(revenue);
                    setRevenueDialogOpen(true);
                  }}
                  onDelete={async (revenue) => {
                    await deleteRevenueMutation.mutateAsync(revenue.id);
                  }}
                />
              )}
            </TabsContent>

            <TabsContent value="expenses" className="space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">مصروفات الصندوق</h3>
                <Button
                  onClick={() => {
                    setSelectedExpense(null);
                    setExpenseDialogOpen(true);
                  }}
                  className="bg-slate-950 text-white"
                >
                  <PlusCircle className="mr-2 size-4" />
                  إضافة مصروف
                </Button>
              </div>

              <ExpensesTable
                data={fundExpenses}
                loading={isLoadingExpenses}
                onView={(expense) => {
                  setSelectedExpenseForView(expense.id);
                  setExpenseDetailsOpen(true);
                }}
                onEdit={(expense) => {
                  setSelectedExpense(expense);
                  setExpenseDialogOpen(true);
                }}
                onDelete={async (expense) => {
                  await deleteExpenseMutation.mutateAsync(expense.id);
                }}
              />
            </TabsContent>

            <TabsContent value="invoices" className="space-y-5">
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
                <Receipt className="mb-4 size-10 text-muted-foreground" />
                <h4 className="text-sm font-medium text-foreground">جدول الفواتير</h4>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  سيتم عرض الفواتير التابعة لصندوق "{currentFund?.name}" هنا.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}

      <ProjectFundsDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setSelectedProjectFund(null);
        }}
        project={currentProject ?? undefined}
        projectFund={selectedProjectFund}
        onSubmit={handleSubmit}
        loading={saveMutation.isPending}
      />

      <AttachCurrencyDialog
        open={attachDialogOpen}
        onOpenChange={(open) => {
          setAttachDialogOpen(open);
          if (!open) setSelectedProjectFund(null);
        }}
        currencies={((currenciesQuery.data?.data ?? (Array.isArray(currenciesQuery.data) ? currenciesQuery.data : [])) as Currency[]).filter((c) => {
          const fund = selectedProjectFund?.id === currentFund?.id ? currentFund : selectedProjectFund;
          return !fund?.currencies?.some((attached) => attached.currency === c.currency);
        })}
        onSubmit={async (payload) => {
          await attachMutation.mutateAsync(payload);
          toast.success('تم ربط العملة بالصندوق بنجاح');
        }}
        loading={attachMutation.isPending}
      />

      <ProjectFundCurrenciesDialog
        open={currenciesDialogOpen}
        onOpenChange={(open) => {
          setCurrenciesDialogOpen(open);
          if (!open) setSelectedProjectFundForView(null);
        }}
        fund={selectedProjectFundForView}

      />

      <ProjectFundCurrencyDialog
        open={currencyEditDialogOpen}
        onOpenChange={(open) => {
          setCurrencyEditDialogOpen(open);
          if (!open) setSelectedProjectFundCurrency(null);
        }}
        currency={selectedProjectFundCurrency}
        onSubmit={async (payload) => {
          await updateCurrencyMutation.mutateAsync(payload);
          toast.success('تم تعديل العملة بنجاح');
        }}
        loading={updateCurrencyMutation.isPending}
      />

      <RevenuesDialog
        open={revenueDialogOpen}
        onOpenChange={setRevenueDialogOpen}
        defaultValues={selectedRevenue}
        fixedValues={
          currentFund
            ? {
              source: 'project_fund',
              project_id: Number(projectId),
              project_fund_id: currentFund.id,
            }
            : undefined
        }
        onSubmit={handleRevenueSubmit}
        loading={createRevenueMutation.isPending || updateRevenueMutation.isPending}
      />

      <ExpensesDialog
        open={expenseDialogOpen}
        onOpenChange={setExpenseDialogOpen}
        defaultValues={selectedExpense}
        fixedValues={
          currentFund
            ? {
              source: 'project_fund',
              project_id: Number(projectId),
              project_fund_id: currentFund.id,
            }
            : undefined
        }
        onSubmit={handleExpenseSubmit}
        loading={createExpenseMutation.isPending || updateExpenseMutation.isPending}
      />

      <ExpenseDetailsDialog
        open={expenseDetailsOpen}
        onOpenChange={(open) => {
          setExpenseDetailsOpen(open);
          if (!open) setSelectedExpenseForView(null);
        }}
        expenseId={selectedExpenseForView}
      />
    </div>
  );
}
