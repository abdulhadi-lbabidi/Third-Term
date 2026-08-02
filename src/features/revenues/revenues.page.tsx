import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components/ui/button';
import { PageHeader } from '../components/page-header';
import { RevenuesTable } from './components/revenues.table';
import { useRevenues, useDeleteRevenue } from './revenues.hooks';
import type { Revenue } from './types';
import { TrendingUp } from 'lucide-react';
import { SimplePagination } from '@/components/ui/pagination';

export function RevenuesPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);

  const { data: response, isLoading } = useRevenues(page, perPage);
  const deleteMutation = useDeleteRevenue();

  const handleAddClick = () => {
    navigate('/revenues/new');
  };

  const handleEditClick = async (revenue: Revenue) => {
    navigate(`/revenues/new?revenueId=${revenue.id}`);
  };

  const handleDelete = async (revenue: Revenue) => {
    await deleteMutation.mutateAsync(revenue.id);
  };

  const revenues = response?.data ?? [];
  const meta = response?.meta;
  const totalPages = meta?.last_page ?? 1;
  const currentPage = meta?.current_page ?? page;

  return (
    <div className="flex flex-col flex-1 space-y-4">
      <PageHeader
        badge="الإيرادات"
        title="الإيرادات"
        icon={TrendingUp}
        action={
          <Button
            type="button"
            onClick={handleAddClick}
            className="h-11 rounded-lg bg-slate-950 px-5 text-sm font-semibold shadow-sm hover:bg-slate-800"
          >
            إضافة إيراد جديد
          </Button>
        }
      />

      <RevenuesTable
        data={revenues}
        loading={isLoading}
        onEdit={handleEditClick}
        onDelete={handleDelete}
      />

      <SimplePagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setPage}
        meta={meta}
        limit={perPage}
        limitOptions={[5, 10, 20, 50, 100]}
        onLimitChange={setPerPage}
      />
    </div>
  );
}
