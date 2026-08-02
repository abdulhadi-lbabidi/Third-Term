import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  FolderKanban,
  Wallet,
  TrendingUp,
  TrendingDown,
  FileText,
  Search,
  CheckCircle2,
  Building,
  RefreshCw,
  LogOut,
  ChevronLeft,
  LayersIcon,
  BarChart3,
  ArrowRight,
  DollarSign,
  Clock,
} from 'lucide-react';
import { publicProjectsApi } from './public-projects.api';
import { apiClient } from '@/shared/api/axios.instance';
import type { Project, ProjectStatus } from '@/features/projects/types';
import type { Revenue } from '@/features/revenues/types';
import type { Expense } from '@/features/expenses/types';
import type { Invoice } from '@/features/invoices/types';

export function PublicProjectsPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [activeFundTab, setActiveFundTab] = useState<number | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'revenues' | 'expenses' | 'invoices'>('revenues');

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

  const { data: projects = [], isLoading: isLoadingProjects, refetch: refetchProjects } = useQuery<Project[]>({
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

  const getStatusConfig = (status: ProjectStatus) => {
    switch (status) {
      case 'completed':
        return { label: 'مكتمل', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200', dot: 'bg-emerald-500', barColor: 'bg-emerald-500' };
      case 'in_progress':
        return { label: 'قيد التنفيذ', bg: 'bg-amber-50 text-amber-800 border-amber-200', dot: 'bg-amber-500', barColor: 'bg-amber-500' };
      case 'cancelled':
        return { label: 'ملغي', bg: 'bg-rose-50 text-rose-800 border-rose-200', dot: 'bg-rose-500', barColor: 'bg-rose-500' };
      default:
        return { label: 'قيد الانتظار', bg: 'bg-slate-50 text-slate-700 border-slate-200', dot: 'bg-slate-400', barColor: 'bg-slate-400' };
    }
  };

  const formatNumber = (val: number | string) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('ar-SA').format(num);
  };

  if (selectedProjectId === null) {
    return (
      <div dir="rtl" className="min-h-screen bg-[#f8f9fa] font-sans text-slate-800" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
        <div className="h-1 w-full bg-gradient-to-r from-[#1a1a2e] via-[#c9a84c] to-[#1a1a2e]" />
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-lg bg-[#c9a84c] flex items-center justify-center text-white font-bold text-lg shadow-md transition-transform hover:scale-105">
                  ن
                </div>
                <div>
                  <h1 className="text-base font-extrabold text-[#1a1a2e] leading-tight">نوح المالية</h1>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">بوابة مشاريع العميل</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {currentUser && (
                  <div className="flex items-center gap-2">
                    <div className="hidden sm:block text-end">
                      <p className="text-xs font-semibold text-slate-900 leading-none">{currentUser.name}</p>
                      <p className="text-[9px] text-[#c9a84c] mt-0.5 font-bold">حساب عميل</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="size-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-105 transition-all shadow-xs"
                      title="تسجيل الخروج"
                    >
                      <LogOut className="size-4" />
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => refetchProjects()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#c9a84c]/30 text-xs text-[#c9a84c] hover:bg-[#c9a84c]/5 transition-all font-semibold"
                >
                  <RefreshCw className="size-3.5" />
                  <span className="hidden sm:inline">تحديث</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-screen-2xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {[
              { icon: FolderKanban, label: 'مشاريعك', value: stats.total, color: 'text-slate-700 bg-slate-50 border-r-4 border-slate-400' },
              { icon: DollarSign, label: 'إجمالي التكاليف', value: `$${formatNumber(stats.totalCost)}`, color: 'text-emerald-800 bg-emerald-50/50 border-r-4 border-emerald-500' },
              { icon: Clock, label: 'قيد التنفيذ', value: stats.inProgressCount, color: 'text-amber-800 bg-amber-50/50 border-r-4 border-amber-500' },
              { icon: CheckCircle2, label: 'مشاريع مكتملة', value: stats.completedCount, color: 'text-purple-805 bg-purple-50/55 border-r-4 border-purple-500' },
            ].map((stat, i) => (
              <div key={i} className={`bg-white rounded-xl p-4 flex items-center gap-3.5 shadow-xs border border-slate-200/80 ${stat.color.split(' ')[2]} ${stat.color.split(' ')[3]}`}>
                <div className={`p-2 rounded-lg ${stat.color.split(' ')[1]}`}>
                  <stat.icon className="size-4.5 shrink-0 text-current" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-medium">{stat.label}</p>
                  <p className="text-base font-extrabold text-slate-900 mt-0.5">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white border border-slate-200/80 rounded-xl p-3 mb-4 flex flex-col sm:flex-row items-center gap-3 shadow-xs">
            <div className="w-full sm:flex-1 relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث باسم المشروع أو القسم..."
                className="w-full bg-slate-50/50 border border-slate-200 rounded-lg ps-9 pe-4 py-2 text-xs text-slate-800 placeholder:text-slate-405 focus:outline-none focus:ring-1 focus:ring-[#c9a84c] focus:border-[#c9a84c] transition-all"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
              {[
                { id: 'all', label: 'الكل' },
                { id: 'pending', label: 'انتظار' },
                { id: 'in_progress', label: 'قيد التنفيذ' },
                { id: 'completed', label: 'مكتمل' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${statusFilter === tab.id
                      ? 'bg-[#1a1a2e] text-[#c9a84c] shadow-sm'
                      : 'bg-slate-100 text-slate-605 hover:bg-slate-200'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {isLoadingProjects ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-44 bg-white border border-slate-200 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="py-16 text-center bg-white border border-slate-200/80 rounded-xl shadow-xs">
              <Building2 className="size-12 mx-auto text-slate-300 mb-3" />
              <h3 className="text-sm font-bold text-slate-705">لا توجد مشاريع حالياً</h3>
              <p className="text-xs text-slate-400 mt-1">لا توجد نتائج مطابقة لبحثك الحالي.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProjects.map((project) => {
                const statusConf = getStatusConfig(project.status);
                return (
                  <div
                    key={project.id}
                    onClick={() => {
                      setSelectedProjectId(project.id);
                      setActiveFundTab(null);
                    }}
                    className="group relative bg-white border border-slate-200/80 rounded-xl overflow-hidden cursor-pointer hover:border-[#c9a84c] hover:shadow-md transition-all duration-200 flex flex-col justify-between"
                  >
                    <div className="h-[3px] w-full bg-[#1a1a2e]" />
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2.5 mb-3">
                          <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold border ${statusConf.bg}`}>
                            <span className={`size-1 rounded-full ${statusConf.dot}`} />
                            {statusConf.label}
                          </span>
                        </div>
                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug group-hover:text-[#c9a84c] transition-colors line-clamp-2 mb-2">
                          {project.name}
                        </h3>
                        {project.department && (
                          <div className="flex items-center gap-1 text-[10px] text-[#c9a84c] font-medium mb-4">
                            <Building className="size-3 shrink-0 text-current" />
                            <span className="truncate">{project.department.name}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-auto">
                        <div>
                          <span className="text-[9px] text-slate-400 block font-medium">التكلفة المتوقعة</span>
                          <span className="text-sm font-extrabold text-[#1a1a2e]">
                            ${formatNumber(project.expected_cost)}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-[#c9a84c] flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all transform translate-x-1 group-hover:translate-x-0">
                          التفاصيل
                          <ChevronLeft className="size-3.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    );
  }

  const activeStatusConf = getStatusConfig(projectDetails?.status || 'pending');

  return (
    <div dir="rtl" className="min-h-screen bg-[#f8f9fa] font-sans text-slate-800" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
      <div className="h-1 w-full bg-gradient-to-r from-[#1a1a2e] via-[#c9a84c] to-[#1a1a2e]" />
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-lg bg-[#c9a84c] flex items-center justify-center text-white font-bold text-lg shadow-sm">
                ن
              </div>
              <div>
                <h1 className="text-base font-extrabold text-[#1a1a2e] leading-tight">نوح المالية</h1>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">بوابة مشاريع العميل</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {currentUser && (
                <div className="flex items-center gap-2">
                  <div className="hidden sm:block text-end">
                    <p className="text-xs font-semibold text-slate-900 leading-none">{currentUser.name}</p>
                    <p className="text-[9px] text-[#c9a84c] mt-0.5 font-bold">حساب عميل</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="size-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100 transition-all"
                    title="تسجيل الخروج"
                  >
                    <LogOut className="size-4" />
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => setSelectedProjectId(null)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#c9a84c]/30 text-xs text-[#c9a84c] hover:bg-[#c9a84c]/5 transition-all font-semibold"
              >
                <ArrowRight className="size-3.5" />
                <span>العودة للمشاريع</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <button
          type="button"
          onClick={() => setSelectedProjectId(null)}
          className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 mb-4 hover:bg-slate-50 hover:text-slate-800 shadow-xs transition-all"
        >
          <ArrowRight className="size-4" />
          العودة للقائمة الرئيسية
        </button>

        {isLoadingDetails ? (
          <div className="h-96 bg-white border border-slate-200 rounded-xl animate-pulse" />
        ) : projectDetails ? (
          <div className="bg-white border border-slate-250 rounded-xl shadow-xs overflow-hidden">
            <div className="h-[3px] w-full bg-gradient-to-r from-[#1a1a2e] via-[#c9a84c] to-[#1a1a2e]" />
            <div className="border-b border-slate-200 p-6 bg-slate-50/50">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-5">
                <div className="border-r-4 border-[#c9a84c] pr-4">
                  <span className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">تفاصيل ومستندات المشروع المالية</span>
                  <h2 className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug">
                    {projectDetails.name}
                  </h2>
                </div>
                <span className={`w-fit shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${activeStatusConf.bg}`}>
                  <span className={`size-1.5 rounded-full ${activeStatusConf.dot}`} />
                  {activeStatusConf.label}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">التكلفة الإجمالية للمشروع</span>
                  <span className="text-base font-extrabold text-[#c9a84c]">
                    ${formatNumber(projectDetails.expected_cost)}
                  </span>
                </div>
                {projectDetails.department && (
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">القسم الهندسي</span>
                    <span className="text-xs font-extrabold text-slate-700">{projectDetails.department.name}</span>
                  </div>
                )}
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">تاريخ الإنشاء</span>
                  <span className="text-xs font-semibold text-slate-650">
                    {projectDetails.created_at ? new Date(projectDetails.created_at).toLocaleDateString('ar-SA') : 'غير محدد'}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Wallet className="size-4 text-[#c9a84c]" />
                  <h4 className="text-xs font-bold text-[#1a1a2e] uppercase tracking-wider">
                    صناديق المشروع المالية المشتركة
                  </h4>
                  <span className="ms-auto text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full font-bold">{currentFunds.length} صناديق</span>
                </div>

                {currentFunds.length === 0 ? (
                  <div className="py-8 text-center bg-slate-50 border border-slate-200 rounded-lg">
                    <Wallet className="size-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-xs text-slate-400">لا تتوفر صناديق مالية حالياً.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {currentFunds.length > 1 && (
                      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-100">
                        {currentFunds.map((fund) => {
                          const isSelected = (selectedFund?.id || currentFunds[0]?.id) === fund.id;
                          return (
                            <button
                              key={fund.id}
                              type="button"
                              onClick={() => setActiveFundTab(fund.id)}
                              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 border ${isSelected
                                  ? 'bg-[#1a1a2e] text-[#c9a84c] border-[#1a1a2e]'
                                  : 'bg-white text-slate-650 border-slate-200 hover:border-slate-300'
                                }`}
                            >
                              {fund.name}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {selectedFund && (
                      <div className="space-y-4">
                        {selectedFund.currencies && selectedFund.currencies.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {selectedFund.currencies.map((curr) => (
                              <div
                                key={curr.id}
                                className="rounded-xl border border-slate-200/80 bg-gradient-to-br from-[#1a1a2e] to-[#252542] text-white p-4 relative shadow-sm overflow-hidden"
                              >
                                <div className="absolute top-0 start-0 w-full h-[2px] bg-gradient-to-r from-[#c9a84c] to-[#c9a84c]/20" />
                                <p className="text-[9px] text-white/50 font-bold uppercase tracking-wider">{curr.currency}</p>
                                <p className="text-lg font-extrabold text-[#c9a84c] mt-1">{curr.balance}</p>
                                <p className="text-[9px] text-white/40 mt-0.5">{curr.symbol} — رصيد نشط</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs text-slate-400 text-center py-4 bg-slate-50 rounded-lg">
                            لا توجد عملات في هذا الصندوق.
                          </div>
                        )}

                        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                          <div className="flex items-center border-b border-slate-200 bg-slate-50/60">
                            {[
                              { id: 'revenues' as const, label: 'الإيرادات', icon: TrendingUp, count: filteredRevenues.length, active: 'text-emerald-700 border-emerald-500 bg-white' },
                              { id: 'expenses' as const, label: 'المصروفات', icon: TrendingDown, count: filteredExpenses.length, active: 'text-rose-700 border-rose-500 bg-white' },
                              { id: 'invoices' as const, label: 'الفواتير', icon: FileText, count: filteredInvoices.length, active: 'text-blue-700 border-blue-500 bg-white' },
                            ].map((tab) => (
                              <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveSubTab(tab.id)}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold border-b-2 transition-all ${activeSubTab === tab.id
                                    ? tab.active
                                    : 'border-transparent text-slate-405 hover:text-slate-700'
                                  }`}
                              >
                                <tab.icon className="size-3.5" />
                                {tab.label}
                                <span className="bg-slate-105 border border-slate-200 px-1.5 py-0.5 rounded-full text-[9px] font-bold text-slate-500">{tab.count}</span>
                              </button>
                            ))}
                          </div>

                          <div className="p-4 space-y-2 max-h-60 overflow-y-auto">
                            {activeSubTab === 'revenues' && (
                              filteredRevenues.length === 0 ? (
                                <div className="py-8 text-center text-xs text-slate-400 flex flex-col items-center gap-1.5">
                                  <BarChart3 className="size-6 text-slate-200" />
                                  لا توجد إيرادات مسجلة.
                                </div>
                              ) : filteredRevenues.map((rev) => (
                                <div key={rev.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-150 hover:border-emerald-250 transition-colors">
                                  <div>
                                    <p className="text-xs font-bold text-slate-800">{rev.statement}</p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">
                                      {rev.created_at ? new Date(rev.created_at).toLocaleDateString('ar-SA') : ''}
                                    </p>
                                  </div>
                                  <span className="text-xs font-extrabold text-emerald-600">+{rev.amount}</span>
                                </div>
                              ))
                            )}

                            {activeSubTab === 'expenses' && (
                              filteredExpenses.length === 0 ? (
                                <div className="py-8 text-center text-xs text-slate-400 flex flex-col items-center gap-1.5">
                                  <LayersIcon className="size-6 text-slate-200" />
                                  لا توجد مصروفات مسجلة.
                                </div>
                              ) : filteredExpenses.map((exp) => (
                                <div key={exp.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-150 hover:border-rose-250 transition-colors">
                                  <div>
                                    <p className="text-xs font-bold text-slate-800">{exp.description}</p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">
                                      {exp.created_at ? new Date(exp.created_at).toLocaleDateString('ar-SA') : ''}
                                    </p>
                                  </div>
                                  <span className="text-xs font-extrabold text-rose-600">-{exp.amount}</span>
                                </div>
                              ))
                            )}

                            {activeSubTab === 'invoices' && (
                              filteredInvoices.length === 0 ? (
                                <div className="py-8 text-center text-xs text-slate-400 flex flex-col items-center gap-1.5">
                                  <FileText className="size-6 text-slate-200" />
                                  لا توجد فواتير مسجلة.
                                </div>
                              ) : filteredInvoices.map((inv) => (
                                <div key={inv.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-150 hover:border-blue-250 transition-colors">
                                  <div>
                                    <p className="text-xs font-bold text-slate-800">فاتورة #{inv.invoice_number}</p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">{inv.date}</p>
                                  </div>
                                  <div className="text-end">
                                    <p className="text-xs font-extrabold text-blue-700">{inv.final_total}</p>
                                    <p className="text-[9px] text-slate-400">خصم: {inv.discount}</p>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-16 text-center bg-white border border-slate-200 rounded-xl shadow-xs">
            <FolderKanban className="size-10 mx-auto text-slate-350 mb-2" />
            <p className="text-xs text-slate-400">حدث خطأ أثناء تحميل تفاصيل المشروع.</p>
          </div>
        )}
      </main>
    </div>
  );
}
