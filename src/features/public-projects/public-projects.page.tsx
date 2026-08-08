import { useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Building2 } from 'lucide-react';
import { publicProjectsApi } from './public-projects.api';
import { apiClient } from '@/shared/api/axios.instance';
import type { Project } from '@/features/projects/types';

import { PublicProjectsHeader } from './components/public-projects-header';
import { ProjectsSummary } from './components/projects-summary';
import { ProjectsToolbar } from './components/projects-toolbar';
import { ProjectCard } from './components/project-card';

export function PublicProjectsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const currentUser = useMemo(() => {
    try {
      const raw = localStorage.getItem('user_info');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const isLimitedRole = useMemo(() => {
    return ['employee', 'engineer'].includes(currentUser?.role_type || '');
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await apiClient.post('/logout');
    } catch { }
    localStorage.removeItem('token_finance_nouh');
    localStorage.removeItem('user_info');
    navigate('/auth/login', { replace: true });
  };

  const handleSearchSubmit = () => {
    setSearch(searchQuery);
  };

  const handleReset = () => {
    setSearchQuery('');
    setSearch('');
  };

  const apiFilters = useMemo(() => {
    return {
      ...(search ? { 'filter[search]': search } : {}),
      'filter[status]': isLimitedRole ? 'in_progress' : (statusFilter !== 'all' ? statusFilter : undefined),
    };
  }, [search, statusFilter, isLimitedRole]);

  const { data: projects = [], isLoading: isLoadingProjects, refetch: refetchProjects, isRefetching } = useQuery<Project[]>({
    queryKey: ['public-projects', apiFilters],
    queryFn: () => publicProjectsApi.getProjects(apiFilters),
    placeholderData: keepPreviousData,
  });

  const stats = useMemo(() => {
    const totalCost = projects.reduce((acc, curr) => acc + (Number(curr.expected_cost) || 0), 0);
    const completedCount = projects.filter((p) => p.status === 'completed').length;
    const inProgressCount = projects.filter((p) => p.status === 'in_progress').length;
    const pendingCount = projects.filter((p) => p.status === 'pending').length;
    return { total: projects.length, totalCost, completedCount, inProgressCount, pendingCount };
  }, [projects]);

  const handleSelectProject = (id: number) => {
    if (location.pathname.startsWith('/public-projects')) {
      navigate(`/public-projects/${id}`);
    } else {
      navigate(`/public/projects/${id}`);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <PublicProjectsHeader
        currentUser={currentUser}
        onLogout={handleLogout}
        onRefresh={refetchProjects}
        isRefreshing={isRefetching}
      />

      <main className="px-4 py-4 space-y-3 sm:px-3 lg:px-4">
        <ProjectsSummary
          total={stats.total}
          totalCost={stats.totalCost}
          inProgressCount={stats.inProgressCount}
          completedCount={stats.completedCount}
        />

        <ProjectsToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchSubmit={handleSearchSubmit}
          onReset={handleReset}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          resultsCount={projects.length}
          hideStatusButtons={isLimitedRole}
        />

        {isLoadingProjects ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-44 bg-card border border-border rounded-lg shadow-finance animate-pulse" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="py-16 text-center bg-card border border-border rounded-lg shadow-finance">
            <Building2 className="size-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="text-sm font-semibold text-foreground">لا توجد مشاريع متاحة</h3>
            <p className="text-xs text-muted-foreground mt-1.5">لا توجد مشاريع تطابق محددات البحث والفلاتر الحالية.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {projects.map((project) => (
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
