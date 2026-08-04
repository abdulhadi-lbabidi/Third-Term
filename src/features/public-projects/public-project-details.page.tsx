import { useMemo, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FolderKanban, Calendar, User, ShieldCheck, Wallet, DollarSign, TrendingUp, TrendingDown, FileText, Percent, ShoppingBag, Info, ArrowLeftRight } from 'lucide-react';
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

type TabId = 'overview' | 'revenues' | 'expenses' | 'invoices' | 'transfers';

export function PublicProjectDetailsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const selectedProjectId = projectId ? Number(projectId) : null;
  const [activeFundTab, setActiveFundTab] = useState<number | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<TabId>('overview');
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

  const { data: revenues = [] } = useQuery<Revenue[]>({
    queryKey: ['public-revenues', selectedFund?.id],
    queryFn: () => publicProjectsApi.getRevenues(selectedFund?.id),
    enabled: !!selectedProjectId && !!selectedFund?.id,
  });

  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: ['public-expenses', selectedFund?.id],
    queryFn: () => publicProjectsApi.getExpenses(selectedFund?.id),
    enabled: !!selectedProjectId && !!selectedFund?.id,
  });

  const { data: invoices = [] } = useQuery<Invoice[]>({
    queryKey: ['public-invoices', selectedFund?.id],
    queryFn: () => publicProjectsApi.getInvoices(selectedFund?.id),
    enabled: !!selectedProjectId && !!selectedFund?.id,
  });

  const { data: transfers = [] } = useQuery<any[]>({
    queryKey: ['public-transfers', selectedFund?.id],
    queryFn: () => publicProjectsApi.getTransfers(selectedFund?.id),
    enabled: !!selectedProjectId && !!selectedFund?.id,
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

  const overviewRevenues = useMemo(() => filteredRevenues.slice(0, 3), [filteredRevenues]);
  const overviewExpenses = useMemo(() => filteredExpenses.slice(0, 3), [filteredExpenses]);
  const overviewInvoices = useMemo(() => filteredInvoices.slice(0, 3), [filteredInvoices]);

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
              funds={currentFunds}
              selectedFundId={selectedFund?.id || null}
              onSelectFund={setActiveFundTab}
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
                {activeSubTab === 'overview' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-3 bg-card border border-border rounded-lg p-5 shadow-finance">
                        <h4 className="text-xs font-semibold text-foreground border-b border-border pb-3 flex justify-between items-center">
                          <span>آخر الإيرادات</span>
                          <button onClick={() => setActiveSubTab('revenues')} className="text-[10px] text-accent-gold hover:underline font-semibold">عرض الكل</button>
                        </h4>
                        <div className="space-y-2">
                          {overviewRevenues.length === 0 ? (
                            <p className="text-xs text-muted-foreground py-4 text-center">لا توجد إيرادات مسجلة.</p>
                          ) : (
                            overviewRevenues.map((rev) => {
                              const info = rev.revenueable_info;
                              const symbol = info?.details?.currency?.symbol || info?.details?.currency?.currency || '';
                              return (
                                <div
                                  key={rev.id}
                                  onClick={() => {
                                    setSelectedRevenueId(rev.id);
                                    setIsRevenueDialogOpen(true);
                                  }}
                                  className="flex justify-between items-center text-xs p-2.5 bg-muted rounded-md cursor-pointer hover:bg-muted/80 transition-all"
                                >
                                  <span className="font-semibold text-foreground">{rev.statement}</span>
                                  <span className="font-bold text-success">
                                    +{new Intl.NumberFormat('en-US').format(Number(rev.amount) || 0)} <span className="text-xs sm:text-sm font-semibold text-muted-foreground mx-1">{symbol}</span>
                                  </span>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>

                      <div className="space-y-3 bg-card border border-border rounded-lg p-5 shadow-finance">
                        <h4 className="text-xs font-semibold text-foreground border-b border-border pb-3 flex justify-between items-center">
                          <span>آخر المصروفات</span>
                          <button onClick={() => setActiveSubTab('expenses')} className="text-[10px] text-accent-gold hover:underline font-semibold">عرض الكل</button>
                        </h4>
                        <div className="space-y-2">
                          {overviewExpenses.length === 0 ? (
                            <p className="text-xs text-muted-foreground py-4 text-center">لا توجد مصروفات مسجلة.</p>
                          ) : (
                            overviewExpenses.map((exp) => {
                              const info = exp.expenseable_info;
                              const symbol = (info?.details as any)?.currency?.symbol || (info?.details as any)?.currency?.currency || '';
                              return (
                                <div
                                  key={exp.id}
                                  onClick={() => {
                                    setSelectedExpenseId(exp.id);
                                    setIsExpenseDialogOpen(true);
                                  }}
                                  className="flex justify-between items-center text-xs p-2.5 bg-muted rounded-md cursor-pointer hover:bg-muted/80 transition-all"
                                >
                                  <span className="font-semibold text-foreground">{exp.description}</span>
                                  <span className="font-bold text-destructive">
                                    -{new Intl.NumberFormat('en-US').format(Number(exp.amount) || 0)} <span className="text-xs sm:text-sm font-semibold text-muted-foreground mx-1">{symbol}</span>
                                  </span>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>

                      <div className="space-y-3 bg-card border border-border rounded-lg p-5 shadow-finance">
                        <h4 className="text-xs font-semibold text-foreground border-b border-border pb-3 flex justify-between items-center">
                          <span>آخر الفواتير</span>
                          <button onClick={() => setActiveSubTab('invoices')} className="text-[10px] text-accent-gold hover:underline font-semibold">عرض الكل</button>
                        </h4>
                        <div className="space-y-2">
                          {overviewInvoices.length === 0 ? (
                            <p className="text-xs text-muted-foreground py-4 text-center">لا توجد فواتير مسجلة.</p>
                          ) : (
                            overviewInvoices.map((inv) => (
                              <div
                                key={inv.id}
                                onClick={() => {
                                  setSelectedInvoiceId(inv.id);
                                  setIsInvoiceDialogOpen(true);
                                }}
                                className="flex justify-between items-center text-xs p-2.5 bg-muted rounded-md cursor-pointer hover:bg-muted/80 transition-all"
                              >
                                <span className="font-semibold text-foreground">فاتورة #{inv.invoice_number}</span>
                                <span className="font-bold text-primary">{new Intl.NumberFormat('en-US').format(Number(inv.final_total) || 0)}</span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeSubTab === 'revenues' && (
                  <TransactionsTable
                    data={filteredRevenues as any}
                    type="revenues"
                    onViewDetails={(id) => {
                      setSelectedRevenueId(id);
                      setIsRevenueDialogOpen(true);
                    }}
                  />
                )}

                {activeSubTab === 'expenses' && (
                  <TransactionsTable
                    data={filteredExpenses as any}
                    type="expenses"
                    invoices={filteredInvoices}
                    onViewDetails={(id) => {
                      setSelectedExpenseId(id);
                      setIsExpenseDialogOpen(true);
                    }}
                  />
                )}

                {activeSubTab === 'invoices' && (
                  <InvoicesList
                    data={filteredInvoices}
                    onViewDetails={(id) => {
                      setSelectedInvoiceId(id);
                      setIsInvoiceDialogOpen(true);
                    }}
                  />
                )}

                {activeSubTab === 'transfers' && (
                  <TransfersList
                    data={filteredTransfers}
                    onViewDetails={(id) => {
                      setSelectedTransferId(id);
                      setIsTransferDialogOpen(true);
                    }}
                  />
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
                      <span className="text-xs text-foreground block truncate" title={getTransferDetails(transferDetails.morph_from_info).label}>{getTransferDetails(transferDetails.morph_from_info).label}</span>
                      <span className="text-[10px] text-muted-foreground block">{getTransferDetails(transferDetails.morph_from_info).type}</span>
                    
                    </div>
                  </div>

                  <div className="bg-muted p-3 rounded-lg border border-border space-y-2">
                    <span className="text-[10px] text-muted-foreground block border-b border-border/50 pb-1 flex justify-between items-center">
                      <span>الجهة المستلمة</span>
                    </span>
                    <div className="space-y-1">
                      <span className="text-xs text-foreground block truncate" title={getTransferDetails(transferDetails.morph_to_info).label}>{getTransferDetails(transferDetails.morph_to_info).label}</span>
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
