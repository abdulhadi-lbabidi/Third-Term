import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  FolderKanban,
  UserRound,
  Wallet,
  Banknote,
  FileText,
  Calendar,
  TrendingUp,
} from 'lucide-react';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { PageHeader } from '../components/page-header';
import { revenuesApi } from './revenues.api';
import { formatArabicDate } from '@/shared/lib/utils';
import type { Revenue } from './types';

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

function getSourceMeta(revenue?: Revenue | null) {
  const type = revenue?.revenueable_info?.type ?? revenue?.revenueable_type;

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

function RevenueDetailsContent({ revenue }: { revenue: Revenue }) {
  const source = getSourceMeta(revenue);
  const SourceIcon = source.icon;
  const details = revenue.revenueable_info?.details;
  const receiver = typeof revenue.received_by === 'object' ? (revenue.received_by as any) : null;

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

  const fundUserInfo = (revenue.revenueable_info as any)?.user_info;

  return (
    <div className="space-y-2.5">
      <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="space-y-1">
            <div className="status-badge-primary inline-flex items-center gap-1.5">
              <SourceIcon className="size-3.5" />
              {source.label}
            </div>
            <p className="max-w-xl text-sm font-semibold text-foreground">{revenue.statement || '-'}</p>
          </div>
          <div className="text-end">
            <p className="text-xs text-muted-foreground">المبلغ</p>
            <p className="finance-num text-xl font-semibold text-primary">{Number(revenue.amount || 0).toLocaleString()}</p>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className="status-badge-neutral">
            <Calendar className="size-3.5" />
            {revenue.created_at ? formatArabicDate(revenue.created_at) : '-'}
          </span>
        
        </div>
      </div>

      <div className="grid gap-2.5 md:grid-cols-2">
        <DetailSection title="معلومات عامة" icon={FileText}>
          <DetailRow label="البيان" value={revenue.statement || '-'} />
          <DetailRow label="المبلغ" value={<span className="finance-num">{Number(revenue.amount || 0).toLocaleString()}</span>} />
          <DetailRow label="نوع الصندوق" value={source.label} />
          <DetailRow label="تاريخ الإنشاء" value={revenue.created_at ? formatArabicDate(revenue.created_at) : '-'} />
        </DetailSection>

        <DetailSection title="المستلم بيد" icon={UserRound}>
          <DetailRow label="الاسم" value={getUserName(revenue.received_by)} />
          <DetailRow
            label="نوع المستخدم"
            value={receiver?.role_type ? roleLabels[receiver.role_type] ?? receiver.role_type : '-'}
          />
          <DetailRow label="البريد" value={receiver?.email ?? '-'} />
          <DetailRow label="الهاتف" value={receiver?.phone_number ?? '-'} />
          <DetailRow label="العنوان" value={receiver?.address ?? '-'} />
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
            <DetailRow label="المشروع" value={(revenue.revenueable_info as any)?.project_info?.name ?? '-'} />
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

export function RevenueDetailsPage() {
  const { revenueId } = useParams<{ revenueId: string }>();

  const revenueQuery = useQuery<Revenue>({
    queryKey: ['revenues', 'details', Number(revenueId)] as const,
    queryFn: () => revenuesApi.getRevenueById(Number(revenueId)),
    enabled: Boolean(revenueId),
  });

  return (
    <div className="flex flex-col flex-1 space-y-4 font-sans" dir="rtl">
      <PageHeader
        badge="الإيرادات"
        title="تفاصيل الإيراد"
        icon={TrendingUp}
        
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        {revenueQuery.isLoading ? (
          <div className="space-y-2.5">
            <Skeleton className="h-20 w-full rounded-lg" />
            <div className="grid gap-2.5 md:grid-cols-2">
              <Skeleton className="h-36 w-full rounded-lg" />
              <Skeleton className="h-36 w-full rounded-lg" />
            </div>
          </div>
        ) : revenueQuery.isError ? (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-8 text-center text-sm text-destructive font-semibold">
            تعذر تحميل تفاصيل الإيراد
          </div>
        ) : revenueQuery.data ? (
          <RevenueDetailsContent revenue={revenueQuery.data} />
        ) : null}
      </div>
    </div>
  );
}
