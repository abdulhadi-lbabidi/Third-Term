import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Banknote, CheckCircle2, Plus, Undo2 } from 'lucide-react';
import { PageHeader } from '@/features/components/page-header';
import { Button } from '@/shared/components/ui/button';
import { SearchableSelect } from '@/shared/components/ui/searchable-select';
import { companyFundsApi } from '@/features/company-funds/company-funds.api';
import { projectFundsApi } from '@/features/projects/project-funds/project-funds.api';
import { fundsApi } from '@/features/funds/funds.api';
import { ReInvoicesTable } from './components/re-invoices.table';
import { ReInvoiceItemsDialog } from './components/re-invoice-items.dialog';
import { ReInvoiceDialog } from './components/re-invoice.dialog';
import { useDeleteReInvoice, useReInvoices, useSaveReInvoice } from './re-invoices.hooks';
import type { ReInvoice } from './types';

type FundSource = 'project' | 'company' | 'user';
const modelBySource: Record<FundSource, string> = {
  project: 'App\\Models\\ProjectFundCurrency',
  company: 'App\\Models\\CompanyFundCurrency',
  user: 'App\\Models\\CurrencyFund',
};

export function ReInvoicesPage() {
  const [itemsId, setItemsId] = useState<number>();
  const [selectedReInvoice, setSelectedReInvoice] = useState<ReInvoice | null>(null);
  const [fundPickerOpen, setFundPickerOpen] = useState(false);
  const [source, setSource] = useState<FundSource>('project');
  const [fundId, setFundId] = useState<number>();
  const query = useReInvoices();
  const remove = useDeleteReInvoice();
  const save = useSaveReInvoice();
  const rows = query.data?.data ?? [];

  const projectFunds = useQuery({ queryKey: ['re-invoices', 'project-funds'], queryFn: () => projectFundsApi.getProjectFunds(), enabled: fundPickerOpen && source === 'project' });
  const companyFunds = useQuery({ queryKey: ['re-invoices', 'company-funds'], queryFn: async () => (await companyFundsApi.getCompanyFunds()).data, enabled: fundPickerOpen && source === 'company' });
  const userFunds = useQuery({ queryKey: ['re-invoices', 'user-funds'], queryFn: fundsApi.getFunds, enabled: fundPickerOpen && source === 'user' });
  const funds: any[] = source === 'project' ? (projectFunds.data ?? []) : source === 'company' ? (companyFunds.data ?? []) : (userFunds.data ?? []);
  const selectedFund = funds.find((fund) => fund.id === fundId);
  const fundLoading = projectFunds.isLoading || companyFunds.isLoading || userFunds.isLoading;
  const stats = useMemo(() => ({ posted: rows.filter((row) => row.is_posted).length, amount: rows.reduce((sum, row) => sum + Number(row.final_total || 0), 0) }), [rows]);

  useEffect(() => {
    if (!fundPickerOpen || !selectedReInvoice || fundId || !funds.length) return;
    const matchingFund = funds.find((fund) => (fund.currencies ?? []).some(
      (currency: any) => Number(currency.expenseable_id ?? currency.id) === Number(selectedReInvoice.reinvoiceable_id),
    ));
    if (matchingFund) setFundId(Number(matchingFund.id));
  }, [fundId, fundPickerOpen, funds, selectedReInvoice]);

  const openCreateDialog = () => {
    setSelectedReInvoice(null);
    setFundId(undefined);
    setFundPickerOpen(true);
  };

  const openEditDialog = (row: ReInvoice) => {
    const matchedSource = (Object.entries(modelBySource).find(([, type]) => type === row.reinvoiceable_type)?.[0] ?? 'project') as FundSource;
    setSelectedReInvoice(row);
    setSource(matchedSource);
    setFundId(undefined);
    setFundPickerOpen(true);
  };

  return <div className="flex flex-1 flex-col gap-5">
    <PageHeader badge="الإدارة المالية" title="المرتجعات" icon={Undo2} action={<Button onClick={openCreateDialog}><Plus className="size-4" />إنشاء مرتجع</Button>} />
    <div className="grid gap-3 sm:grid-cols-3"><div className="surface-panel p-4"><p className="text-xs text-muted-foreground">إجمالي المرتجعات</p><p className="finance-num mt-1 text-2xl font-bold">{rows.length}</p></div><div className="surface-panel p-4"><p className="flex gap-1 text-xs text-muted-foreground"><CheckCircle2 className="size-4" />المرحلة</p><p className="finance-num mt-1 text-2xl font-bold">{stats.posted}</p></div><div className="surface-panel p-4"><p className="flex gap-1 text-xs text-muted-foreground"><Banknote className="size-4" />القيمة الإجمالية</p><p className="finance-num mt-1 text-2xl font-bold">{stats.amount.toLocaleString()}</p></div></div>
    <section className="surface-panel space-y-4 p-4 sm:p-5"><div><h2 className="font-semibold">سجل المرتجعات</h2><p className="mt-1 text-sm text-muted-foreground">مرتجعات صناديق المشاريع والشركة والمستخدمين.</p></div><ReInvoicesTable data={rows} loading={query.isLoading || remove.isPending} onEdit={openEditDialog} onDelete={async (row) => { await remove.mutateAsync(row.id); }} onItems={(row) => setItemsId(row.id)} /></section>

    <ReInvoiceDialog
      open={fundPickerOpen}
      onClose={() => { setFundPickerOpen(false); setSelectedReInvoice(null); }}
      value={selectedReInvoice}
      currencies={(selectedFund?.currencies ?? []).map((currency: any) => ({ id: currency.id, expenseable_id: currency.expenseable_id, currency: currency.currency, symbol: currency.symbol, balance: currency.balance }))}
      modelType={modelBySource[source]}
      loading={save.isPending}
      submitDisabled={!selectedFund?.currencies?.length}
      headerFields={<>
        <label className="space-y-1 sm:col-span-1"><span>نوع الصندوق</span><SearchableSelect value={source} onValueChange={(value) => { setSource(value as FundSource); setFundId(undefined); }} options={[{ value: 'project', label: 'صندوق مشروع' }, { value: 'company', label: 'صندوق شركة' }, { value: 'user', label: 'صندوق مستخدم' }]} /></label>
        <label className="space-y-1 sm:col-span-1"><span>الصندوق</span><SearchableSelect loading={fundLoading} value={fundId} onValueChange={(value) => setFundId(Number(value))} options={funds.map((fund) => ({ value: fund.id, label: fund.project?.name ? `${fund.name} — ${fund.project.name}` : fund.name }))} placeholder="اختر الصندوق" emptyMessage="لا توجد صناديق" /></label>
        {selectedFund && !selectedFund.currencies?.length && <p className="text-sm text-destructive sm:col-span-2">لا توجد عملات مرفقة بهذا الصندوق. أضف عملة أولًا.</p>}
      </>}
      onSubmit={async (payload) => {
        const saved = await save.mutateAsync({ id: selectedReInvoice?.id, payload });
        return saved;
      }}
    />
    <ReInvoiceItemsDialog id={itemsId} onClose={() => setItemsId(undefined)} />
  </div>;
}
