import { useTranslation } from 'react-i18next';
import DataTable, { type TableColumn } from 'react-data-table-component';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import type { Currency } from '../types';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';

type CurrencyTableProps = {
  data: Currency[];
  loading: boolean;
  onEdit: (currency: Currency) => void;
  onDelete: (currency: Currency) => Promise<void>;
  onView?: (currency: Currency) => void;
};

export function CurrencyTable({ data, loading, onEdit, onDelete, onView }: CurrencyTableProps) {
  const { t } = useTranslation();
  const [pendingDelete, setPendingDelete] = useState<Currency | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteConfirm = async () => {
    if (pendingDelete) {
      setIsDeleting(true);
      try {
        await onDelete(pendingDelete);
      } finally {
        setIsDeleting(false);
        setPendingDelete(null);
      }
    }
  };

  const columns: TableColumn<Currency>[] = [
    {
      name: t('currencies.table.name', 'Name'),
      selector: (row) => row.currency,
      sortable: true,
    },
    {
      name: t('currencies.table.symbol', 'Symbol'),
      selector: (row) => row.symbol,
      sortable: true,
    },
    {
      name: t('currencies.table.actions', 'Actions'),
      cell: (row) => (
        <div className="flex items-center gap-2">
          {onView && (
            <button
              onClick={() => onView(row)}
              className="text-slate-500 hover:text-slate-700 transition-colors"
              title={t('currencies.actions.view', 'View Details')}
            >
              <Eye className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => onEdit(row)}
            className="text-slate-500 hover:text-slate-700 transition-colors"
            title={t('currencies.actions.edit', 'Edit')}
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => setPendingDelete(row)}
            className="text-destructive hover:text-destructive/80 transition-colors"
            title={t('currencies.actions.delete', 'Delete')}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
      button: true,
      width: '120px',
    },
  ];

  const customStyles = {
    headRow: {
      style: {
        backgroundColor: '#f8fafc',
        borderTopWidth: '1px',
        borderTopColor: '#e2e8f0',
      },
    },
    headCells: {
      style: {
        color: '#475569',
        fontWeight: '600' as const,
      },
    },
  };

  return (
    <>
      <div className="rounded-md border border-slate-200">
        <DataTable
          columns={columns}
          data={data}
          progressPending={loading}
          customStyles={customStyles}
          pagination
          responsive
        />
      </div>

      <Dialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('currencies.dialog.deleteTitle', 'Delete Currency')}</DialogTitle>
            <DialogDescription>
              {t('currencies.dialog.deleteConfirm', 'Are you sure you want to delete this currency? This action cannot be undone.')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDelete(null)} disabled={isDeleting}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isDeleting}>
              {isDeleting ? t('common.deleting', 'Deleting...') : t('common.delete', 'Delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
