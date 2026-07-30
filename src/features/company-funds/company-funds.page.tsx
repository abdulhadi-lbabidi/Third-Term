import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/components/ui/tabs';
import { Wallet, TrendingUp, ArrowDownToLine, Receipt, ArrowRight, Edit2, Trash2, Banknote, PlusCircle } from 'lucide-react';
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

import { Button } from '@/shared/components/ui/button';
import { currenciesApi } from '@/features/currencies/currencies.api';
import type { Currency } from '@/features/currencies/types';
import { companyFundsApi } from './company-funds.api';
import { CompanyFundsDialog } from './components/company-funds.dialog';
import { CompanyFundCard } from './components/company-fund.card';
import { AttachCurrencyDialog } from './components/attach-currency.dialog';
import { CompanyFundCurrenciesDialog } from './components/company-fund-currencies.dialog';
import { CompanyFundCurrencyDialog } from './components/company-fund-currency.dialog';
import type { CompanyFund, CompanyFundCurrency, CreateCompanyFundPayload } from './types';
import { PageHeader } from '../components/page-header';
import { cn } from '@/shared/lib/utils';

// Revenues
import { useRevenues, useCreateRevenue, useUpdateRevenue, useDeleteRevenue } from '@/features/revenues/revenues.hooks';
import { RevenuesTable } from '@/features/revenues/components/revenues.table';
import { RevenuesDialog } from '@/features/revenues/components/revenues.dialog';
import type { Revenue } from '@/features/revenues/types';

// Expenses
import { useExpenses, useCreateExpense, useUpdateExpense, useDeleteExpense } from '@/features/expenses/expenses.hooks';
import { ExpensesTable } from '@/features/expenses/components/expenses.table';
import { ExpensesDialog } from '@/features/expenses/components/expenses.dialog';
import { ExpenseDetailsDialog } from '@/features/expenses/components/expense-details.dialog';
import type { Expense } from '@/features/expenses/types';

const companyFundsQueryKeys = {
  all: ['company-funds'] as const,
};

export function CompanyFundsPage({ isTab = false }: { isTab?: boolean }) {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentTab = searchParams.get('fundTab') || 'revenues';
  const selectedFundId = searchParams.get('fundId') ? Number(searchParams.get('fundId')) : null;

  const handleTabChange = (value: string) => {
    setSearchParams((prev) => {
      prev.set('fundTab', value);
      return prev;
    });
  };

  const [dialogOpen, setDialogOpen] = useState(false);
  const [attachDialogOpen, setAttachDialogOpen] = useState(false);
  const [currenciesDialogOpen, setCurrenciesDialogOpen] = useState(false);
  const [currencyEditDialogOpen, setCurrencyEditDialogOpen] = useState(false);
  const [selectedCompanyFund, setSelectedCompanyFund] = useState<CompanyFund | null>(null);
  const [selectedCompanyFundForCurrency, setSelectedCompanyFundForCurrency] = useState<CompanyFund | null>(null);
  const [selectedCompanyFundForView, setSelectedCompanyFundForView] = useState<CompanyFund | null>(null);
  const [selectedCompanyFundCurrency, setSelectedCompanyFundCurrency] = useState<CompanyFundCurrency | null>(null);

  const [revenueDialogOpen, setRevenueDialogOpen] = useState(false);
  const [selectedRevenue, setSelectedRevenue] = useState<Revenue | null>(null);

  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [expenseDetailsOpen, setExpenseDetailsOpen] = useState(false);
  const [selectedExpenseForView, setSelectedExpenseForView] = useState<number | null>(null);

  const companyFundsQuery = useQuery<CompanyFund[]>({
    queryKey: companyFundsQueryKeys.all,
    queryFn: () => companyFundsApi.getCompanyFunds(),
  });

  const currenciesQuery = useQuery<Currency[]>({
    queryKey: ['currencies'] as const,
    queryFn: () => currenciesApi.getAll(),
  });

  const currentFund = companyFundsQuery.data?.find((f) => f.id === selectedFundId) || null;

  // Revenues setup
  const { data: allRevenues = [], isLoading: isLoadingRevenues } = useRevenues();
  const createRevenueMutation = useCreateRevenue();
  const updateRevenueMutation = useUpdateRevenue();
  const deleteRevenueMutation = useDeleteRevenue();

  const fundRevenues = allRevenues.filter(
    (r) =>
      r.revenueable_type === 'App\\Models\\CompanyFundCurrency' &&
      currentFund?.currencies?.some((c) => c.id === r.revenueable_id)
  );

  const handleRevenueSubmit = async (data: any) => {
    if (selectedRevenue) {
      await updateRevenueMutation.mutateAsync({ id: selectedRevenue.id, payload: data });
    } else {
      await createRevenueMutation.mutateAsync(data);
    }
  };

  // Expenses setup
  const { data: allExpenses = [], isLoading: isLoadingExpenses } = useExpenses();
  const createExpenseMutation = useCreateExpense();
  const updateExpenseMutation = useUpdateExpense();
  const deleteExpenseMutation = useDeleteExpense();

  const fundExpenses = allExpenses.filter(
    (e) =>
      e.expenseable_type === 'App\\Models\\CompanyFundCurrency' &&
      currentFund?.currencies?.some((c) => c.id === e.expenseable_id)
  );

  const handleExpenseSubmit = async (data: any) => {
    if (selectedExpense) {
      await updateExpenseMutation.mutateAsync({ id: selectedExpense.id, payload: data });
    } else {
      await createExpenseMutation.mutateAsync(data);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async (payload: CreateCompanyFundPayload) => {
      if (selectedCompanyFund) {
        return companyFundsApi.updateCompanyFund(selectedCompanyFund.id, { name: payload.name });
      }
      return companyFundsApi.createCompanyFund(payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: companyFundsQueryKeys.all });
      setDialogOpen(false);
      setSelectedCompanyFund(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (fund: CompanyFund) => companyFundsApi.deleteCompanyFund(fund.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: companyFundsQueryKeys.all });
    },
  });

  const attachMutation = useMutation({
    mutationFn: async (payload: { currency_id: number; balance: string }) => {
      const fund = selectedCompanyFundForCurrency || selectedCompanyFund;
      if (!fund) {
        throw new Error('صندوق الشركة غير محدد');
      }
      return companyFundsApi.attachCurrency(fund.id, payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: companyFundsQueryKeys.all });
      setAttachDialogOpen(false);
      setSelectedCompanyFundForCurrency(null);
      setSelectedCompanyFund(null);
    },
  });

  const updateCurrencyMutation = useMutation({
    mutationFn: async (payload: { currency_id: number; balance: string }) => {
      if (!selectedCompanyFund) {
        throw new Error('صندوق الشركة غير محدد');
      }
      return companyFundsApi.attachCurrency(selectedCompanyFund.id, payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: companyFundsQueryKeys.all });
      setCurrencyEditDialogOpen(false);
      setSelectedCompanyFundCurrency(null);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'حدث خطأ أثناء تعديل العملة');
    },
  });

  const handleSubmit = async (payload: CreateCompanyFundPayload) => {
    await saveMutation.mutateAsync(payload);
    toast.success(selectedCompanyFund ? 'تم تعديل صندوق الشركة بنجاح' : 'تم إنشاء صندوق الشركة بنجاح');
  };

  const handleDelete = async (fund: CompanyFund) => {
    await deleteMutation.mutateAsync(fund);
    toast.success('تم حذف صندوق الشركة بنجاح');
  };

  const handleAttachCurrency = async (payload: { currency_id: number; balance: string }) => {
    await attachMutation.mutateAsync(payload);
    toast.success('تم حفظ العملة بصندوق الشركة بنجاح');
  };

  return (
    <div className={cn("space-y-5", isTab && "space-y-0")}>
      {!selectedFundId ? (
        <>
          {!isTab && (
            <PageHeader
              badge="المالية"
              title="صندوق الشركة"
              icon={Wallet}
              action={
                <Button
                  onClick={() => {
                    setSelectedCompanyFund(null);
                    setDialogOpen(true);
                  }}
                >
                  إضافة صندوق الشركة
                </Button>
              }
            />
          )}

          {companyFundsQuery.isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-[200px] rounded-lg border border-border bg-card animate-pulse" />
              ))}
            </div>
          ) : (companyFundsQuery.data ?? []).length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
              <Wallet className="mb-4 size-10 text-muted-foreground" />
              <h4 className="text-sm font-medium text-foreground">لا توجد صناديق</h4>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                لم يتم إضافة أي صناديق شركة بعد.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {(companyFundsQuery.data ?? []).map((fund) => (
                <CompanyFundCard
                  key={fund.id}
                  fund={fund}
                  onClick={(fund) => {
                    setSearchParams((prev) => {
                      prev.set('fundId', fund.id.toString());
                      if (!prev.has('fundTab')) prev.set('fundTab', 'revenues');
                      return prev;
                    });
                  }}
                  onMoreCurrenciesClick={(fund) => {
                    setSelectedCompanyFundForView(fund);
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
              title="العودة إلى صناديق الشركة"
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
                  if (currentFund) setSelectedCompanyFund(currentFund);
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
                  if (currentFund) setSelectedCompanyFund(currentFund);
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

          <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
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

      <CompanyFundsDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        companyFund={selectedCompanyFund}
        onSubmit={handleSubmit}
        loading={saveMutation.isPending}
      />

      <AttachCurrencyDialog
        open={attachDialogOpen}
        onOpenChange={(open) => {
          setAttachDialogOpen(open);
          if (!open) {
            setSelectedCompanyFundForCurrency(null);
            setSelectedCompanyFund(null);
          }
        }}
        currencies={(currenciesQuery.data ?? []).filter(
          (c) =>
            !selectedCompanyFundForCurrency?.currencies?.some(
              (fc) => fc.currency === c.currency
            )
        )}
        onSubmit={handleAttachCurrency}
        loading={attachMutation.isPending}
      />

      <CompanyFundCurrenciesDialog
        open={currenciesDialogOpen}
        onOpenChange={(open) => {
          setCurrenciesDialogOpen(open);
          if (!open) setSelectedCompanyFundForView(null);
        }}
        fund={selectedCompanyFundForView}
      />

      <CompanyFundCurrencyDialog
        open={currencyEditDialogOpen}
        onOpenChange={(open) => {
          setCurrencyEditDialogOpen(open);
          if (!open) setSelectedCompanyFundCurrency(null);
        }}
        currency={selectedCompanyFundCurrency}
        onSubmit={async (payload) => {
          await updateCurrencyMutation.mutateAsync(payload);
          toast.success('تم تعديل العملة بنجاح');
        }}
        loading={updateCurrencyMutation.isPending}
      />

      {revenueDialogOpen && (
        <RevenuesDialog
          open={revenueDialogOpen}
          onOpenChange={(open) => {
            setRevenueDialogOpen(open);
            if (!open) setSelectedRevenue(null);
          }}
          defaultValues={selectedRevenue}
          onSubmit={handleRevenueSubmit}
          loading={createRevenueMutation.isPending || updateRevenueMutation.isPending}
          fixedValues={
            currentFund
              ? {
                source: 'company_fund',
                company_fund_id: currentFund.id,
              }
              : undefined
          }
        />
      )}

      {expenseDialogOpen && (
        <ExpensesDialog
          open={expenseDialogOpen}
          onOpenChange={(open) => {
            setExpenseDialogOpen(open);
            if (!open) setSelectedExpense(null);
          }}
          defaultValues={selectedExpense}
          onSubmit={handleExpenseSubmit}
          loading={createExpenseMutation.isPending || updateExpenseMutation.isPending}
          fixedValues={
            currentFund
              ? {
                source: 'company_fund',
                company_fund_id: currentFund.id,
              }
              : undefined
          }
        />
      )}

      {expenseDetailsOpen && selectedExpenseForView && (
        <ExpenseDetailsDialog
          open={expenseDetailsOpen}
          onOpenChange={(open) => {
            setExpenseDetailsOpen(open);
            if (!open) setSelectedExpenseForView(null);
          }}
          expenseId={selectedExpenseForView}
        />
      )}
    </div>
  );
}
