import { useMemo, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FolderKanban } from 'lucide-react';
import { publicProjectsApi } from './public-projects.api';
import { apiClient } from '@/shared/api/axios.instance';
import type { Project } from '@/features/projects/types';
import type { Revenue } from '@/features/revenues/types';
import type { Expense } from '@/features/expenses/types';
import type { Invoice } from '@/features/invoices/types';

import { PublicProjectsHeader } from './components/public-projects-header';
import { ProjectFinancialSummary } from './components/project-financial-summary';
import { ProjectFundsSection } from './components/project-funds-section';
import { ProjectFinancialTabs } from './components/project-financial-tabs';
import { TransactionsTable } from './components/transactions-table';
import { InvoicesList } from './components/invoices-list';
import { TransfersList } from './components/transfers-list';
import { ProjectDetailsSkeleton } from './components/project-details-skeleton';

type TabId = 'overview' | 'revenues' | 'expenses' | 'invoices' | 'transfers';

export function PublicProjectDetailsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const selectedProjectId = projectId ? Number(projectId) : null;
  const [activeFundTab, setActiveFundTab] = useState<number | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<TabId>('overview');

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
                                <div key={rev.id} className="flex justify-between items-center text-xs p-2.5 bg-muted rounded-md">
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
                                <div key={exp.id} className="flex justify-between items-center text-xs p-2.5 bg-muted rounded-md">
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
                              <div key={inv.id} className="flex justify-between items-center text-xs p-2.5 bg-muted rounded-md">
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
                  <TransactionsTable data={filteredRevenues as any} type="revenues" />
                )}

                {activeSubTab === 'expenses' && (
                  <TransactionsTable data={filteredExpenses as any} type="expenses" invoices={filteredInvoices} />
                )}

                {activeSubTab === 'invoices' && (
                  <InvoicesList data={filteredInvoices} />
                )}

                {activeSubTab === 'transfers' && (
                  <TransfersList data={filteredTransfers} />
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
    </div>
  );
}
