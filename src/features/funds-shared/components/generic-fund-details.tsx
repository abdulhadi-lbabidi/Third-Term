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

// Revenues
import { useRevenues, useCreateRevenue, useUpdateRevenue, useDeleteRevenue } from '@/features/revenues/revenues.hooks';
import { RevenuesTable } from '@/features/revenues/components/revenues.table';
import { RevenuesDialog } from '@/features/revenues/components/revenues.dialog';

// Expenses
import { useExpenses, useCreateExpense, useUpdateExpense, useDeleteExpense } from '@/features/expenses/expenses.hooks';
import { ExpensesTable } from '@/features/expenses/components/expenses.table';
import { ExpensesDialog } from '@/features/expenses/components/expenses.dialog';
import { ExpenseDetailsDialog } from '@/features/expenses/components/expense-details.dialog';

type GenericFundDetailsProps = {
  fundId: number;
  fundName: string;
  fundCurrencies: {
    id: number;
    currency: string;
    symbol: string;
    balance: string;
  }[];
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => Promise<void>;
  onAttachCurrency: () => void;

  // Configuration for Revenues and Expenses
  modelType: string; // e.g., 'App\\Models\\CompanyFundCurrency'
  sourceType: any; // e.g., 'company_fund'
  fundIdField: 'company_fund_id' | 'project_fund_id' | 'user_fund_id';
};

export function GenericFundDetails({
  fundId,
  fundName,
  fundCurrencies,
  onBack,
  onEdit,
  onDelete,
  onAttachCurrency,
  modelType,
  sourceType,
  fundIdField,
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

  // Revenues setup
  const { data: allRevenues = [], isLoading: isLoadingRevenues } = useRevenues();
  const createRevenueMutation = useCreateRevenue();
  const updateRevenueMutation = useUpdateRevenue();
  const deleteRevenueMutation = useDeleteRevenue();

  const fundRevenues = allRevenues.filter(
    (r) =>
      r.revenueable_type === modelType &&
      fundCurrencies.some((c) => c.id === r.revenueable_id)
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
      e.expenseable_type === modelType &&
      fundCurrencies.some((c) => c.id === e.expenseable_id)
  );

  const handleExpenseSubmit = async (data: any) => {
    if (selectedExpense) {
      await updateExpenseMutation.mutateAsync({ id: selectedExpense.id, payload: data });
    } else {
      await createExpenseMutation.mutateAsync(data);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={onBack}
          title="العودة"
        >
          <ArrowRight className="size-4" />
        </Button>
        <div>
          <h3 className="text-lg font-semibold">صندوق: {fundName}</h3>
          <p className="mb-3 text-sm text-muted-foreground">
            إدارة الحركات المالية المتعلقة بهذا الصندوق
          </p>

          <div className="flex flex-wrap gap-2">
            {fundCurrencies.map((currency) => (
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
            {fundCurrencies.length === 0 && (
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
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="ml-2 size-4" />
                حذف
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                <AlertDialogDescription>
                  هل أنت متأكد من حذف صندوق "{fundName}"؟ لا يمكن التراجع عن هذا الإجراء.
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
              سيتم عرض الفواتير التابعة لهذا الصندوق قريباً.
            </p>
          </div>
        </TabsContent>
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
          fixedType={modelType}
          fixedValues={{
            source: sourceType,
            [fundIdField]: fundId,
          }}
          fixedFundCurrencies={fundCurrencies.map((c) => ({
            id: c.id,
            currency: {
              symbol: c.symbol,
              code: c.currency,
              name: c.currency,
            },
            balance: Number(c.balance || 0),
          }))}
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
          fixedType={modelType}
          fixedValues={{
            source: sourceType,
            [fundIdField]: fundId,
          }}
          fixedFundCurrencies={fundCurrencies.map((c) => ({
            id: c.id,
            currency: {
              symbol: c.symbol,
              code: c.currency,
              name: c.currency,
            },
            balance: Number(c.balance || 0),
          }))}
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
