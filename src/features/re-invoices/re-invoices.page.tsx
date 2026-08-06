import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Banknote, CheckCircle2, Plus, Undo2 } from 'lucide-react';
import { PageHeader } from '@/features/components/page-header';
import { Button } from '@/shared/components/ui/button';
import { ReInvoicesTable } from './components/re-invoices.table';
import { ReInvoiceItemsDialog } from './components/re-invoice-items.dialog';
import { useDeleteReInvoice, useReInvoices } from './re-invoices.hooks';

export function ReInvoicesPage() {
  const navigate = useNavigate(); const [itemsId, setItemsId] = useState<number>(); const query = useReInvoices(); const remove = useDeleteReInvoice(); const rows = query.data?.data ?? [];
  const stats = useMemo(() => ({ posted: rows.filter((row) => row.is_posted).length, amount: rows.reduce((sum, row) => sum + Number(row.final_total || 0), 0) }), [rows]);
  return <div className="flex flex-1 flex-col gap-5"><PageHeader badge="الإدارة المالية" title="المرتجعات" icon={Undo2} action={<Button onClick={() => navigate('/funds')}><Plus className="size-4" />إنشاء مرتجع من صندوق</Button>} />
    <div className="grid gap-3 sm:grid-cols-3"><div className="surface-panel p-4"><p className="text-xs text-muted-foreground">إجمالي المرتجعات</p><p className="finance-num mt-1 text-2xl font-bold">{rows.length}</p></div><div className="surface-panel p-4"><p className="flex gap-1 text-xs text-muted-foreground"><CheckCircle2 className="size-4" />المرحلة</p><p className="finance-num mt-1 text-2xl font-bold">{stats.posted}</p></div><div className="surface-panel p-4"><p className="flex gap-1 text-xs text-muted-foreground"><Banknote className="size-4" />القيمة الإجمالية</p><p className="finance-num mt-1 text-2xl font-bold">{stats.amount.toLocaleString()}</p></div></div>
    <section className="surface-panel space-y-4 p-4 sm:p-5"><div><h2 className="font-semibold">سجل المرتجعات</h2><p className="mt-1 text-sm text-muted-foreground">مرتجعات صناديق المشاريع والشركة والمستخدمين.</p></div><ReInvoicesTable data={rows} loading={query.isLoading || remove.isPending} onDelete={async (row) => { await remove.mutateAsync(row.id); }} onItems={(row) => setItemsId(row.id)} /></section><ReInvoiceItemsDialog id={itemsId} onClose={() => setItemsId(undefined)} /></div>;
}
