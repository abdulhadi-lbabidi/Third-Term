import { useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
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
  const [statusFilter, setStatusFilter] = useState<string>('all');

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

  const handleSelectProject = (id: number) => {
    if (location.pathname.startsWith('/public-projects')) {
      navigate(`/public-projects/${id}`);
    } else {
      navigate(`/client/projects/${id}`);
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-border">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
              مرحباً، {currentUser?.name || 'العميل العزيز'}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1.5">
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
              <div key={i} className="h-44 bg-card border border-border rounded-lg shadow-finance animate-pulse" />
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="py-16 text-center bg-card border border-border rounded-lg shadow-finance">
            <Building2 className="size-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="text-sm font-semibold text-foreground">لا توجد مشاريع متاحة</h3>
            <p className="text-xs text-muted-foreground mt-1.5">لا توجد مشاريع تطابق محددات البحث والفلاتر الحالية.</p>
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

