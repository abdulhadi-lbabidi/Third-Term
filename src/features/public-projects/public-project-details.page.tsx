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
import { ProjectDetailsHeader } from './components/project-details-header';
import { ProjectFinancialSummary } from './components/project-financial-summary';
import { ProjectFinancialSummaryCards } from './components/project-financial-summary-cards';
import { ProjectFundsSection } from './components/project-funds-section';
import { ProjectFinancialTabs } from './components/project-financial-tabs';
import { TransactionsTable } from './components/transactions-table';
import { InvoicesList } from './components/invoices-list';
import { TransfersList } from './components/transfers-list';
import { ProjectDetailsSkeleton } from './components/project-details-skeleton';
import { ProjectMetadataSidebar } from './components/project-metadata-sidebar';

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
    return revenues.filter((r) => {
      const info = r.revenueable_info;
      return (
        r.revenueable_id === selectedFund.id ||
        info?.id === selectedFund.id ||
        info?.project_id === projectDetails?.id
      );
    });
  }, [revenues, selectedFund, projectDetails]);

  const filteredExpenses = useMemo(() => {
    if (!selectedFund) return [];
    return expenses.filter((e) => {
      const info = e.expenseable_info;
      return (
        e.expenseable_id === selectedFund.id ||
        info?.id === selectedFund.id ||
        info?.project_id === projectDetails?.id
      );
    });
  }, [expenses, selectedFund, projectDetails]);

  const filteredInvoices = useMemo(() => {
    if (!selectedProjectId) return [];
    return invoices.filter((inv) => {
      if (typeof inv.expense === 'object' && inv.expense?.expenseable_info) {
        return inv.expense.expenseable_info.project_id === selectedProjectId;
      }
      return true;
    });
  }, [invoices, selectedProjectId]);

  const filteredTransfers = useMemo(() => {
    if (!selectedFund || !selectedFund.currencies) return [];
    const fundCurrenciesIds = selectedFund.currencies.map((c) => c.id);
    return transfers.filter((t) => {
      const fromMatch = t.morph_from_type === 'App\\Models\\ProjectFundCurrency' && fundCurrenciesIds.includes(t.morph_from_id);
      const toMatch = t.morph_to_type === 'App\\Models\\ProjectFundCurrency' && fundCurrenciesIds.includes(t.morph_to_id);
      return fromMatch || toMatch;
    });
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
    <div dir="rtl" className="min-h-screen bg-[#F6F7FB] text-[#172033] font-tajawal">
      <PublicProjectsHeader
        currentUser={currentUser}
        onLogout={handleLogout}
        onRefresh={refetchDetails}
        isRefreshing={isRefetching}
      />

      <main className="px-4 py-2 space-y-3 sm:px-3 lg:px-4">
        {isLoadingDetails ? (
          <ProjectDetailsSkeleton />
        ) : projectDetails ? (
          <div className="space-y-3">
            <ProjectDetailsHeader
              projectName={projectDetails.name}
              onBack={handleBackToProjects}
            />

            <ProjectFinancialSummary project={projectDetails} />

            <ProjectFinancialSummaryCards
              expectedCost={projectDetails.expected_cost}
              totalRevenues={totalRevenuesSum}
              totalExpenses={totalExpensesSum}
              invoicesCount={filteredInvoices.length}
            />

            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3 bg-white border border-[#E7E9EF] rounded-xl p-5 shadow-xs">
                          <h4 className="text-xs font-extrabold text-[#17182F] border-b border-slate-100 pb-3 flex justify-between items-center">
                            <span>آخر الإيرادات</span>
                            <button onClick={() => setActiveSubTab('revenues')} className="text-[10px] text-[#C9A84C] hover:underline font-bold">عرض الكل</button>
                          </h4>
                          <div className="space-y-2">
                            {overviewRevenues.length === 0 ? (
                              <p className="text-xs text-[#667085] py-4 text-center">لا توجد إيرادات مسجلة.</p>
                            ) : (
                              overviewRevenues.map((rev) => (
                                <div key={rev.id} className="flex justify-between items-center text-xs p-2.5 bg-slate-50 rounded-lg">
                                  <span className="font-semibold text-slate-800">{rev.statement}</span>
                                  <span className="font-extrabold text-emerald-600">+{new Intl.NumberFormat('ar-SA').format(Number(rev.amount) || 0)}</span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        <div className="space-y-3 bg-white border border-[#E7E9EF] rounded-xl p-5 shadow-xs">
                          <h4 className="text-xs font-extrabold text-[#17182F] border-b border-slate-100 pb-3 flex justify-between items-center">
                            <span>آخر المصروفات</span>
                            <button onClick={() => setActiveSubTab('expenses')} className="text-[10px] text-[#C9A84C] hover:underline font-bold">عرض الكل</button>
                          </h4>
                          <div className="space-y-2">
                            {overviewExpenses.length === 0 ? (
                              <p className="text-xs text-[#667085] py-4 text-center">لا توجد مصروفات مسجلة.</p>
                            ) : (
                              overviewExpenses.map((exp) => (
                                <div key={exp.id} className="flex justify-between items-center text-xs p-2.5 bg-slate-50 rounded-lg">
                                  <span className="font-semibold text-slate-800">{exp.description}</span>
                                  <span className="font-extrabold text-rose-600">-{new Intl.NumberFormat('ar-SA').format(Number(exp.amount) || 0)}</span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="bg-white border border-[#E7E9EF] rounded-xl p-5 shadow-xs space-y-3">
                        <h4 className="text-xs font-extrabold text-[#17182F] border-b border-slate-100 pb-3 flex justify-between items-center">
                          <span>آخر الفواتير</span>
                          <button onClick={() => setActiveSubTab('invoices')} className="text-[10px] text-[#C9A84C] hover:underline font-bold">عرض الكل</button>
                        </h4>
                        <div className="space-y-2">
                          {overviewInvoices.length === 0 ? (
                            <p className="text-xs text-[#667085] py-4 text-center">لا توجد فواتير مسجلة.</p>
                          ) : (
                            overviewInvoices.map((inv) => (
                              <div key={inv.id} className="flex justify-between items-center text-xs p-2.5 bg-slate-50 rounded-lg">
                                <span className="font-bold text-slate-800">فاتورة #{inv.invoice_number}</span>
                                <span className="font-extrabold text-blue-700">{new Intl.NumberFormat('ar-SA').format(Number(inv.final_total) || 0)}</span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeSubTab === 'revenues' && (
                    <TransactionsTable data={filteredRevenues} type="revenues" />
                  )}

                  {activeSubTab === 'expenses' && (
                    <TransactionsTable data={filteredExpenses} type="expenses" />
                  )}

                  {activeSubTab === 'invoices' && (
                    <InvoicesList data={filteredInvoices} />
                  )}

                  {activeSubTab === 'transfers' && (
                    <TransfersList data={filteredTransfers} />
                  )}
                </div>
              </div>

              <ProjectMetadataSidebar
                project={projectDetails}
                fundsCount={currentFunds.length}
                invoicesCount={filteredInvoices.length}
                revenuesCount={filteredRevenues.length}
                expensesCount={filteredExpenses.length}
              />
            </div>
          </div>
        ) : (
          <div className="py-16 text-center bg-white border border-[#E7E9EF] rounded-xl shadow-xs">
            <FolderKanban className="size-12 mx-auto text-slate-350 mb-3" />
            <p className="text-xs text-[#667085]">حدث خطأ أثناء تحميل تفاصيل ومستندات المشروع المالية.</p>
          </div>
        )}
      </main>
    </div>
  );
}
