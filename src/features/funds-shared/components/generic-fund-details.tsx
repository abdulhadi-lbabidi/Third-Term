import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/shared/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/components/ui/tabs';
import { TrendingUp, ArrowDownToLine, Receipt, ArrowRight, Edit2, Trash2, Banknote, PlusCircle } from 'lucide-react';
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
import { apiClient } from '@/shared/api/axios.instance';
import { useQuery, useQueryClient } from '@tanstack/react-query';

// Revenues
import { useRevenues, useCreateRevenue, useUpdateRevenue, useDeleteRevenue } from '@/features/revenues/revenues.hooks';
import { RevenuesTable } from '@/features/revenues/components/revenues.table';
import { RevenuesDialog } from '@/features/revenues/components/revenues.dialog';

// Expenses
import { useExpenses, useCreateExpense, useUpdateExpense, useDeleteExpense } from '@/features/expenses/expenses.hooks';
import { ExpensesTable } from '@/features/expenses/components/expenses.table';
import { ExpensesDialog } from '@/features/expenses/components/expenses.dialog';
import { ExpenseDetailsDialog } from '@/features/expenses/components/expense-details.dialog';

// Invoices
import { InvoicesTable } from '@/features/invoices/components/invoices.table';
import { InvoicesDialog } from '@/features/invoices/components/invoices.dialog';

type GenericFundDetailsProps = {
  fundId: number;
  fundName: string;
  fundCurrencies: {
    id: number;
    currency: string;
    symbol: string;
    balance: string;
  }[];
  onBack?: () => void;
  onEdit: () => void;
  onDelete: () => Promise<void>;
  onAttachCurrency: () => void;

  modelType: string; // e.g., 'App\\Models\\CompanyFundCurrency'
  sourceType: any; // e.g., 'company_fund'
  fundIdField: 'company_fund_id' | 'project_fund_id' | 'user_fund_id';
  extraDetails?: React.ReactNode;
  extraFixedValues?: Record<string, any>;
};

export function GenericFundDetails({
  fundId,
  fundName,
  fundCurrencies,
  onBack,
  onEdit,
  onDelete,
  onAttachCurrency,
  sourceType,
  fundIdField,
  extraDetails,
  extraFixedValues,
}: GenericFundDetailsProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('fundTab') || 'revenues';

  const handleTabChange = (value: string) => {
    setSearchParams((prev) => {
      prev.set('fundTab', value);
      return prev;
    });
  };

  const [revenueDialogOpen, setRevenueDialogOpen] = useState(false);
  const [selectedRevenue, setSelectedRevenue] = useState<any | null>(null);

  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<any | null>(null);
  const [expenseDetailsOpen, setExpenseDetailsOpen] = useState(false);
  const [selectedExpenseForView, setSelectedExpenseForView] = useState<number | null>(null);

  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);

  const { data: fundData, refetch: refetchFund } = useQuery({
    queryKey: ['fund-details', sourceType, fundId],
    queryFn: async () => {
      let endpoint = '';
      if (sourceType === 'company_fund') endpoint = `/company-funds/${fundId}`;
      else if (sourceType === 'project_fund') endpoint = `/project-funds/${fundId}`;
      else if (sourceType === 'user_fund') endpoint = `/funds/${fundId}`;

      if (!endpoint) return null;
      const res = await apiClient.get(endpoint);
      return res.data;
    },
    enabled: !!fundId && !!sourceType,
  });

  const displayCurrencies = fundData?.currencies?.map((c: any) => ({
    id: c.id,
    currency: c.currency,
    symbol: c.symbol,
    balance: c.balance,
  })) ?? fundCurrencies;

  const displayFundName = fundData?.name ?? fundName;

  const queryClient = useQueryClient();
  const refreshFundData = async () => {
    await refetchFund();
    // Invalidate list queries so parent views also update
    queryClient.invalidateQueries({ queryKey: ['funds'] });
    queryClient.invalidateQueries({ queryKey: ['company-funds'] });
    queryClient.invalidateQueries({ queryKey: ['project-funds'] });
    queryClient.invalidateQueries({ queryKey: ['projects'] });
  };

  const apiFilterField = fundIdField === 'user_fund_id' ? 'fund_id' : fundIdField;
  const filters = { [`filter[${apiFilterField}]`]: fundId };

  // Revenues setup
  const revenuesQuery = useRevenues(1, 50, filters);
  const fundRevenues = revenuesQuery.data?.data ?? [];
  const isLoadingRevenues = revenuesQuery.isLoading;

  const createRevenueMutation = useCreateRevenue();
  const updateRevenueMutation = useUpdateRevenue();
  const deleteRevenueMutation = useDeleteRevenue();

  const handleRevenueSubmit = async (data: any) => {
    if (selectedRevenue) {
      await updateRevenueMutation.mutateAsync({ id: selectedRevenue.id, payload: data });
    } else {
      await createRevenueMutation.mutateAsync(data);
    }
    await refreshFundData();
  };

  // Expenses setup
  const expensesQuery = useExpenses(1, 50, filters);
  const fundExpenses = expensesQuery.data?.data ?? [];
  const isLoadingExpenses = expensesQuery.isLoading;

  const createExpenseMutation = useCreateExpense();
  const updateExpenseMutation = useUpdateExpense();
  const deleteExpenseMutation = useDeleteExpense();

  const handleExpenseSubmit = async (data: any) => {
    if (selectedExpense) {
      await updateExpenseMutation.mutateAsync({ id: selectedExpense.id, payload: data });
    } else {
      await createExpenseMutation.mutateAsync(data);
    }
    await refreshFundData();
  };

  return (
    <div className="space-y-5 shadow-md rounded-xl p-3 bg-white">
      <div className="flex items-start gap-3 ">
        {onBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="text-muted-foreground hover:text-foreground shrink-0"
          >
            <ArrowRight className="size-5" />
          </Button>
        )}
        <div>
          <h3 className="text-lg font-semibold">صندوق: {displayFundName}</h3>
          <p className="mb-3 text-sm text-muted-foreground">
            تحديث أرصدة الصندوق
          </p>
          {extraDetails && <div className="mb-4">{extraDetails}</div>}

          <div className="flex flex-wrap gap-2">
            {displayCurrencies.map((currency: any) => (
              <Button
                key={currency.id}
                size={"sm"}
                variant={"outline"}
              >
                <span>
                  {currency.currency} {currency.symbol}
                </span>
                <span className="text-[11px] text-sky-700/80">({currency.balance})</span>
              </Button>
            ))}
            {displayCurrencies.length === 0 && (
              <div className="flex items-center gap-2 rounded-md border border-dashed border-slate-200 bg-slate-50 p-2 text-xs text-slate-400">
                <Banknote className="size-3.5" />
                <span>لا يوجد عملات مرفقة</span>
              </div>
            )}
          </div>
        </div>

        <div className="mr-auto flex gap-2">
          <Button variant="outline" size="sm" onClick={onAttachCurrency}>
            <Banknote className="ml-2 size-4" />
            إرفاق عملة
          </Button>
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Edit2 className="ml-2 size-4" />
            تعديل
          </Button>
          <AlertDialog>
            <AlertDialogTrigger render={<Button variant="destructive" size="sm" />}>
              <Trash2 className="ml-2 size-4" />
              حذف
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                <AlertDialogDescription>
                  هل أنت متأكد من حذف صندوق "{displayFundName}"؟ لا يمكن التراجع عن هذا الإجراء.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete}>
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
          {sourceType !== 'project_fund' && (
            <TabsTrigger value="invoices">
              <Receipt className="ml-2 size-4" />
              الفواتير
            </TabsTrigger>
          )}
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
                await refreshFundData();
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
              await refreshFundData();
            }}
          />

          {sourceType === 'project_fund' && (
            <div className="mt-8 pt-8 border-t border-border space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">فواتير المشروع</h3>
                <Button
                  onClick={() => {
                    setInvoiceDialogOpen(true);
                  }}
                  className="bg-slate-950 text-white"
                >
                  <PlusCircle className="mr-2 size-4" />
                  إضافة فاتورة
                </Button>
              </div>

              <InvoicesTable
                // filters={filters}
                fixedValues={{
                  source: sourceType,
                  [fundIdField]: fundId,
                  ...extraFixedValues,
                }}
              />
            </div>
          )}
        </TabsContent>

        {sourceType !== 'project_fund' && (
          <TabsContent value="invoices" className="space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">فواتير الصندوق</h3>
              <Button
                onClick={() => {
                  setInvoiceDialogOpen(true);
                }}
                className="bg-slate-950 text-white"
              >
                <PlusCircle className="mr-2 size-4" />
                إضافة فاتورة
              </Button>
            </div>

            <InvoicesTable
              filters={filters}
              fixedValues={{
                source: sourceType,
                [fundIdField]: fundId,
                ...extraFixedValues,
              }}
            />
          </TabsContent>
        )}
      </Tabs>

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
          fixedValues={{
            source: sourceType,
            [fundIdField]: fundId,
            ...extraFixedValues,
          }}
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
          fixedValues={{
            source: sourceType,
            [fundIdField]: fundId,
            ...extraFixedValues,
          }}
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

      <InvoicesDialog
        isOpen={invoiceDialogOpen}
        onClose={() => setInvoiceDialogOpen(false)}
        fixedValues={{
          source: sourceType,
          [fundIdField]: fundId,
          ...extraFixedValues,
        }}
      />
    </div>
  );
}
