import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';

export type TableColumn<T> = {
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T) => React.ReactNode;
  className?: string;
};

type UsersTableProps<T> = {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  onDelete?: (row: T) => void;
  onEdit?: (row: T) => void;
};

export function UsersTable<T>({ columns, data, loading, onDelete, onEdit }: UsersTableProps<T>) {
  const [pendingDelete, setPendingDelete] = useState<T | null>(null);
  const { t } = useTranslation();

  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            {onDelete || onEdit ? <TableHead className="w-[108px]" /> : null}
            {columns.map((column) => (
              <TableHead key={column.header} className={column.className}>
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell
                colSpan={columns.length + (onDelete || onEdit ? 1 : 0)}
                className="h-24 text-center text-muted-foreground"
              >
                {t('users.table.loading')}
              </TableCell>
            </TableRow>
          ) : data.length ? (
            data.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {onDelete || onEdit ? (
                  <TableCell className="w-[108px]">
                    <div className="flex items-center gap-2">
                      {onEdit ? (
                        <button
                          type="button"
                          onClick={() => onEdit(row)}
                          className="inline-flex size-8 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                          aria-label="Edit row"
                        >
                          <Pencil className="size-4" />
                        </button>
                      ) : null}
                      {onDelete ? (
                        <button
                          type="button"
                          onClick={() => setPendingDelete(row)}
                          className="inline-flex size-8 items-center justify-center rounded-full border border-destructive/20 text-destructive transition-colors hover:bg-destructive/10"
                          aria-label="Delete row"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      ) : null}
                    </div>
                  </TableCell>
                ) : null}
                {columns.map((column) => (
                  <TableCell key={column.header} className={column.className}>
                    {column.cell
                      ? column.cell(row)
                      : column.accessorKey
                        ? String(row[column.accessorKey] ?? '')
                        : null}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length + (onDelete || onEdit ? 1 : 0)}
                className="h-24 text-center text-muted-foreground"
              >
                {t('users.table.empty')}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader className="text-center sm:text-center">
            <DialogTitle className="text-2xl">{t('users.table.deleteTitle', { defaultValue: 'Confirm Delete' })}</DialogTitle>
            <DialogDescription className="text-base text-muted-foreground">
              {t('users.table.deleteConfirm', {
                defaultValue: 'Are you sure you want to delete this item? This action cannot be undone.',
              })}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-3 sm:justify-center">
            <button
              type="button"
              onClick={() => setPendingDelete(null)}
              className="h-11 rounded-xl border border-slate-200 bg-white px-6 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50"
            >
              {t('users.form.cancel')}
            </button>
            <button
              type="button"
              onClick={() => {
                if (pendingDelete) {
                  onDelete?.(pendingDelete);
                }
                setPendingDelete(null);
              }}
              className="h-11 rounded-xl bg-rose-600 px-6 text-sm font-medium text-white transition-colors hover:bg-rose-700"
            >
              {t('users.actions.delete')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
