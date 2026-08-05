import { useMemo, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FolderKanban, Calendar, User, ShieldCheck, Wallet, DollarSign, TrendingUp, TrendingDown, FileText, Percent, ShoppingBag, Info, ArrowLeftRight, ChevronDown } from 'lucide-react';
import { publicProjectsApi } from './public-projects.api';
import { apiClient } from '@/shared/api/axios.instance';
import type { Project } from '@/features/projects/types';
import type { Revenue } from '@/features/revenues/types';
import type { Expense } from '@/features/expenses/types';
import type { Invoice } from '@/features/invoices/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';

import { PublicProjectsHeader } from './components/public-projects-header';
import { ProjectFinancialSummary } from './components/project-financial-summary';
import { ProjectFundsSection } from './components/project-funds-section';
import { ProjectFinancialTabs } from './components/project-financial-tabs';
import { TransactionsTable } from './components/transactions-table';
import { InvoicesList } from './components/invoices-list';
import { TransfersList, getTransferDetails } from './components/transfers-list';
import { ProjectDetailsSkeleton } from './components/project-details-skeleton';
import { Skeleton } from '@/shared/components/ui/skeleton';

type TabId = 'revenues' | 'expenses' | 'invoices' | 'transfers';

function TabContentSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-card border border-border rounded-lg p-4 h-32 flex flex-col justify-between shadow-finance">
          <div className="space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3.5 w-1/2" />
          </div>
          <div className="space-y-1.5 pt-2 border-t border-border/40 mt-4">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function PublicProjectDetailsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const selectedProjectId = projectId ? Number(projectId) : null;
  const [activeFundTab, setActiveFundTab] = useState<number | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<TabId>('revenues');
  const [selectedRevenueId, setSelectedRevenueId] = useState<number | null>(null);
  const [isRevenueDialogOpen, setIsRevenueDialogOpen] = useState(false);

  const [selectedExpenseId, setSelectedExpenseId] = useState<number | null>(null);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);

  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);

  const [selectedTransferId, setSelectedTransferId] = useState<number | null>(null);
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);

  const currentUser = useMemo(() => {
    try {
      const raw = localStorage.getItem('user_info');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const handleLogout = async () => {
    try {
      await apiClient.post('/logout');
    } catch { }
    localStorage.removeItem('token_finance_nouh');
    localStorage.removeItem('user_info');
    navigate('/auth/login', { replace: true });
  };

  const handleBackToProjects = () => {
    if (location.pathname.startsWith('/public-projects')) {
      navigate('/public-projects');
    } else {
      navigate('/client/projects');
    }
  };

  const { data: projectDetails, isLoading: isLoadingDetails, refetch: refetchDetails, isRefetching } = useQuery<Project>({
    queryKey: ['public-project-details', selectedProjectId],
    queryFn: () => publicProjectsApi.getProjectById(selectedProjectId!),
    enabled: !!selectedProjectId,
  });

  const currentFunds = projectDetails?.funds || [];
  const selectedFund = currentFunds.find((f) => f.id === activeFundTab) || currentFunds[0];

  const { data: revenues = [], isLoading: isLoadingRevenues } = useQuery<Revenue[]>({
    queryKey: ['public-revenues', selectedFund?.id],
    queryFn: () => publicProjectsApi.getRevenues(selectedFund?.id),
    enabled: !!selectedProjectId && !!selectedFund?.id && activeSubTab === 'revenues',
  });

  const { data: expenses = [], isLoading: isLoadingExpenses } = useQuery<Expense[]>({
    queryKey: ['public-expenses', selectedFund?.id],
    queryFn: () => publicProjectsApi.getExpenses(selectedFund?.id),
    enabled: !!selectedProjectId && !!selectedFund?.id && activeSubTab === 'expenses',
  });

  const { data: invoices = [], isLoading: isLoadingInvoices } = useQuery<Invoice[]>({
    queryKey: ['public-invoices', selectedFund?.id],
    queryFn: () => publicProjectsApi.getInvoices(selectedFund?.id),
    enabled: !!selectedProjectId && !!selectedFund?.id && activeSubTab === 'invoices',
  });

  const { data: transfers = [], isLoading: isLoadingTransfers } = useQuery<any[]>({
    queryKey: ['public-transfers', selectedFund?.id],
    queryFn: () => publicProjectsApi.getTransfers(selectedFund?.id),
    enabled: !!selectedProjectId && !!selectedFund?.id && activeSubTab === 'transfers',
  });

  const { data: revenueDetails, isLoading: isLoadingRevenue } = useQuery({
    queryKey: ['public-revenue-details', selectedRevenueId],
    queryFn: async () => {
      const res = await apiClient.get(`/revenues/${selectedRevenueId}`);
      return res.data;
    },
    enabled: !!selectedRevenueId && isRevenueDialogOpen,
  });

  const { data: expenseDetails, isLoading: isLoadingExpense } = useQuery({
    queryKey: ['public-expense-details', selectedExpenseId],
    queryFn: async () => {
      const res = await apiClient.get(`/expenses/${selectedExpenseId}`);
      return res.data;
    },
    enabled: !!selectedExpenseId && isExpenseDialogOpen,
  });

  const { data: invoiceDetails, isLoading: isLoadingInvoice } = useQuery({
    queryKey: ['public-invoice-details', selectedInvoiceId],
    queryFn: async () => {
      const res = await apiClient.get(`/invoices/${selectedInvoiceId}`);
      return res.data;
    },
    enabled: !!selectedInvoiceId && isInvoiceDialogOpen,
  });

  const { data: transferDetailsEnvelope, isLoading: isLoadingTransfer } = useQuery({
    queryKey: ['public-transfer-details', selectedTransferId],
    queryFn: async () => {
      const res = await apiClient.get(`/transactions/${selectedTransferId}`);
      return res.data;
    },
    enabled: !!selectedTransferId && isTransferDialogOpen,
  });
  const transferDetails = transferDetailsEnvelope?.data || null;

  const getFundName = (info: any) => {
    if (!info) return '-';
    if (info.type === 'project_fund') {
      const fundId = info.details?.project_fund_id;
      const found = currentFunds.find((f) => f.id === fundId);
      if (found) return found.name;
      return info.details?.project_fund?.name || '-';
    }
    if (info.type === 'company_fund') {
      return info.details?.company_fund?.name || 'صندوق الشركة العام';
    }
    return '-';
  };

  const filteredRevenues = useMemo(() => {
    if (!selectedFund) return [];
    return revenues.filter((r) => r.is_posted === true);
  }, [revenues, selectedFund]);

  const filteredExpenses = useMemo(() => {
    if (!selectedFund) return [];
    return expenses.filter((e) => e.is_posted === true);
  }, [expenses, selectedFund]);

  const filteredInvoices = useMemo(() => {
    if (!selectedFund) return [];
    return invoices.filter((inv) => inv.is_posted === true && inv.is_visible_to_client === true);
  }, [invoices, selectedFund]);

  const filteredTransfers = useMemo(() => {
    if (!selectedFund) return [];
    return transfers;
  }, [transfers, selectedFund]);

  const totalRevenuesSum = useMemo(() => {
    return filteredRevenues.reduce((acc, r) => acc + (Number(r.amount) || 0), 0);
  }, [filteredRevenues]);

  const totalExpensesSum = useMemo(() => {
    return filteredExpenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  }, [filteredExpenses]);



  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <PublicProjectsHeader
        currentUser={currentUser}
        onLogout={handleLogout}
        onRefresh={refetchDetails}
        isRefreshing={isRefetching}
        onBack={handleBackToProjects}
      />

      <main className="px-4 py-2 space-y-3 sm:px-3 lg:px-4">
        {isLoadingDetails ? (
          <ProjectDetailsSkeleton />
        ) : projectDetails ? (
          <div className="space-y-3">

            <ProjectFinancialSummary
              project={projectDetails}
              totalRevenues={totalRevenuesSum}
              totalExpenses={totalExpensesSum}
              invoicesCount={filteredInvoices.length}
            />

            <div className="space-y-3">
              <ProjectFundsSection
                funds={currentFunds}
                selectedFundId={selectedFund?.id || null}
                onSelectFund={setActiveFundTab}
              />

              <ProjectFinancialTabs
                activeTab={activeSubTab}
                onTabChange={setActiveSubTab}
                counts={{
                  revenues: filteredRevenues.length,
                  expenses: filteredExpenses.length,
                  invoices: filteredInvoices.length,
                  transfers: filteredTransfers.length,
                }}
              />

              <div className="space-y-4">
                {activeSubTab === 'revenues' && (
                  isLoadingRevenues ? (
                    <TabContentSkeleton />
                  ) : (
                    <TransactionsTable
                      data={filteredRevenues as any}
                      type="revenues"
                      onViewDetails={(id) => {
                        setSelectedRevenueId(id);
                        setIsRevenueDialogOpen(true);
                      }}
                    />
                  )
                )}

                {activeSubTab === 'expenses' && (
                  isLoadingExpenses ? (
                    <TabContentSkeleton />
                  ) : (
                    <TransactionsTable
                      data={filteredExpenses as any}
                      type="expenses"
                      invoices={filteredInvoices}
                      onViewDetails={(id) => {
                        setSelectedExpenseId(id);
                        setIsExpenseDialogOpen(true);
                      }}
                    />
                  )
                )}

                {activeSubTab === 'invoices' && (
                  isLoadingInvoices ? (
                    <TabContentSkeleton />
                  ) : (
                    <InvoicesList
                      data={filteredInvoices}
                      onViewDetails={(id) => {
                        setSelectedInvoiceId(id);
                        setIsInvoiceDialogOpen(true);
                      }}
                    />
                  )
                )}

                {activeSubTab === 'transfers' && (
                  isLoadingTransfers ? (
                    <TabContentSkeleton />
                  ) : (
                    <TransfersList
                      data={filteredTransfers}
                      onViewDetails={(id) => {
                        setSelectedTransferId(id);
                        setIsTransferDialogOpen(true);
                      }}
                    />
                  )
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-16 text-center bg-card border border-border rounded-lg shadow-finance">
            <FolderKanban className="size-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-xs text-muted-foreground">حدث خطأ أثناء تحميل تفاصيل ومستندات المشروع المالية.</p>
          </div>
        )}
      </main>

      {isRevenueDialogOpen && selectedRevenueId && (
        <Dialog open={isRevenueDialogOpen} onOpenChange={setIsRevenueDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto font-sans" dir="rtl">
            <DialogHeader className="border-b border-border pb-3">
              <DialogTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <TrendingUp className="size-5 text-success" />
                <span>تفاصيل الإيراد</span>
              </DialogTitle>
            </DialogHeader>

            {isLoadingRevenue || !revenueDetails ? (
              <div className="py-12 text-center space-y-2">
                <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                <span className="text-xs text-muted-foreground">جاري تحميل التفاصيل...</span>
              </div>
            ) : (
              <div className="py-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-muted p-3 rounded-lg border border-border flex items-center gap-3">
                    <div className="p-2 bg-primary/10 text-primary rounded-md shrink-0">
                      <DollarSign className="size-4" />
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">المبلغ</span>
                      <span className="text-sm font-bold font-mono text-success">
                        +{new Intl.NumberFormat('en-US').format(Number(revenueDetails.amount) || 0)} <span className="text-xs font-semibold text-muted-foreground mx-0.5">{revenueDetails.revenueable_info?.details?.currency?.symbol || revenueDetails.revenueable_info?.details?.currency?.currency || ''}</span>
                      </span>
                    </div>
                  </div>

                  <div className="bg-muted p-3 rounded-lg border border-border flex items-center gap-3">
                    <div className="p-2 bg-primary/10 text-primary rounded-md shrink-0">
                      <Wallet className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] text-muted-foreground block">الصندوق التابع</span>
                      <span className="text-xs font-semibold text-foreground block truncate">{getFundName(revenueDetails.revenueable_info)}</span>
                    </div>
                  </div>

                  <div className="bg-muted p-3 rounded-lg border border-border flex items-center gap-3">
                    <div className="p-2 bg-primary/10 text-primary rounded-md shrink-0">
                      <Calendar className="size-4" />
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">تاريخ القيد</span>
                      <span className="text-xs font-semibold text-foreground block">{revenueDetails.created_at ? new Date(revenueDetails.created_at).toLocaleDateString('en-US') : '-'}</span>
                    </div>
                  </div>

                  <div className="bg-muted p-3 rounded-lg border border-border flex items-center gap-3">
                    <div className="p-2 bg-primary/10 text-primary rounded-md shrink-0">
                      <User className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] text-muted-foreground block">العميل</span>
                      <span className="text-xs font-semibold text-foreground block truncate">{revenueDetails.user?.name || '-'}</span>
                    </div>
                  </div>

                  <div className="bg-muted p-3 rounded-lg border border-border flex items-center gap-3 sm:col-span-2">
                    <div className="p-2 bg-primary/10 text-primary rounded-md shrink-0">
                      <ShieldCheck className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] text-muted-foreground block">المستلم بواسطة</span>
                      <span className="text-xs font-semibold text-foreground block truncate">{revenueDetails.received_by?.name || '-'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-muted p-3 rounded-lg border border-border">
                  <span className="text-[10px] text-muted-foreground block mb-1">البيان / الوصف</span>
                  <p className="text-xs text-foreground font-semibold leading-relaxed">
                    {revenueDetails.statement}
                  </p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      {isExpenseDialogOpen && selectedExpenseId && (
        <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto font-sans" dir="rtl">
            <DialogHeader className="border-b border-border pb-3">
              <DialogTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <TrendingDown className="size-5 text-destructive" />
                <span>تفاصيل المصروف</span>
              </DialogTitle>
            </DialogHeader>

            {isLoadingExpense || !expenseDetails ? (
              <div className="py-12 text-center space-y-2">
                <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                <span className="text-xs text-muted-foreground">جاري تحميل التفاصيل...</span>
              </div>
            ) : (
              <div className="py-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-muted p-3 rounded-lg border border-border flex items-center gap-3">
                    <div className="p-2 bg-primary/10 text-primary rounded-md shrink-0">
                      <DollarSign className="size-4" />
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">المبلغ</span>
                      <span className="text-sm font-bold font-mono text-destructive">
                        -{new Intl.NumberFormat('en-US').format(Number(expenseDetails.amount) || 0)} <span className="text-xs font-semibold text-muted-foreground mx-0.5">{expenseDetails.expenseable_info?.details?.currency?.symbol || expenseDetails.expenseable_info?.details?.currency?.currency || ''}</span>
                      </span>
                    </div>
                  </div>

                  <div className="bg-muted p-3 rounded-lg border border-border flex items-center gap-3">
                    <div className="p-2 bg-primary/10 text-primary rounded-md shrink-0">
                      <Wallet className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] text-muted-foreground block">الصندوق التابع</span>
                      <span className="text-xs font-semibold text-foreground block truncate">{getFundName(expenseDetails.expenseable_info)}</span>
                    </div>
                  </div>

                  <div className="bg-muted p-3 rounded-lg border border-border flex items-center gap-3">
                    <div className="p-2 bg-primary/10 text-primary rounded-md shrink-0">
                      <Calendar className="size-4" />
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">تاريخ القيد</span>
                      <span className="text-xs font-semibold text-foreground block">{expenseDetails.created_at ? new Date(expenseDetails.created_at).toLocaleDateString('en-US') : '-'}</span>
                    </div>
                  </div>

                  <div className="bg-muted p-3 rounded-lg border border-border flex items-center gap-3">
                    <div className="p-2 bg-primary/10 text-primary rounded-md shrink-0">
                      <User className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] text-muted-foreground block">العميل</span>
                      <span className="text-xs font-semibold text-foreground block truncate">{expenseDetails.user?.name || '-'}</span>
                    </div>
                  </div>

                  <div className="bg-muted p-3 rounded-lg border border-border flex items-center gap-3 sm:col-span-2">
                    <div className="p-2 bg-primary/10 text-primary rounded-md shrink-0">
                      <ShieldCheck className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] text-muted-foreground block">بواسطة (منشئ القيد)</span>
                      <span className="text-xs font-semibold text-foreground block truncate">{expenseDetails.created_by?.name || '-'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-muted p-3 rounded-lg border border-border">
                  <span className="text-[10px] text-muted-foreground block mb-1">البيان / الوصف</span>
                  <p className="text-xs text-foreground font-semibold leading-relaxed">
                    {expenseDetails.description}
                  </p>
                </div>

                {expenseDetails.invoices && expenseDetails.invoices.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-foreground block">الفواتير المرتبطة ({expenseDetails.invoices.length})</span>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                      {expenseDetails.invoices.map((invoice: any) => {
                        const supplierName = typeof invoice.supplier === 'string' ? invoice.supplier : invoice.supplier?.name;
                        const itemName = typeof invoice.item === 'string' ? invoice.item : invoice.item?.name;
                        return (
                          <div key={invoice.id} className="bg-card border border-border rounded-lg p-3 flex justify-between items-center shadow-sm">
                            <div className="space-y-1.5 min-w-0">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <FileText className="size-3.5 text-primary shrink-0" />
                                <span className="text-xs font-semibold text-foreground truncate">فاتورة #{invoice.invoice_number}</span>
                              </div>
                              <div className="text-[9px] text-muted-foreground flex flex-wrap gap-x-3 gap-y-1">
                                <span>المورد: <span className="font-semibold text-foreground">{supplierName || '-'}</span></span>
                                <span>البند: <span className="font-semibold text-foreground">{itemName || '-'}</span></span>
                                <span>التاريخ: <span className="font-semibold">{invoice.date}</span></span>
                              </div>
                            </div>
                            <span className="text-xs font-bold text-primary font-mono shrink-0 mr-2">{new Intl.NumberFormat('en-US').format(Number(invoice.final_total) || 0)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      {isInvoiceDialogOpen && selectedInvoiceId && (
        <Dialog open={isInvoiceDialogOpen} onOpenChange={setIsInvoiceDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto font-sans" dir="rtl">
            <DialogHeader className="border-b border-border pb-3">
              <DialogTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <FileText className="size-5 text-primary" />
                <span>تفاصيل الفاتورة</span>
              </DialogTitle>
            </DialogHeader>

            {isLoadingInvoice || !invoiceDetails ? (
              <div className="py-12 text-center space-y-2">
                <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                <span className="text-xs text-muted-foreground">جاري تحميل التفاصيل...</span>
              </div>
            ) : (
              <div className="py-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-muted p-3 rounded-lg border border-border flex items-center gap-3">
                    <div className="p-2 bg-primary/10 text-primary rounded-md shrink-0">
                      <DollarSign className="size-4" />
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">المبلغ النهائي</span>
                      <span className="text-sm font-bold font-mono text-primary">
                        {new Intl.NumberFormat('en-US').format(Number(invoiceDetails.final_total) || 0)}
                      </span>
                    </div>
                  </div>

                  <div className="bg-muted p-3 rounded-lg border border-border flex items-center gap-3">
                    <div className="p-2 bg-primary/10 text-primary rounded-md shrink-0">
                      <Percent className="size-4" />
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">الخصم</span>
                      <span className="text-sm font-bold font-mono text-destructive">
                        {Number(invoiceDetails.discount) > 0 ? `-${new Intl.NumberFormat('en-US').format(Number(invoiceDetails.discount) || 0)}` : '0'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-muted p-3 rounded-lg border border-border flex items-center gap-3">
                    <div className="p-2 bg-primary/10 text-primary rounded-md shrink-0">
                      <Calendar className="size-4" />
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">التاريخ</span>
                      <span className="text-xs font-semibold text-foreground block">{invoiceDetails.date}</span>
                    </div>
                  </div>

                  <div className="bg-muted p-3 rounded-lg border border-border flex items-center gap-3">
                    <div className="p-2 bg-primary/10 text-primary rounded-md shrink-0">
                      <User className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] text-muted-foreground block">المورد</span>
                      <span className="text-xs font-semibold text-foreground block truncate">{typeof invoiceDetails.supplier === 'string' ? invoiceDetails.supplier : invoiceDetails.supplier?.name || '-'}</span>
                    </div>
                  </div>

                  <div className="bg-muted p-3 rounded-lg border border-border flex items-center gap-3 sm:col-span-2">
                    <div className="p-2 bg-primary/10 text-primary rounded-md shrink-0">
                      <ShoppingBag className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] text-muted-foreground block">البند</span>
                      <span className="text-xs font-semibold text-foreground block truncate">{typeof invoiceDetails.item === 'string' ? invoiceDetails.item : invoiceDetails.item?.name || '-'}</span>
                    </div>
                  </div>
                </div>

                {invoiceDetails.expense && (
                  <div className="bg-muted p-3 rounded-lg border border-border space-y-2">
                    <div className="flex items-center gap-1.5 border-b border-border/50 pb-1.5">
                      <Info className="size-4 text-destructive" />
                      <span className="text-xs font-semibold text-foreground">المصروف المرتبط</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-muted-foreground block">وصف المصروف</span>
                        <span className="font-semibold text-foreground">{invoiceDetails.expense.description || '-'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block">مبلغ المصروف</span>
                        <span className="font-bold text-destructive font-mono">{new Intl.NumberFormat('en-US').format(Number(invoiceDetails.expense.amount) || 0)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {invoiceDetails.invoice_items && invoiceDetails.invoice_items.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-foreground block">مواد الفاتورة ({invoiceDetails.invoice_items.length})</span>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                      {invoiceDetails.invoice_items.map((item: any) => (
                        <details
                          key={item.id}
                          className="group border border-border rounded-lg bg-muted/40 overflow-hidden"
                        >
                          <summary className="flex items-center justify-between p-3 cursor-pointer select-none font-semibold text-xs text-foreground hover:bg-muted/80 list-none [&::-webkit-details-marker]:hidden">
                            <div className="flex items-center gap-2">
                              <ChevronDown className="size-3.5 transition-transform duration-200 group-open:rotate-180 shrink-0 text-muted-foreground" />
                              <span>{item.material?.name || item.item_description || 'مادة بدون اسم'}</span>
                            </div>
                            <span className="font-bold text-primary font-mono">
                              {new Intl.NumberFormat('en-US').format(Number(item.total_price) || 0)}
                            </span>
                          </summary>
                          <div className="p-3 border-t border-border bg-card text-xs space-y-2">
                            {(item.material?.description || item.item_description) && (
                              <div>
                                <span className="text-[10px] text-muted-foreground block">الوصف</span>
                                <p className="text-foreground font-medium">{item.material?.description || item.item_description}</p>
                              </div>
                            )}
                            <div className="grid grid-cols-3 gap-2 pt-1.5 text-[10px]">
                              <div>
                                <span className="text-muted-foreground block">الكمية</span>
                                <span className="font-semibold text-foreground">{item.quantity}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground block">الوحدة</span>
                                <span className="font-semibold text-foreground">{item.unit || '-'}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground block">سعر الوحدة</span>
                                <span className="font-semibold text-foreground font-mono">
                                  {new Intl.NumberFormat('en-US').format(Number(item.unit_price) || 0)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </details>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      {isTransferDialogOpen && selectedTransferId && (
        <Dialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto font-sans" dir="rtl">
            <DialogHeader className="border-b border-border pb-3">
              <DialogTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <ArrowLeftRight className="size-5 text-warning" />
                <span>تفاصيل التحويل المالي</span>
              </DialogTitle>
            </DialogHeader>

            {isLoadingTransfer || !transferDetails ? (
              <div className="py-12 text-center space-y-2">
                <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                <span className="text-xs text-muted-foreground">جاري تحميل التفاصيل...</span>
              </div>
            ) : (
              <div className="py-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-muted p-3 rounded-lg border border-border flex items-center gap-3">
                    <div className="p-2 bg-primary/10 text-primary rounded-md shrink-0">
                      <DollarSign className="size-4" />
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">مبلغ التحويل</span>
                      <span className="text-sm font-bold font-mono text-accent-gold">
                        {new Intl.NumberFormat('en-US').format(Number(transferDetails.amount) || 0)} <span className="text-xs font-semibold text-muted-foreground mx-0.5">{getTransferDetails(transferDetails.morph_from_info).currency || getTransferDetails(transferDetails.morph_to_info).currency || ''}</span>
                      </span>
                    </div>
                  </div>

                  <div className="bg-muted p-3 rounded-lg border border-border flex items-center gap-3">
                    <div className="p-2 bg-primary/10 text-primary rounded-md shrink-0">
                      <Calendar className="size-4" />
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">تاريخ التحويل</span>
                      <span className="text-xs font-semibold text-foreground block">{transferDetails.created_at ? new Date(transferDetails.created_at).toLocaleDateString('en-US') : '-'}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-muted p-3 rounded-lg border border-border space-y-2">
                    <span className="text-[10px] text-muted-foreground block border-b border-border/50 pb-1 flex justify-between items-center">
                      <span>الجهة المرسلة</span>
                    </span>
                    <div className="space-y-1">
                      <span className="text-xs text-foreground block" title={getTransferDetails(transferDetails.morph_from_info).label}>{getTransferDetails(transferDetails.morph_from_info).label}</span>
                      <span className="text-[10px] text-muted-foreground block">{getTransferDetails(transferDetails.morph_from_info).type}</span>

                    </div>
                  </div>

                  <div className="bg-muted p-3 rounded-lg border border-border space-y-2">
                    <span className="text-[10px] text-muted-foreground block border-b border-border/50 pb-1 flex justify-between items-center">
                      <span>الجهة المستلمة</span>
                    </span>
                    <div className="space-y-1">
                      <span className="text-xs text-foreground block" title={getTransferDetails(transferDetails.morph_to_info).label}>{getTransferDetails(transferDetails.morph_to_info).label}</span>
                      <span className="text-[10px] text-muted-foreground block">{getTransferDetails(transferDetails.morph_to_info).type}</span>

                    </div>
                  </div>
                </div>

                <div className="bg-muted p-3 rounded-lg border border-border">
                  <span className="text-[10px] text-muted-foreground block mb-1">اسم / بيان التحويل</span>
                  <p className="text-xs text-foreground font-semibold leading-relaxed">
                    {transferDetails.name}
                  </p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
