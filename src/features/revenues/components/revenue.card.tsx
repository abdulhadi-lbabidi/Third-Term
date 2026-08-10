import { Edit2, Trash2, Banknote, Calendar, User, ShieldCheck } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/components/ui/alert-dialog';
import type { Revenue } from '../types';

type RevenueRow = Revenue & {
  user?: string | { name?: string } | number;
  received_by?: string | { name?: string } | number;
};

type RevenueCardProps = {
  revenue: Revenue;
  onEdit?: (revenue: Revenue) => void;
  onDelete?: (revenue: Revenue) => void;
};

function getTextLabel(value: unknown) {
  if (typeof value === 'string' && value.trim().length) {
    return value;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  if (value && typeof value === 'object' && 'name' in value) {
    const name = (value as { name?: unknown }).name;
    if (typeof name === 'string' && name.trim().length) {
      return name;
    }
  }

  return '-';
}

function getRevenueableTypeLabel(type?: Revenue['revenueable_type']) {
  switch (type) {
    case 'App\\Models\\CompanyFundCurrency':
      return 'صندوق الشركة';
    case 'App\\Models\\ProjectFundCurrency':
      return 'صندوق المشروع';
    case 'App\\Models\\CurrencyFund':
      return 'صندوق مستخدم';
    default:
      return '-';
  }
}

export function RevenueCard({ revenue, onEdit, onDelete }: RevenueCardProps) {
  const isPosted = revenue.is_posted;
  const receiverLabel = getTextLabel((revenue as RevenueRow).received_by);

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:shadow-md">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
              <Banknote className="size-4" />
            </span>
            <div>
              <h3 className="font-semibold text-foreground">{revenue.amount}</h3>
              <p className="text-xs text-muted-foreground">{getRevenueableTypeLabel(revenue.revenueable_type)}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {onEdit && (
            <Button variant="ghost" size="icon" className="size-8" onClick={() => onEdit(revenue)} title="تعديل">
              <Edit2 className="size-4 text-muted-foreground" />
            </Button>
          )}
          {onDelete && (
            <AlertDialog>
              <AlertDialogTrigger render={<Button variant="ghost" size="icon" className="size-8" title="حذف" />}>
                <Trash2 className="size-4 text-destructive" />
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                  <AlertDialogDescription>
                    هل أنت متأكد من حذف هذا الإيراد؟ لا يمكن التراجع عن هذا الإجراء.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogAction
                    onClick={() => onDelete(revenue)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    حذف
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      <div className="mb-4 space-y-1">
        <p className="text-sm font-medium text-foreground">{revenue.statement || 'بدون بيان'}</p>
      </div>

      <div className="mt-auto grid grid-cols-2 gap-2 text-xs text-muted-foreground">

        {receiverLabel !== '-' && (
          <div className="flex items-center gap-1.5">
            <User className="size-3.5" />
            <span className="truncate" title={receiverLabel}>
              المستلم: {receiverLabel}
            </span>
          </div>
        )}
        {revenue.created_at && (
          <div className="flex items-center gap-1.5">
            <Calendar className="size-3.5" />
            <span>{revenue.created_at}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="size-3.5" />
          <span
            className={
              isPosted
                ? 'font-medium text-emerald-600'
                : 'font-medium text-rose-600'
            }
          >
            {isPosted ? 'تم الترحيل' : 'غير مرحل'}
          </span>
        </div>
      </div>
    </div>
  );
}
