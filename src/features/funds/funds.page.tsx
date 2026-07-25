import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import { FundsTable } from './components/funds.table';
import { FundsDialog } from './components/funds.dialog';
import { fundsApi } from './funds.api';
import type { CreateFundPayload, Fund } from './types';

export function FundsPage() {
  const navigate = useNavigate();
  const params = useParams();
  const userId = Number(params.userId || '');
  const hasUserId = Number.isFinite(userId) && userId > 0;

  const [funds, setFunds] = useState<Fund[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedFund, setSelectedFund] = useState<Fund | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const visibleFunds = useMemo(() => {
    if (!hasUserId) {
      return funds;
    }

    return funds.filter((fund) => fund.user?.id === userId);
  }, [funds, hasUserId, userId]);

  const fetchFunds = async () => {
    setLoading(true);
    try {
      const data = await fundsApi.getFunds();
      setFunds(data);
    } catch {
      toast.error('تعذر جلب الصناديق');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchFunds();
  }, []);

  const openCreateDialog = () => {
    setSelectedFund(null);
    setDialogOpen(true);
  };

  const openEditDialog = (fund: Fund) => {
    setSelectedFund(fund);
    setDialogOpen(true);
  };

  const handleSubmit = async (payload: CreateFundPayload) => {
    setSubmitting(true);
    try {
      if (selectedFund) {
        const updated = await fundsApi.updateFund(selectedFund.id, {
          user_id: hasUserId ? userId : payload.user_id,
          name: payload.name,
        });
        setFunds((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
        toast.success('تم تعديل الصندوق بنجاح');
      } else {
        const created = await fundsApi.createFund({
          user_id: hasUserId ? userId : payload.user_id,
          name: payload.name,
        });
        setFunds((prev) => [...prev, created]);
        toast.success('تم إنشاء الصندوق بنجاح');
      }
      setDialogOpen(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'تعذر حفظ الصندوق');
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (fund: Fund) => {
    try {
      await fundsApi.deleteFund(fund.id);
      setFunds((prev) => prev.filter((item) => item.id !== fund.id));
      toast.success('تم حذف الصندوق بنجاح');
    } catch {
      toast.error('تعذر حذف الصندوق');
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-slate-200/80 bg-white p-3 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
              المالية
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
              {hasUserId ? 'صناديق المستخدم' : 'الصناديق'}
            </h1>
            <p className="text-sm text-slate-500">
              {hasUserId ? `الصناديق الخاصة بالمستخدم رقم ${userId}` : 'افتح مستخدمًا من جدول المستخدمين لإدارة صناديقه'}
            </p>
          </div>
          <div className="flex gap-3">
            {!hasUserId ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/users')}
                className="h-11 rounded-2xl border-slate-200 px-5 text-sm font-semibold"
              >
                العودة إلى المستخدمين
              </Button>
            ) : null}
            <Button
              onClick={openCreateDialog}
              disabled={!hasUserId}
              className="h-11 rounded-2xl bg-slate-950 px-5 text-sm font-semibold shadow-sm hover:bg-slate-800"
            >
              إضافة صندوق جديد
            </Button>
          </div>
        </div>
      </div>

      <FundsTable data={visibleFunds} loading={loading} onEdit={openEditDialog} onDelete={handleDelete} />

      <FundsDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        fund={selectedFund}
        userId={hasUserId ? userId : undefined}
        onSubmit={handleSubmit}
        loading={submitting}
      />
    </div>
  );
}
