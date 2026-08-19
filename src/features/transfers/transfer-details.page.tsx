import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  FolderKanban,
  UserRound,
  Wallet,
  FileText,
  Calendar,
  TrendingDown,
} from 'lucide-react';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { PageHeader } from '../components/page-header';
import { transfersApi } from './transfers.api';
import { formatArabicDate } from '@/shared/lib/utils';
import type { Transfer } from './types';

function getSourceMeta(info?: any) {
  if (!info) return { label: 'غير محدد', icon: FileText };
  const type = info.type;

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

function TransferDetailsContent({ transfer }: { transfer: Transfer }) {
  const fromSource = getSourceMeta(transfer.morph_from_info);
  const toSource = getSourceMeta(transfer.morph_to_info);
  const fromDetails = transfer.morph_from_info?.details;
  const toDetails = transfer.morph_to_info?.details;
  const currencyLabel = fromDetails?.currency?.symbol ?? fromDetails?.currency?.currency ?? '';

  return (
    <div className="space-y-2.5">
      <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="space-y-1">
            <div className="status-badge-primary inline-flex items-center gap-1.5">
              <TrendingDown className="size-3.5" />
              حركة تحويل مالي
            </div>
            <p className="max-w-xl text-sm font-semibold text-foreground">{transfer.name || '-'}</p>
          </div>
          <div className="text-end">
            <p className="text-xs text-muted-foreground">المبلغ</p>
            <p className="finance-num text-xl font-semibold text-primary">{Number(transfer.amount || 0).toLocaleString()} {currencyLabel}</p>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className="status-badge-neutral">
            <Calendar className="size-3.5" />
            {transfer.created_at ? formatArabicDate(transfer.created_at) : '-'}
          </span>
        
        </div>
      </div>

      <div className="grid gap-2.5 md:grid-cols-2">
        <DetailSection title="تفاصيل جهة الإرسال (من)" icon={fromSource.icon}>
          <DetailRow label="نوع الصندوق" value={fromSource.label} />
          <DetailRow
            label="اسم الصندوق"
            value={
              fromDetails?.project_fund?.name ??
              fromDetails?.company_fund?.name ??
              fromDetails?.fund?.name ??
              '-'
            }
          />
          <DetailRow
            label="العملة"
            value={
              fromDetails?.currency
                ? `${fromDetails.currency.currency}${fromDetails.currency.symbol ? ` (${fromDetails.currency.symbol})` : ''}`
                : '-'
            }
          />
        </DetailSection>

        <DetailSection title="تفاصيل جهة الاستقبال (إلى)" icon={toSource.icon}>
          <DetailRow label="نوع الصندوق" value={toSource.label} />
          <DetailRow
            label="اسم الصندوق"
            value={
              toDetails?.project_fund?.name ??
              toDetails?.company_fund?.name ??
              toDetails?.fund?.name ??
              '-'
            }
          />
          <DetailRow
            label="العملة"
            value={
              toDetails?.currency
                ? `${toDetails.currency.currency}${toDetails.currency.symbol ? ` (${toDetails.currency.symbol})` : ''}`
                : '-'
            }
          />
        </DetailSection>
      </div>

      <div className="grid gap-2.5 md:grid-cols-2">
        <DetailSection title="معلومات التحويل العامة" icon={FileText}>
          <DetailRow label="البيان" value={transfer.name || '-'} />
          <DetailRow label="المبلغ" value={`${Number(transfer.amount || 0).toLocaleString()} ${currencyLabel}`} />
          <DetailRow label="تاريخ التحويل" value={transfer.created_at ? formatArabicDate(transfer.created_at) : '-'} />
        </DetailSection>

        <DetailSection title="أنشئ بواسطة" icon={UserRound}>
          <DetailRow label="الاسم" value={getUserName(transfer.created_by)} />
          <DetailRow label="البريد" value={typeof transfer.created_by === 'object' && transfer.created_by ? (transfer.created_by as any).email : '-'} />
          <DetailRow label="الهاتف" value={typeof transfer.created_by === 'object' && transfer.created_by ? (transfer.created_by as any).phone_number : '-'} />
        </DetailSection>
      </div>
    </div>
  );
}

export function TransferDetailsPage() {
  const { transferId } = useParams<{ transferId: string }>();
  const id = Number(transferId);

  const transferQuery = useQuery<Transfer>({
    queryKey: ['transfers', 'details', id] as const,
    queryFn: () => transfersApi.getTransfer(id),
    enabled: Boolean(id),
  });

  return (
    <div className="flex flex-col flex-1 space-y-4 font-sans" dir="rtl">
      <PageHeader
        badge="التحويلات"
        title="تفاصيل التحويل المالي"
        icon={TrendingDown}
        
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        {transferQuery.isLoading ? (
          <div className="space-y-2.5">
            <Skeleton className="h-20 w-full rounded-lg" />
            <div className="grid gap-2.5 md:grid-cols-2">
              <Skeleton className="h-36 w-full rounded-lg" />
              <Skeleton className="h-36 w-full rounded-lg" />
            </div>
          </div>
        ) : transferQuery.isError ? (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-8 text-center text-sm text-destructive font-semibold">
            تعذر تحميل تفاصيل التحويل المالي
          </div>
        ) : transferQuery.data ? (
          <TransferDetailsContent transfer={transferQuery.data} />
        ) : null}
      </div>
    </div>
  );
}
