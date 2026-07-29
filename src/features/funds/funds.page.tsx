import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/components/ui/tabs';
import { Wallet, TrendingUp, ArrowDownToLine, Receipt, ArrowRight, Edit2, Trash2, Banknote } from 'lucide-react';
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
import { FundCard } from './components/fund.card';
import { FundsDialog } from './components/funds.dialog';
import { AttachCurrencyDialog } from './components/attach-currency.dialog';
import { FundCurrenciesDialog } from './components/fund-currencies.dialog';
import { FundCurrencyDialog } from './components/fund-currency.dialog';
import { fundsApi } from './funds.api';
import type { CreateFundPayload, Fund, FundCurrency } from './types';
import { currenciesApi } from '@/features/currencies/currencies.api';
import type { Currency } from '@/features/currencies/types';
import { PageHeader } from '../components/page-header';
import type { UserRole } from '@/features/users/types';
import { usersApi } from '@/features/users/api/users.api';
import { FundRevenues } from './components/fund-revenues';
import { FundExpenses } from './components/fund-expenses';

type UserRecord = Awaited<ReturnType<typeof usersApi.getUserByRole>>;

const fundsQueryKeys = {
  all: ['funds'] as const,
};

const userRoles: UserRole[] = ['admin', 'client', 'investor', 'craftsman', 'employee', 'engineer', 'supplier', 'trustee'];

export function FundsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const userId = Number(params.userId || '');
  const userName = params.userName ? decodeURIComponent(params.userName) : '';
  const hasUserId = Number.isFinite(userId) && userId > 0;
  const roleParam = searchParams.get('tab');
  const userRole = userRoles.includes(roleParam as UserRole) ? (roleParam as UserRole) : null;
  const hasUserContext = hasUserId && !!userRole;

  const currentTab = searchParams.get('fundTab') || 'funds';
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
  const [selectedFund, setSelectedFund] = useState<Fund | null>(null);
  const [selectedFundForCurrency, setSelectedFundForCurrency] = useState<Fund | null>(null);
  const [selectedFundForView, setSelectedFundForView] = useState<Fund | null>(null);
  const [selectedCurrencyForEdit, setSelectedCurrencyForEdit] = useState<FundCurrency | null>(null);



  const userRecordQuery = useQuery<UserRecord | null>({
    queryKey: ['funds', 'user-record', userRole ?? 'all', userId] as const,
    queryFn: async () => {
      if (!hasUserContext || !userRole) {
        return null;
      }

      return usersApi.getUserByRole(userRole, userId);
    },
    enabled: hasUserContext && Boolean(userRole),
  });

  const fundsQuery = useQuery<Fund[]>({
    queryKey: fundsQueryKeys.all,
    queryFn: () => fundsApi.getFunds(),
    enabled: !hasUserContext,
  });

  const currenciesQuery = useQuery<Currency[]>({
    queryKey: ['currencies'] as const,
    queryFn: () => currenciesApi.getAll(),
  });

  const resolvedUserId = userRecordQuery.data?.user.id ?? userId;
  const resolvedUserName = userRecordQuery.data?.user.name ?? userName;
  const visibleFunds = hasUserContext
    ? ((userRecordQuery.data?.user.funds as Fund[] | undefined) ?? [])
    : (fundsQuery.data ?? []);

  const currentFund = visibleFunds.find((f) => f.id === selectedFundId) || null;



  const saveFundMutation = useMutation({
    mutationFn: async (payload: CreateFundPayload) => {
      if (selectedFund) {
        return fundsApi.updateFund(selectedFund.id, { user_id: hasUserContext ? resolvedUserId : payload.user_id, name: payload.name });
      }
      return fundsApi.createFund({ user_id: hasUserContext ? resolvedUserId : payload.user_id, name: payload.name });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: fundsQueryKeys.all });
      if (hasUserContext && userRole) {
        await queryClient.invalidateQueries({ queryKey: ['funds', 'user-record', userRole, userId] });
      }
      setDialogOpen(false);
      setSelectedFund(null);
    },
  });

  const deleteFundMutation = useMutation({
    mutationFn: (fund: Fund) => fundsApi.deleteFund(fund.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: fundsQueryKeys.all });
      if (hasUserContext && userRole) {
        await queryClient.invalidateQueries({ queryKey: ['funds', 'user-record', userRole, userId] });
      }
    },
  });

  const attachCurrencyMutation = useMutation({
    mutationFn: async (payload: { currency_id: number; balance: string }) => {
      const fundToUpdate = selectedFundForCurrency || selectedFundForView;
      if (!fundToUpdate) throw new Error('الصندوق غير محدد');
      return fundsApi.attachCurrency(fundToUpdate.id, payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: fundsQueryKeys.all });
      if (hasUserContext && userRole) {
        await queryClient.invalidateQueries({ queryKey: ['funds', 'user-record', userRole, userId] });
      }
      await queryClient.invalidateQueries({ queryKey: ['currencies'] });
      setAttachDialogOpen(false);
      setSelectedFundForCurrency(null);
    },
  });

  const openCreateDialog = () => {
    setSelectedFund(null);
    setDialogOpen(true);
  };

  const openEditDialog = (fund: Fund) => {
    setSelectedFund(fund);
    setDialogOpen(true);
  };

  const openCurrenciesDialog = (fund: Fund) => {
    setSelectedFundForView(fund);
    setCurrenciesDialogOpen(true);
  };

  const handleSubmit = async (payload: CreateFundPayload) => {
    await saveFundMutation.mutateAsync(payload);
    toast.success(selectedFund ? 'تم تعديل الصندوق بنجاح' : 'تم إنشاء الصندوق بنجاح');
  };

  const handleDelete = async (fund: Fund) => {
    await deleteFundMutation.mutateAsync(fund);
    toast.success('تم حذف الصندوق بنجاح');
  };

  const handleAttachCurrency = async (payload: { currency_id: number; balance: string }) => {
    await attachCurrencyMutation.mutateAsync(payload);
    toast.success('تم حفظ العملة بالصندوق بنجاح');
  };

  return (
    <div className="space-y-5">
      {!selectedFundId ? (
        <>
          <PageHeader
            badge="المالية"
            title={hasUserContext ? `صناديق ${resolvedUserName || 'المستخدم'}` : 'الصناديق'}
            action={
              <div className="flex gap-3">
                {!hasUserContext ? (
                  <Button type="button" variant="outline" onClick={() => navigate('/users')}>
                    العودة إلى المستخدمين
                  </Button>
                ) : null}
                <Button onClick={openCreateDialog} disabled={hasUserContext ? !hasUserId : false}>
                  إضافة صندوق جديد
                </Button>
              </div>
            }
          />

          {hasUserContext ? (
            userRecordQuery.isLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-[200px] rounded-lg border border-border bg-card animate-pulse" />
                ))}
              </div>
            ) : visibleFunds.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
                <Wallet className="mb-4 size-10 text-muted-foreground" />
                <h4 className="text-sm font-medium text-foreground">لا توجد صناديق</h4>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  لم يتم إضافة أي صناديق لهذا المستخدم بعد.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {visibleFunds.map((fund) => (
                  <FundCard
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
                    onMoreCurrenciesClick={openCurrenciesDialog}
                  />
                ))}
              </div>
            )
          ) : (
            fundsQuery.isLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-[200px] rounded-lg border border-border bg-card animate-pulse" />
                ))}
              </div>
            ) : visibleFunds.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
                <Wallet className="mb-4 size-10 text-muted-foreground" />
                <h4 className="text-sm font-medium text-foreground">لا توجد صناديق</h4>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  لم يتم إضافة أي صناديق بعد.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {visibleFunds.map((fund) => (
                  <FundCard
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
                    onMoreCurrenciesClick={openCurrenciesDialog}
                  />
                ))}
              </div>
            )
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
              title="العودة إلى الصناديق"
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
                    type="button"
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-sky-100 bg-sky-50/50 px-2.5 py-1 text-sm font-medium text-sky-900 transition-colors hover:bg-sky-100"
                    title="تعديل الرصيد"
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
                  if (currentFund) setSelectedFundForCurrency(currentFund);
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
                  if (currentFund) openEditDialog(currentFund);
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
              <FundRevenues fund={currentFund} />
            </TabsContent>

            <TabsContent value="expenses" className="space-y-5">
              <FundExpenses fund={currentFund} />
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

      <FundsDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        fund={selectedFund}
        userId={hasUserContext ? resolvedUserId : undefined}
        onSubmit={handleSubmit}
        loading={saveFundMutation.isPending}
      />

      <AttachCurrencyDialog
        open={attachDialogOpen}
        onOpenChange={(open) => {
          setAttachDialogOpen(open);
          if (!open) setSelectedFundForCurrency(null);
        }}
        currencies={currenciesQuery.data ?? []}
        onSubmit={handleAttachCurrency}
        loading={attachCurrencyMutation.isPending}
      />

      <FundCurrenciesDialog
        open={currenciesDialogOpen}
        onOpenChange={(open) => {
          setCurrenciesDialogOpen(open);
          if (!open) setSelectedFundForView(null);
        }}
        fund={selectedFundForView}
      />

      <FundCurrencyDialog
        open={currencyEditDialogOpen}
        onOpenChange={(open) => {
          setCurrencyEditDialogOpen(open);
          if (!open) setSelectedCurrencyForEdit(null);
        }}
        currency={selectedCurrencyForEdit}
        onSubmit={handleAttachCurrency}
        loading={attachCurrencyMutation.isPending}
      />


    </div>
  );
}

