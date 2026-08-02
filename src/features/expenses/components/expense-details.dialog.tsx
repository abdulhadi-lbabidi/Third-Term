import type { ComponentType, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  FolderKanban,
  UserRound,
  Wallet,
  Banknote,
  FileText,
  Calendar,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { expensesApi } from '../expenses.api';
import { formatArabicDate } from '@/shared/lib/utils';
import type {
  Expense,
  ExpenseCompanyFundCurrencyDetails,
  ExpenseProjectFundCurrencyDetails,
  ExpenseUser,
  ExpenseUserFundCurrencyDetails,
} from '../types';

type ExpenseDetailsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expenseId: number | null;
};

const roleLabels: Record<string, string> = {
  admin: 'المدير',
  client: 'العميل',
  investor: 'المستثمر',
  craftsman: 'الحرفي',
  employee: 'الموظف',
  engineer: 'المهندس',
  supplier: 'المورد',
  trustee: 'الوصي',
  user: 'مستخدم',
};

function getSourceMeta(expense?: Expense | null) {
  const type = expense?.expenseable_info?.type ?? expense?.expenseable_type;

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

function getUserName(user?: ExpenseUser | string | number | null) {
  if (!user) return '-';
  if (typeof user === 'string') return user || '-';
  if (typeof user === 'number') return String(user);
  return user.name || '-';
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
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
  icon: ComponentType<{ className?: string }>;
  children: ReactNode;
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

function ExpenseDetailsContent({ expense }: { expense: Expense }) {
  const source = getSourceMeta(expense);
  const SourceIcon = source.icon;
  const details = expense.expenseable_info?.details;
  const user = typeof expense.user === 'object' ? expense.user : null;
  const createdBy = typeof expense.created_by === 'object' ? expense.created_by : null;

  const companyDetails =
    source.key === 'company_fund' && details && typeof details === 'object'
      ? (details as ExpenseCompanyFundCurrencyDetails)
      : null;

  const projectDetails =
    source.key === 'project_fund' && details && typeof details === 'object'
      ? (details as ExpenseProjectFundCurrencyDetails)
      : null;

  const userFundDetails =
    source.key === 'user_fund' && details && typeof details === 'object'
      ? (details as ExpenseUserFundCurrencyDetails)
      : null;

  const fundUserInfo = expense.expenseable_info?.user_info;

  return (
    <div className="space-y-2.5">
      <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="space-y-1">
            <div className="status-badge-primary inline-flex items-center gap-1.5">
              <SourceIcon className="size-3.5" />
              {source.label}
            </div>
            <p className="max-w-xl text-sm font-semibold text-foreground">{expense.description || '-'}</p>
          </div>
          <div className="text-end">
            <p className="text-xs text-muted-foreground">المبلغ</p>
            <p className="finance-num text-xl font-semibold text-primary">{expense.amount}</p>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className={expense.is_posted ? 'status-badge-success' : 'status-badge-danger'}>
            {expense.is_posted ? (
              <>
                <CheckCircle2 className="size-3.5" />
                مرحّل
              </>
            ) : (
              <>
                <XCircle className="size-3.5" />
                غير مرحّل
              </>
            )}
          </span>
          <span className="status-badge-neutral">
            <Calendar className="size-3.5" />
            {expense.created_at ? formatArabicDate(expense.created_at) : '-'}
          </span>
          <span className="status-badge-neutral">#{expense.id}</span>
        </div>
      </div>

      <div className="grid gap-2.5 md:grid-cols-2">
        <DetailSection title="معلومات عامة" icon={FileText}>
          <DetailRow label="الوصف" value={expense.description || '-'} />
          <DetailRow label="المبلغ" value={<span className="finance-num">{Number(expense.amount || 0).toLocaleString()}</span>} />
          <DetailRow label="نوع الصندوق" value={source.label} />
          <DetailRow label="تاريخ الإنشاء" value={expense.created_at ? formatArabicDate(expense.created_at) : '-'} />
        </DetailSection>

        <DetailSection title="المستخدم المستفيد" icon={UserRound}>
          <DetailRow label="الاسم" value={getUserName(expense.user)} />
          <DetailRow
            label="نوع المستخدم"
            value={user?.role_type ? roleLabels[user.role_type] ?? user.role_type : '-'}
          />
          <DetailRow label="البريد" value={user?.email ?? '-'} />
          <DetailRow label="الهاتف" value={user?.phone_number ?? '-'} />
          <DetailRow label="العنوان" value={user?.address ?? '-'} />
        </DetailSection>
      </div>

      {source.key === 'company_fund' ? (
        <DetailSection title="تفاصيل صندوق الشركة" icon={Building2}>
          <div className="grid gap-3 py-2 sm:grid-cols-3">
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">الصندوق</p>
              <p className="text-sm font-medium text-foreground">
                {companyDetails?.company_fund?.name ??
                  (expense.expenseable_info?.company_fund_id
                    ? `#${expense.expenseable_info.company_fund_id}`
                    : '-')}
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
            <DetailRow label="المشروع" value={projectDetails?.project_fund?.project?.name ?? '-'} />
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

      <DetailSection title="أنشئ بواسطة" icon={UserRound}>
        <div className="grid gap-3 py-2 sm:grid-cols-3">
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground">الاسم</p>
            <p className="text-sm font-medium text-foreground">{getUserName(expense.created_by)}</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground">البريد</p>
            <p className="break-all text-sm font-medium text-foreground">{createdBy?.email ?? '-'}</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground">الهاتف</p>
            <p className="finance-num text-end text-sm font-medium text-foreground" dir="ltr">
              {createdBy?.phone_number ?? '-'}
            </p>
          </div>
        </div>
      </DetailSection>
    </div>
  );
}

export function ExpenseDetailsDialog({ open, onOpenChange, expenseId }: ExpenseDetailsDialogProps) {
  const expenseQuery = useQuery<Expense>({
    queryKey: ['expenses', 'details', expenseId] as const,
    queryFn: () => expensesApi.getExpenseById(expenseId!),
    enabled: open && Boolean(expenseId),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-3 p-4 !max-w-5xl overflow-x-hidden" dir="rtl">
        <DialogHeader className="pb-2.5">
          <DialogTitle>تفاصيل المصروف</DialogTitle>
        </DialogHeader>

        <div>
          {expenseQuery.isLoading ? (
            <div className="space-y-2.5">
              <Skeleton className="h-20 w-full rounded-lg" />
              <div className="grid gap-2.5 md:grid-cols-2">
                <Skeleton className="h-36 w-full rounded-lg" />
                <Skeleton className="h-36 w-full rounded-lg" />
              </div>
            </div>
          ) : expenseQuery.isError ? (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-8 text-center text-sm text-destructive">
              تعذر تحميل تفاصيل المصروف
            </div>
          ) : expenseQuery.data ? (
            <ExpenseDetailsContent expense={expenseQuery.data} />
          ) : null}
        </div>

        <DialogFooter className="pt-1">
          <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            إغلاق
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
