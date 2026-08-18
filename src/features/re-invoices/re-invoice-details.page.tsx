import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  FolderKanban,
  UserRound,
  Wallet,
  Banknote,
  FileText,
  Calendar,
  ArrowRight,
  TrendingDown,
  ChevronLeft,
  PackageOpen,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { PageHeader } from '../components/page-header';
import { reInvoicesApi } from './re-invoices.api';
import { formatArabicDate } from '@/shared/lib/utils';
import type { ReInvoice, ReInvoiceItem } from './types';

const roleLabels: Record<string, string> = {
  admin: 'المدير',
  client: 'العميل',
  investor: 'المستثمر',
  craftsman: 'الحرفي',
  employee: 'الموظف',
  engineer: 'المهندس',
  supplier: 'المورد',
  trustee: 'الأمين',
  user: 'مستخدم',
};

function getSourceMeta(reinvoice?: ReInvoice | null) {
  const type = reinvoice?.reinvoiceable_info?.type ?? reinvoice?.reinvoiceable_type;

  if (type === 'company_fund' || type === 'App\\Models\\CompanyFundCurrency') {
    return {
      key: 'company_fund' as const,
      label: 'صندوق الشركة',
      icon: Building2,
    };
  }

  if (type === 'project_fund' || type === 'App\\Models\\ProjectFundCurrency') {
    return {
      key: 'project_fund' as const,
      label: 'صندوق المشروع',
      icon: FolderKanban,
    };
  }

  if (type === 'currency_fund' || type === 'user_fund' || type === 'App\\Models\\CurrencyFund') {
    return {
      key: 'user_fund' as const,
      label: 'صندوق مستخدم',
      icon: Wallet,
    };
  }

  return {
    key: 'unknown' as const,
    label: 'غير محدد',
    icon: FileText,
  };
}

function getUserName(user?: any) {
  if (!user) return '-';
  if (typeof user === 'string') return user || '-';
  if (typeof user === 'number') return String(user);
  return user.name || '-';
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/70 py-1.5 last:border-b-0">
      <span className="shrink-0 text-xs text-muted-foreground">{label}</span>
      <span className="text-end text-sm font-medium text-foreground">{value ?? '-'}</span>
    </div>
  );
}

function DetailSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-card shadow-finance">
      <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-3 py-2">
        <div className="flex size-7 items-center justify-center rounded-md border border-border bg-card text-primary">
          <Icon className="size-3.5" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <div className="px-3 py-0.5">{children}</div>
    </section>
  );
}

function ReInvoiceDetailsContent({ reinvoice }: { reinvoice: ReInvoice }) {
  const source = getSourceMeta(reinvoice);
  const SourceIcon = source.icon;
  const details = reinvoice.reinvoiceable_info?.details;
  const supplier = typeof reinvoice.supplier === 'object' ? (reinvoice.supplier as any) : null;

  const companyDetails =
    source.key === 'company_fund' && details && typeof details === 'object'
      ? (details as any)
      : null;

  const projectDetails =
    source.key === 'project_fund' && details && typeof details === 'object'
      ? (details as any)
      : null;

  const userFundDetails =
    source.key === 'user_fund' && details && typeof details === 'object'
      ? (details as any)
      : null;

  const fundUserInfo = (reinvoice.reinvoiceable_info as any)?.user_info;
  const currencyLabel = details?.currency?.symbol ?? details?.currency?.currency ?? '';

  return (
    <div className="space-y-2.5">
      <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="space-y-1">
            <div className="status-badge-primary inline-flex items-center gap-1.5">
              <SourceIcon className="size-3.5" />
              {source.label}
            </div>
            <p className="max-w-xl text-sm font-semibold text-foreground">
              {typeof reinvoice.item === 'string' ? reinvoice.item : reinvoice.item?.name ?? '-'}
            </p>
          </div>
          <div className="text-end">
            <p className="text-xs text-muted-foreground">الإجمالي النهائي</p>
            <p className="finance-num text-xl font-semibold text-primary">{Number(reinvoice.final_total || 0).toLocaleString()} {currencyLabel}</p>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className={reinvoice.is_posted ? 'status-badge-success' : 'status-badge-danger'}>
            {reinvoice.is_posted ? 'مرحّل' : 'غير مرحّل'}
          </span>
          <span className="status-badge-neutral">
            <Calendar className="size-3.5" />
            {reinvoice.date ? formatArabicDate(reinvoice.date) : '-'}
          </span>
          <span className="status-badge-neutral">#{reinvoice.id}</span>
        </div>
      </div>

      <div className="grid gap-2.5 md:grid-cols-2">
        <DetailSection title="معلومات عامة" icon={FileText}>
          <DetailRow label="البند" value={typeof reinvoice.item === 'string' ? reinvoice.item : reinvoice.item?.name ?? '-'} />
          <DetailRow label="الخصم" value={`${Number(reinvoice.discount || 0).toLocaleString()} ${currencyLabel}`} />
          <DetailRow label="الإجمالي النهائي" value={`${Number(reinvoice.final_total || 0).toLocaleString()} ${currencyLabel}`} />
          <DetailRow label="تاريخ الفاتورة" value={reinvoice.date ? formatArabicDate(reinvoice.date) : '-'} />
        </DetailSection>

        <DetailSection title="المزوّد" icon={UserRound}>
          <DetailRow label="الاسم" value={getUserName(reinvoice.supplier)} />
          <DetailRow label="البريد" value={supplier?.email ?? '-'} />
          <DetailRow label="الهاتف" value={supplier?.phone_number ?? '-'} />
        </DetailSection>
      </div>

      {source.key === 'company_fund' ? (
        <DetailSection title="تفاصيل صندوق الشركة" icon={Building2}>
          <div className="grid gap-3 py-2 sm:grid-cols-3">
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">الصندوق</p>
              <p className="text-sm font-medium text-foreground">
                {companyDetails?.company_fund?.name ?? '-'}
              </p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">العملة</p>
              <p className="text-sm font-medium text-foreground">
                {companyDetails?.currency
                  ? `${companyDetails.currency.currency}${companyDetails.currency.symbol ? ` (${companyDetails.currency.symbol})` : ''}`
                  : '-'}
              </p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">الرصيد</p>
              <p className="finance-num text-sm font-medium text-foreground">
                {companyDetails?.balance ?? '-'}
              </p>
            </div>
          </div>
        </DetailSection>
      ) : null}

      {source.key === 'project_fund' ? (
        <div className="grid gap-2.5 md:grid-cols-2">
          <DetailSection title="تفاصيل المشروع" icon={FolderKanban}>
            <DetailRow label="المشروع" value={reinvoice.reinvoiceable_info?.project_info?.name ?? '-'} />
            <DetailRow label="صندوق المشروع" value={projectDetails?.project_fund?.name ?? '-'} />
          </DetailSection>
          <DetailSection title="عملة صندوق المشروع" icon={Banknote}>
            <DetailRow
              label="العملة"
              value={
                projectDetails?.currency
                  ? `${projectDetails.currency.currency}${projectDetails.currency.symbol ? ` (${projectDetails.currency.symbol})` : ''}`
                  : '-'
              }
            />
            <DetailRow
              label="الرصيد"
              value={
                projectDetails?.balance ? (
                  <span className="finance-num">{projectDetails.balance}</span>
                ) : (
                  '-'
                )
              }
            />
          </DetailSection>
        </div>
      ) : null}

      {source.key === 'user_fund' ? (
        <div className="grid gap-2.5 md:grid-cols-2">
          <DetailSection title="مالك صندوق المستخدم" icon={Wallet}>
            <DetailRow
              label="الاسم"
              value={fundUserInfo?.user?.name ?? userFundDetails?.fund?.user?.name ?? '-'}
            />
            <DetailRow
              label="نوع المستخدم"
              value={
                fundUserInfo?.role_type
                  ? roleLabels[fundUserInfo.role_type] ?? fundUserInfo.role_type
                  : '-'
              }
            />
            <DetailRow label="البريد" value={fundUserInfo?.user?.email ?? '-'} />
            <DetailRow label="الهاتف" value={fundUserInfo?.user?.phone_number ?? '-'} />
          </DetailSection>
          <DetailSection title="تفاصيل الصندوق والعملة" icon={Banknote}>
            <DetailRow label="اسم الصندوق" value={userFundDetails?.fund?.name ?? '-'} />
            <DetailRow
              label="العملة"
              value={
                userFundDetails?.currency
                  ? `${userFundDetails.currency.currency}${userFundDetails.currency.symbol ? ` (${userFundDetails.currency.symbol})` : ''}`
                  : '-'
              }
            />
            <DetailRow
              label="الرصيد"
              value={
                userFundDetails?.balance ? (
                  <span className="finance-num">{userFundDetails.balance}</span>
                ) : (
                  '-'
                )
              }
            />
          </DetailSection>
        </div>
      ) : null}
    </div>
  );
}

export function ReInvoiceDetailsPage() {
  const { reinvoiceId } = useParams<{ reinvoiceId: string }>();
  const navigate = useNavigate();
  const id = Number(reinvoiceId);

  const reinvoiceQuery = useQuery<ReInvoice>({
    queryKey: ['re-invoices', 'details', id] as const,
    queryFn: () => reInvoicesApi.getOne(id),
    enabled: Boolean(id),
  });

  const itemsQuery = useQuery<ReInvoiceItem[]>({
    queryKey: ['re-invoice-items', id],
    queryFn: () => reInvoicesApi.getItems(id),
    enabled: Boolean(id),
  });

  const reinvoice = reinvoiceQuery.data;
  const items = itemsQuery.data ?? [];
  const details = reinvoice?.reinvoiceable_info?.details;
  const currencyLabel = details?.currency?.symbol ?? details?.currency?.currency ?? '';

  return (
    <div className="flex flex-col flex-1 space-y-4 font-sans" dir="rtl">
      <PageHeader
        badge="المرتجعات"
        title={reinvoiceQuery.isLoading ? 'تفاصيل المرتجع' : `تفاصيل المرتجع - ${reinvoice?.reinvoice_number || `#${reinvoice?.id}`}`}
        icon={TrendingDown}
        action={
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            <ArrowRight className="ml-2 size-4" />
            رجوع
          </Button>
        }
      />

      <div className="min-h-0 flex-1 overflow-y-auto space-y-4">
        {reinvoiceQuery.isLoading ? (
          <div className="space-y-2.5">
            <Skeleton className="h-20 w-full rounded-lg" />
            <div className="grid gap-2.5 md:grid-cols-2">
              <Skeleton className="h-36 w-full rounded-lg" />
              <Skeleton className="h-36 w-full rounded-lg" />
            </div>
          </div>
        ) : reinvoiceQuery.isError ? (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-8 text-center text-sm text-destructive font-semibold">
            تعذر تحميل تفاصيل المرتجع
          </div>
        ) : reinvoice ? (
          <>
            <ReInvoiceDetailsContent reinvoice={reinvoice} />

            <div className="rounded-lg border border-border bg-card shadow-finance p-4">
              <section className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                  <div>
                    <h3 className="font-semibold text-slate-900">أصناف المرتجع</h3>
                    <p className="text-xs text-slate-500">المواد والكميات والأسعار المرتبطة بهذا المرتجع</p>
                  </div>
                </div>

                {itemsQuery.isLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <Skeleton key={index} className="h-11 w-full" />
                    ))}
                  </div>
                ) : items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8 text-center">
                    <PackageOpen className="mb-2 size-7 text-slate-400" />
                    <p className="text-sm font-medium text-slate-600">لا توجد أصناف مرتبطة بهذا المرتجع</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="grid gap-2 sm:grid-cols-1">
                      {items.map((item) => {
                        const total = Number(item.total_price ?? Number(item.quantity) * Number(item.unit_price));
                        return (
                          <details key={item.id} className="group rounded-lg bg-muted/40 px-3">
                            <summary className="flex cursor-pointer list-none flex-col items-start gap-2 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3 [&::-webkit-details-marker]:hidden">
                              <div className="min-w-0">
                                <p className="truncate font-medium">{item.material?.name ?? `مادة #${item.material_id}`}</p>
                                <p className="text-xs text-muted-foreground">{item.quantity} {item.unit} × {Number(item.unit_price).toLocaleString()} {currencyLabel}</p>
                              </div>
                              <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-start">
                                <span className="finance-num font-semibold">{total.toLocaleString()} {currencyLabel}</span>
                                <ChevronLeft className="size-4 transition-transform group-open:-rotate-90" />
                              </div>
                            </summary>
                            <p className="pb-3 text-sm text-muted-foreground">{item.item_description || 'بدون وصف'}</p>
                          </details>
                        );
                      })}
                    </div>
                  </div>
                )}
              </section>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
