import React, { useState, type ReactNode } from 'react';
import { MoreVertical, Pencil, Trash2, ChevronDown, ChevronRight, Eye } from 'lucide-react';
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
import { Button } from '@/shared/components/ui/button';
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
  onView?: (row: T) => void;
  viewLabel?: string;
  onEdit?: (row: T) => void;
  editLabel?: string;
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
  const actionCount =
    (actions?.onView ? 1 : 0) +
    (actions?.onEdit ? 1 : 0) +
    (actions?.onDelete ? 1 : 0) +
    (actions?.extraActions?.length || 0);

  const toggleRow = (index: number) => {
    const next = new Set(expandedRows);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    setExpandedRows(next);
  };

  return (
    <div className="flex min-h-0 max-h-[calc(100dvh-13rem)] flex-1 flex-col overflow-hidden rounded-lg border border-border bg-card shadow-[var(--shadow-finance)]">
      <div className="min-h-0 flex-1 overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 z-10">
            <TableRow className="hover:bg-transparent">
              {renderExpandedRow ? <TableHead className="w-10" /> : null}
              {actionCount > 0 ? <TableHead className="w-14" /> : null}
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
                  colSpan={columns.length + (actionCount > 0 ? 1 : 0) + (renderExpandedRow ? 1 : 0)}
                  className="h-28 text-center text-muted-foreground"
                >
                  {loadingLabel}
                </TableCell>
              </TableRow>
            ) : data.length ? (
              data.map((row, rowIndex) => (
                <React.Fragment key={rowIndex}>
                  <TableRow className="group">
                    {renderExpandedRow ? (
                      <TableCell className="w-10 px-2">
                        <button
                          type="button"
                          onClick={() => toggleRow(rowIndex)}
                          className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          aria-label={expandedRows.has(rowIndex) ? 'طي الصف' : 'توسيع الصف'}
                        >
                          {expandedRows.has(rowIndex) ? (
                            <ChevronDown className="size-4" />
                          ) : (
                            <ChevronRight className="size-4" />
                          )}
                        </button>
                      </TableCell>
                    ) : null}
                    {actionCount > 0 ? (
                      <TableCell className="w-14">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="inline-flex size-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                              aria-label="الخيارات"
                            >
                              <MoreVertical className="size-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-48">
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

                            {actions?.onView ? (
                              <DropdownMenuItem
                                onSelect={() => {
                                  setTimeout(() => {
                                    actions.onView?.(row);
                                  }, 0);
                                }}
                              >
                                <Eye className="size-4" />
                                <span>{actions.viewLabel || 'عرض'}</span>
                              </DropdownMenuItem>
                            ) : null}

                            {actions?.onEdit ? (
                              <DropdownMenuItem
                                onSelect={() => {
                                  setTimeout(() => {
                                    actions.onEdit?.(row);
                                  }, 0);
                                }}
                              >
                                <Pencil className="size-4" />
                                <span>{actions.editLabel || 'تعديل'}</span>
                              </DropdownMenuItem>
                            ) : null}

                            {actions?.onDelete ? (
                              <>
                                {actions?.onView || actions?.onEdit || actions?.extraActions?.length ? (
                                  <DropdownMenuSeparator />
                                ) : null}
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
                        {column.cell
                          ? column.cell(row)
                          : column.accessorKey
                            ? String(row[column.accessorKey] ?? '')
                            : null}
                      </TableCell>
                    ))}
                  </TableRow>
                  {renderExpandedRow && expandedRows.has(rowIndex) ? (
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableCell
                        colSpan={columns.length + (actionCount > 0 ? 1 : 0) + 1}
                        className="p-0"
                      >
                        <div className="overflow-hidden border-t border-border/70">
                          {renderExpandedRow(row)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : null}
                </React.Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (actionCount > 0 ? 1 : 0) + (renderExpandedRow ? 1 : 0)}
                  className="h-28 text-center text-muted-foreground"
                >
                  {emptyLabel}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {actions?.onDelete ? (
        <Dialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{confirmTitle}</DialogTitle>
              <DialogDescription>{confirmDescription}</DialogDescription>
            </DialogHeader>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPendingDelete(null)}>
                {cancelLabel}
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  if (pendingDelete) actions.onDelete?.(pendingDelete);
                  setPendingDelete(null);
                }}
              >
                {deleteLabel}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
}
