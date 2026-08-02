import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  FolderKanban,
  ArrowLeftRight,
  FolderOpen,
} from 'lucide-react';
import { publicProjectsApi } from './public-projects.api';
import { apiClient } from '@/shared/api/axios.instance';
import type { Project } from '@/features/projects/types';
import type { Revenue } from '@/features/revenues/types';
import type { Expense } from '@/features/expenses/types';
import type { Invoice } from '@/features/invoices/types';

import { PublicProjectsHeader } from './components/public-projects-header';
import { ProjectsSummary } from './components/projects-summary';
import { ProjectsToolbar } from './components/projects-toolbar';
import { ProjectCard } from './components/project-card';
import { ProjectDetailsHeader } from './components/project-details-header';
import { ProjectFinancialSummary } from './components/project-financial-summary';
import { ProjectFinancialSummaryCards } from './components/project-financial-summary-cards';
import { ProjectFundsSection } from './components/project-funds-section';
import { ProjectFinancialTabs } from './components/project-financial-tabs';
import { TransactionsTable } from './components/transactions-table';
import { InvoicesList } from './components/invoices-list';
import { TransfersList } from './components/transfers-list';
import { FinancialEmptyState } from './components/financial-empty-state';
import { ProjectDetailsSkeleton } from './components/project-details-skeleton';
import { ProjectMetadataSidebar } from './components/project-metadata-sidebar';

type TabId = 'overview' | 'revenues' | 'expenses' | 'invoices' | 'transfers';

export function PublicProjectsPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
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

  const { data: projects = [], isLoading: isLoadingProjects, refetch: refetchProjects, isRefetching } = useQuery<Project[]>({
    queryKey: ['public-projects'],
    queryFn: publicProjectsApi.getProjects,
  });

  const { data: projectDetails, isLoading: isLoadingDetails } = useQuery<Project>({
    queryKey: ['public-project-details', selectedProjectId],
    queryFn: () => publicProjectsApi.getProjectById(selectedProjectId!),
    enabled: !!selectedProjectId,
  });

  const { data: revenues = [] } = useQuery<Revenue[]>({
    queryKey: ['public-revenues'],
    queryFn: publicProjectsApi.getRevenues,
    enabled: !!selectedProjectId,
  });

  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: ['public-expenses'],
    queryFn: publicProjectsApi.getExpenses,
    enabled: !!selectedProjectId,
  });

  const { data: invoices = [] } = useQuery<Invoice[]>({
    queryKey: ['public-invoices'],
    queryFn: publicProjectsApi.getInvoices,
    enabled: !!selectedProjectId,
  });

  const { data: transfers = [] } = useQuery<any[]>({
    queryKey: ['public-transfers'],
    queryFn: publicProjectsApi.getTransfers,
    enabled: !!selectedProjectId,
  });

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesSearch =
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (project.client?.user?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (project.department?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [projects, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    const totalCost = projects.reduce((acc, curr) => acc + (Number(curr.expected_cost) || 0), 0);
    const completedCount = projects.filter((p) => p.status === 'completed').length;
    const inProgressCount = projects.filter((p) => p.status === 'in_progress').length;
    const pendingCount = projects.filter((p) => p.status === 'pending').length;
    return { total: projects.length, totalCost, completedCount, inProgressCount, pendingCount };
  }, [projects]);

  const currentFunds = projectDetails?.funds || [];
  const selectedFund = currentFunds.find((f) => f.id === activeFundTab) || currentFunds[0];

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

  const handleSelectProject = (id: number) => {
    setSelectedProjectId(id);
    setActiveFundTab(null);
    setActiveSubTab('overview');
  };

  const handleBackToProjects = () => {
    setSelectedProjectId(null);
  };

  const overviewRevenues = useMemo(() => filteredRevenues.slice(0, 3), [filteredRevenues]);
  const overviewExpenses = useMemo(() => filteredExpenses.slice(0, 3), [filteredExpenses]);
  const overviewInvoices = useMemo(() => filteredInvoices.slice(0, 3), [filteredInvoices]);

  if (selectedProjectId === null) {
    return (
      <div dir="rtl" className="min-h-screen bg-[#F6F7FB] text-[#172033] font-tajawal">
        <PublicProjectsHeader
          currentUser={currentUser}
          onLogout={handleLogout}
          onRefresh={refetchProjects}
          isRefreshing={isRefetching}
        />

        <main className=" px-4 py-4 space-y-3 sm:px-3 lg:px-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200/50">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#17182F]">
                مرحباً، {currentUser?.name || 'العميل العزيز'}
              </h2>
              <p className="text-xs sm:text-sm text-[#667085] mt-1.5">
                تابع أداء وتفاصيل مشاريعك المالية وتكاليفها التشغيلية من واجهة موحدة.
              </p>
            </div>
          </div>

          <ProjectsSummary
            total={stats.total}
            totalCost={stats.totalCost}
            inProgressCount={stats.inProgressCount}
            completedCount={stats.completedCount}
          />

          <ProjectsToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            resultsCount={filteredProjects.length}
          />

          {isLoadingProjects ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-44 bg-white border border-[#E7E9EF] rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="py-16 text-center bg-white border border-[#E7E9EF] rounded-xl shadow-xs">
              <Building2 className="size-12 mx-auto text-slate-350 mb-3" />
              <h3 className="text-sm font-bold text-slate-700">لا توجد مشاريع متاحة</h3>
              <p className="text-xs text-[#667085] mt-1.5">لا توجد مشاريع تطابق محددات البحث والفلاتر الحالية.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onSelect={handleSelectProject}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-[#F6F7FB] text-[#172033] font-tajawal">
      <PublicProjectsHeader
        currentUser={currentUser}
        onLogout={handleLogout}
        onRefresh={refetchProjects}
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
