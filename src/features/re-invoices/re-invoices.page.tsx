import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, RotateCcw, SlidersHorizontal, Undo2 } from 'lucide-react';
import { PageHeader } from '@/features/components/page-header';
import { Button } from '@/shared/components/ui/button';
import { SearchableSelect } from '@/shared/components/ui/searchable-select';
import { FilterDrawer } from '@/shared/components/ui/filter-drawer';
import { SimplePagination } from '@/components/ui/pagination';
import { cn } from '@/shared/lib/utils';
import { companyFundsApi } from '@/features/company-funds/company-funds.api';
import { projectFundsApi } from '@/features/projects/project-funds/project-funds.api';
import { fundsApi } from '@/features/funds/funds.api';
import { ReInvoicesTable } from './components/re-invoices.table';
import { ReInvoiceItemsDialog } from './components/re-invoice-items.dialog';
import { ReInvoiceDialog } from './components/re-invoice.dialog';
import { ReInvoicesFilterForm } from './components/re-invoices-filter.form';
import { EMPTY_RE_INVOICE_FILTERS, type ReInvoiceFilterDraft } from './re-invoices.filters';
import { useDeleteReInvoice, useReInvoices, useSaveReInvoice } from './re-invoices.hooks';
import type { ReInvoice } from './types';

type FundSource = 'project' | 'company' | 'user';
const modelBySource: Record<FundSource, string> = {
  project: 'App\\Models\\ProjectFundCurrency',
  company: 'App\\Models\\CompanyFundCurrency',
  user: 'App\\Models\\CurrencyFund',
};
const EMPTY_ROWS: any[] = [];

export function ReInvoicesPage() {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(5);
  const [sort, setSort] = useState<string>();
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState<ReInvoiceFilterDraft>({ ...EMPTY_RE_INVOICE_FILTERS });
  const [appliedFilters, setAppliedFilters] = useState<Record<string, unknown>>({});
  const [itemsId, setItemsId] = useState<number>();
  const [selectedReInvoice, setSelectedReInvoice] = useState<ReInvoice | null>(null);
  const [fundPickerOpen, setFundPickerOpen] = useState(false);
  const [source, setSource] = useState<FundSource>('project');
  const [fundId, setFundId] = useState<number>();
  const query = useReInvoices({ paginate: true, per_page: perPage, page, ...appliedFilters, sort: sort || undefined });
  const remove = useDeleteReInvoice();
  const save = useSaveReInvoice();
  const rows = query.data?.data ?? EMPTY_ROWS;

  const projectFunds = useQuery({ queryKey: ['re-invoices', 'project-funds'], queryFn: async () => (await projectFundsApi.getProjectFunds({ perPage: 1000 })).data, enabled: fundPickerOpen && source === 'project' });
  const companyFunds = useQuery({ queryKey: ['re-invoices', 'company-funds'], queryFn: async () => (await companyFundsApi.getCompanyFunds({ perPage: 1000 })).data, enabled: fundPickerOpen && source === 'company' });
  const userFunds = useQuery({ queryKey: ['re-invoices', 'user-funds'], queryFn: async () => (await fundsApi.getFunds({ perPage: 1000 })).data, enabled: fundPickerOpen && source === 'user' });
  const funds: any[] = source === 'project' ? (projectFunds.data ?? EMPTY_ROWS) : source === 'company' ? (companyFunds.data ?? EMPTY_ROWS) : (userFunds.data ?? EMPTY_ROWS);
  const selectedFund = funds.find((fund) => fund.id === fundId);
  const fundLoading = projectFunds.isLoading || companyFunds.isLoading || userFunds.isLoading;
  const meta = query.data?.meta;
  const activeFilterCount = Object.values(appliedFilters).filter((filter) => filter !== undefined && filter !== '').length;

  const applyFilters = () => {
    const fundFilter = draftFilters.fundSource === 'project'
      ? 'filter[project_fund_id]'
      : draftFilters.fundSource === 'company'
        ? 'filter[company_fund_id]'
        : draftFilters.fundSource === 'user'
          ? 'filter[fund_id]'
          : undefined;
    setAppliedFilters({
      'filter[search]': draftFilters.search.trim() || undefined,
      'filter[item_id]': draftFilters.itemId || undefined,
      'filter[supplier_id]': draftFilters.supplierId || undefined,
      'filter[is_posted]': draftFilters.isPosted === 'true' ? true : draftFilters.isPosted === 'false' ? false : undefined,
      'filter[is_visible_to_client]': draftFilters.isVisibleToClient === 'true' ? true : draftFilters.isVisibleToClient === 'false' ? false : undefined,
      ...(fundFilter ? { [fundFilter]: draftFilters.fundId || undefined } : {}),
    });
    setPage(1);
  };

  const resetFilters = () => {
    setDraftFilters({ ...EMPTY_RE_INVOICE_FILTERS });
    setAppliedFilters({});
    setPage(1);
  };

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
    const normalizedType = row.reinvoiceable_type?.replace(/\\+/g, '\\');
    const matchedSource = (Object.entries(modelBySource).find(([, type]) => type === normalizedType)?.[0] ?? 'project') as FundSource;
    setSelectedReInvoice(row);
    setSource(matchedSource);
    setFundId(undefined);
    setFundPickerOpen(true);
  };

  return <div className="flex flex-1 flex-col gap-5">
    <PageHeader badge="الإدارة المالية" title="المرتجعات" icon={Undo2} action={<div className="flex items-center gap-2">{(activeFilterCount > 0 || sort) && <Button type="button" variant="outline" size="icon" title="إعادة ضبط الفلاتر والترتيب" onClick={() => { resetFilters(); setSort(undefined); }}><RotateCcw className="size-4" /></Button>}<Button type="button" variant="outline" className={cn(activeFilterCount > 0 && 'border-primary text-primary')} onClick={() => setFilterDrawerOpen(true)}><SlidersHorizontal className="size-4" />فلترة{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}</Button><Button onClick={openCreateDialog}><Plus className="size-4" />إنشاء مرتجع</Button></div>} />
    <section className="surface-panel space-y-4 p-4 sm:p-5"><div><h2 className="font-semibold">سجل المرتجعات</h2><p className="mt-1 text-sm text-muted-foreground">مرتجعات صناديق المشاريع والشركة والمستخدمين.</p></div><ReInvoicesTable data={rows} loading={query.isLoading || remove.isPending} sort={sort} onSortChange={(next) => { setSort(next); setPage(1); }} onView={(row) => { setSelectedReInvoice(row); setItemsId(row.id); }} onEdit={openEditDialog} onDelete={async (row) => { await remove.mutateAsync(row.id); }} /></section>

    <SimplePagination currentPage={meta?.current_page ?? page} totalPages={meta?.last_page ?? 1} onPageChange={setPage} meta={meta} limit={perPage} limitOptions={[5, 10, 20, 50]} onLimitChange={(limit) => { setPerPage(limit); setPage(1); }} />

    <FilterDrawer open={filterDrawerOpen} onOpenChange={setFilterDrawerOpen} onApply={applyFilters} onReset={resetFilters} title="فلترة المرتجعات">
      <ReInvoicesFilterForm value={draftFilters} onChange={setDraftFilters} />
    </FilterDrawer>

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
        {selectedReInvoice && !fundLoading && funds.length > 0 && !selectedFund && <p className="text-sm text-destructive sm:col-span-2">تعذر تحديد الصندوق المرتبط تلقائيًا. اختر الصندوق الصحيح للمتابعة.</p>}
        {selectedFund && !selectedFund.currencies?.length && <p className="text-sm text-destructive sm:col-span-2">لا توجد عملات مرفقة بهذا الصندوق. أضف عملة أولًا.</p>}
      </>}
      onSubmit={async (payload) => {
        const saved = await save.mutateAsync({ id: selectedReInvoice?.id, payload });
        return saved;
      }}
    />
    <ReInvoiceItemsDialog id={itemsId} onClose={() => { setItemsId(undefined); setSelectedReInvoice(null); }} onEdit={selectedReInvoice ? () => { setItemsId(undefined); openEditDialog(selectedReInvoice); } : undefined} readOnly />
  </div>;
}
