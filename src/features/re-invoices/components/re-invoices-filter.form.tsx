import { useQuery } from '@tanstack/react-query';
import { Label } from '@/shared/components/ui/label';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/shared/components/ui/select';
import { SearchableSelect } from '@/shared/components/ui/searchable-select';
import { itemsApi } from '@/features/items/items.api';
import { usersApi } from '@/features/users/api/users.api';
import { projectFundsApi } from '@/features/projects/project-funds/project-funds.api';
import { companyFundsApi } from '@/features/company-funds/company-funds.api';
import { fundsApi } from '@/features/funds/funds.api';
import type { ReInvoiceFilterDraft, ReInvoiceFundSource } from '../re-invoices.filters';

type Props = {
  value: ReInvoiceFilterDraft;
  onChange: (value: ReInvoiceFilterDraft) => void;
};

export function ReInvoicesFilterForm({ value, onChange }: Props) {
  const setField = <K extends keyof ReInvoiceFilterDraft>(field: K, next: ReInvoiceFilterDraft[K]) =>
    onChange({ ...value, [field]: next });

  const items = useQuery({ queryKey: ['re-invoices-filter', 'items'], queryFn: () => itemsApi.getItems(1, 1000) });
  const suppliers = useQuery({ queryKey: ['re-invoices-filter', 'suppliers'], queryFn: () => usersApi.getUsersByRole('supplier', 1, 1000) });
  const projectFunds = useQuery({ queryKey: ['re-invoices-filter', 'project-funds'], queryFn: async () => (await projectFundsApi.getProjectFunds({ perPage: 1000 })).data, enabled: value.fundSource === 'project' });
  const companyFunds = useQuery({ queryKey: ['re-invoices-filter', 'company-funds'], queryFn: async () => (await companyFundsApi.getCompanyFunds({ perPage: 1000 })).data, enabled: value.fundSource === 'company' });
  const userFunds = useQuery({ queryKey: ['re-invoices-filter', 'user-funds'], queryFn: async () => (await fundsApi.getFunds({ perPage: 1000 })).data, enabled: value.fundSource === 'user' });

  const fundRows: any[] = value.fundSource === 'project'
    ? (projectFunds.data ?? [])
    : value.fundSource === 'company'
      ? (companyFunds.data ?? [])
      : value.fundSource === 'user'
        ? (userFunds.data ?? [])
        : [];

  return <div className="space-y-4">
    <div className="space-y-1.5"><Label>البحث</Label><Input value={value.search} onChange={(event) => setField('search', event.target.value)} placeholder="رقم المرتجع، البند أو المزوّد..." /></div>

    <div className="space-y-1.5"><Label>البند</Label><SearchableSelect loading={items.isLoading} value={value.itemId || undefined} onValueChange={(id) => setField('itemId', Number(id))} options={(items.data?.data ?? []).map((item) => ({ value: item.id, label: item.name }))} placeholder="كل البنود" /></div>
    <div className="space-y-1.5"><Label>المزوّد</Label><SearchableSelect loading={suppliers.isLoading} value={value.supplierId || undefined} onValueChange={(id) => setField('supplierId', Number(id))} options={(suppliers.data?.data ?? []).map((supplier: any) => ({ value: supplier.id, label: supplier.user?.name ?? supplier.name }))} placeholder="كل المزوّدين" /></div>

    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1.5"><Label>حالة الترحيل</Label><Select value={value.isPosted} onValueChange={(next) => setField('isPosted', (next ?? '') as ReInvoiceFilterDraft['isPosted'])}><SelectTrigger>{value.isPosted === 'true' ? 'مرحّل' : value.isPosted === 'false' ? 'غير مرحّل' : 'الكل'}</SelectTrigger><SelectContent><SelectItem value="">الكل</SelectItem><SelectItem value="true">مرحّل</SelectItem><SelectItem value="false">غير مرحّل</SelectItem></SelectContent></Select></div>
      <div className="space-y-1.5"><Label>الظهور للعميل</Label><Select value={value.isVisibleToClient} onValueChange={(next) => setField('isVisibleToClient', (next ?? '') as ReInvoiceFilterDraft['isVisibleToClient'])}><SelectTrigger>{value.isVisibleToClient === 'true' ? 'مرئي' : value.isVisibleToClient === 'false' ? 'غير مرئي' : 'الكل'}</SelectTrigger><SelectContent><SelectItem value="">الكل</SelectItem><SelectItem value="true">مرئي</SelectItem><SelectItem value="false">غير مرئي</SelectItem></SelectContent></Select></div>
    </div>

    <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
      <div className="space-y-1.5"><Label>نوع الصندوق</Label><Select value={value.fundSource} onValueChange={(next) => onChange({ ...value, fundSource: (next ?? '') as ReInvoiceFundSource, fundId: '' })}><SelectTrigger>{value.fundSource === 'project' ? 'صندوق مشروع' : value.fundSource === 'company' ? 'صندوق شركة' : value.fundSource === 'user' ? 'صندوق مستخدم' : 'كل الصناديق'}</SelectTrigger><SelectContent><SelectItem value="">كل الصناديق</SelectItem><SelectItem value="project">صندوق مشروع</SelectItem><SelectItem value="company">صندوق شركة</SelectItem><SelectItem value="user">صندوق مستخدم</SelectItem></SelectContent></Select></div>
      <div className="space-y-1.5"><Label>الصندوق</Label><SearchableSelect loading={projectFunds.isLoading || companyFunds.isLoading || userFunds.isLoading} disabled={!value.fundSource} value={value.fundId || undefined} onValueChange={(id) => setField('fundId', Number(id))} options={fundRows.map((fund) => ({ value: fund.id, label: fund.project?.name ? `${fund.name} — ${fund.project.name}` : fund.name }))} placeholder="كل الصناديق" /></div>
    </div>
  </div>;
}
