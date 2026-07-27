import React, { useState, type ReactNode } from 'react';
import { MoreVertical, Pencil, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';

export type DataTableColumn<T> = {
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T) => ReactNode;
  className?: string;
};

type ExtraAction<T> = {
  label: string;
  icon: ReactNode;
  onClick: (row: T) => void;
};

type DataTableActions<T> = {
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  extraActions?: ExtraAction<T>[];
};

type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  data: T[];
  loading?: boolean;
  emptyLabel: ReactNode;
  loadingLabel: ReactNode;
  confirmTitle: string;
  confirmDescription: string;
  cancelLabel: string;
  deleteLabel: string;
  actions?: DataTableActions<T>;
  renderExpandedRow?: (row: T) => ReactNode;
};

export function DataTable<T>({
  columns,
  data,
  loading,
  emptyLabel,
  loadingLabel,
  confirmTitle,
  confirmDescription,
  cancelLabel,
  deleteLabel,
  actions,
  renderExpandedRow,
}: DataTableProps<T>) {
  const [pendingDelete, setPendingDelete] = useState<T | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const actionCount = (actions?.extraActions?.length ?? 0) + Number(Boolean(actions?.onEdit)) + Number(Boolean(actions?.onDelete));

  const toggleRow = (index: number) => {
    const next = new Set(expandedRows);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    setExpandedRows(next);
  };

  return (
    <div className="flex min-h-0 max-h-[calc(100dvh-13rem)] flex-1 flex-col overflow-hidden rounded-lg border bg-card text-center shadow-sm">
      <div className="min-h-0 flex-1 overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-card">
            <TableRow>
              {renderExpandedRow ? <TableHead className="w-[40px]" /> : null}
              {actionCount > 0 ? <TableHead className="w-[84px]" /> : null}
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
                <TableCell colSpan={columns.length + (actionCount > 0 ? 1 : 0) + (renderExpandedRow ? 1 : 0)} className="h-24 text-center text-muted-foreground">
                  {loadingLabel}
                </TableCell>
              </TableRow>
            ) : data.length ? (
              data.map((row, rowIndex) => (
                <React.Fragment key={rowIndex}>
                  <TableRow className="group">
                    {renderExpandedRow ? (
                      <TableCell className="w-[40px] px-2">
                        <button
                          type="button"
                          onClick={() => toggleRow(rowIndex)}
                          className="inline-flex size-7 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                        >
                          {expandedRows.has(rowIndex) ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                        </button>
                      </TableCell>
                    ) : null}
                    {actionCount > 0 ? (
                      <TableCell className="w-[84px]">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="inline-flex size-9 items-center justify-center rounded-full border border-slate-200 text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-950"
                              aria-label="الخيارات"
                            >
                              <MoreVertical className="size-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-52">
                            {actions?.onEdit ? (
                              <DropdownMenuItem
                                onSelect={() => {
                                  setTimeout(() => {
                                    actions.onEdit?.(row);
                                  }, 0);
                                }}
                              >
                                <Pencil className="size-4" />
                                <span>تعديل</span>
                              </DropdownMenuItem>
                            ) : null}

                            {actions?.extraActions?.length
                              ? actions.extraActions.map((action) => (
                                <DropdownMenuItem
                                  key={action.label}
                                  onSelect={() => {
                                    setTimeout(() => {
                                      action.onClick(row);
                                    }, 0);
                                  }}
                                >
                                  {action.icon}
                                  <span>{action.label}</span>
                                </DropdownMenuItem>
                              ))
                              : null}

                            {actions?.onDelete ? (
                              <>
                                {(actions?.onEdit || actions?.extraActions?.length) ? <DropdownMenuSeparator /> : null}
                                <DropdownMenuItem
                                  onSelect={() => {
                                    setTimeout(() => {
                                      setPendingDelete(row);
                                    }, 0);
                                  }}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="size-4" />
                                  <span>حذف</span>
                                </DropdownMenuItem>
                              </>
                            ) : null}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    ) : null}
                    {columns.map((column) => (
                      <TableCell key={column.header} className={column.className}>
                        {column.cell ? column.cell(row) : column.accessorKey ? String(row[column.accessorKey] ?? '') : null}
                      </TableCell>
                    ))}
                  </TableRow>
                  {renderExpandedRow && expandedRows.has(rowIndex) ? (
                    <TableRow className="bg-slate-50/50">
                      <TableCell colSpan={columns.length + (actionCount > 0 ? 1 : 0) + 1} className="p-0">
                        <div className="overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200">
                          {renderExpandedRow(row)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : null}
                </React.Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length + (actionCount > 0 ? 1 : 0) + (renderExpandedRow ? 1 : 0)} className="h-24 text-center text-muted-foreground">
                  {emptyLabel}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {actions?.onDelete ? (
        <Dialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader className="text-center sm:text-center">
              <DialogTitle className="text-2xl">{confirmTitle}</DialogTitle>
              <DialogDescription className="text-base text-muted-foreground">{confirmDescription}</DialogDescription>
            </DialogHeader>

            <DialogFooter className="gap-3 sm:justify-center">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="h-11 rounded-xl border border-slate-200 bg-white px-6 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (pendingDelete) actions.onDelete?.(pendingDelete);
                  setPendingDelete(null);
                }}
                className="h-11 rounded-xl bg-rose-600 px-6 text-sm font-medium text-white transition-colors hover:bg-rose-700"
              >
                {deleteLabel}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
}
