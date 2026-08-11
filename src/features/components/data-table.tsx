import React, { useState, type ReactNode } from 'react';
import { MoreVertical, Pencil, Trash2, ChevronDown, ChevronRight, Eye, Inbox, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
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
import { Skeleton } from '@/shared/components/ui/skeleton';

const DEFAULT_COLUMN_CLASS_NAME = 'max-w-64';

const getColumnClassName = (className?: string) =>
  `${DEFAULT_COLUMN_CLASS_NAME} ${className ?? ''}`.trim();

export type DataTableColumn<T> = {
  header: ReactNode;
  accessorKey?: keyof T;
  cell?: (row: T) => ReactNode;
  className?: string;
  sortable?: boolean;
  sortKey?: string;
};

type ExtraAction<T> = {
  label: string | ((row: T) => string);
  icon: ReactNode | ((row: T) => ReactNode);
  onClick: (row: T) => void;
  hidden?: (row: T) => boolean;
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
  sort?: string;
  onSortChange?: (sort: string | undefined) => void;
};

export function DataTable<T>({
  columns,
  data,
  loading,
  emptyLabel,
  confirmTitle,
  confirmDescription,
  cancelLabel,
  deleteLabel,
  actions,
  renderExpandedRow,
  sort,
  onSortChange,
}: DataTableProps<T>) {
  const [pendingDelete, setPendingDelete] = useState<T | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [prevData, setPrevData] = useState<T[]>(data);

  React.useEffect(() => {
    if (!loading && data) {
      setPrevData(data);
    }
  }, [data, loading]);

  const displayData = (loading && data.length === 0 && prevData.length > 0) ? prevData : data;

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

  const sortItems = React.useMemo(() => {
    if (!sort) return [];
    return sort.split(',').map(s => s.trim()).filter(Boolean).map(s => {
      if (s.startsWith('-')) {
        return { key: s.slice(1), desc: true };
      }
      return { key: s, desc: false };
    });
  }, [sort]);

  return (
    <div className="flex min-h-0 max-h-[calc(100dvh-13rem)] flex-1 flex-col overflow-hidden rounded-lg border border-border bg-card shadow-[var(--shadow-finance)]">
      <div className="min-h-0 flex-1 overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 z-10">
            <TableRow className="hover:bg-transparent">
              {renderExpandedRow ? <TableHead className="w-10" /> : null}
              {actionCount > 0 ? <TableHead className="w-14" /> : null}
              {columns.map((column, colIndex) => {
                const key = column.sortKey || String(column.accessorKey || '');
                
                const sortedItem = sortItems.find(item => item.key === key);
                const isSortedAsc = sortedItem ? !sortedItem.desc : false;
                const isSortedDesc = sortedItem ? sortedItem.desc : false;

                const handleHeaderClick = () => {
                  if (!column.sortable || !onSortChange) return;
                  
                  const nextItems = [...sortItems];
                  const foundIndex = nextItems.findIndex(item => item.key === key);
                  
                  if (foundIndex === -1) {
                    nextItems.push({ key, desc: false });
                  } else {
                    const item = nextItems[foundIndex];
                    if (!item.desc) {
                      nextItems[foundIndex] = { key, desc: true };
                    } else {
                      nextItems.splice(foundIndex, 1);
                    }
                  }
                  
                  if (nextItems.length === 0) {
                    onSortChange(undefined);
                  } else {
                    onSortChange(nextItems.map(item => `${item.desc ? '-' : ''}${item.key}`).join(','));
                  }
                };

                return (
                  <TableHead key={column.sortKey || String(column.accessorKey || '') || colIndex} className={getColumnClassName(column.className)}>
                    {column.sortable && key ? (
                      <div
                        onClick={handleHeaderClick}
                        className="flex items-center gap-1.5 cursor-pointer select-none group/sort"
                      >
                        <span>{column.header}</span>
                        {isSortedAsc ? (
                          <ArrowUp className="size-3.5 text-foreground shrink-0" />
                        ) : isSortedDesc ? (
                          <ArrowDown className="size-3.5 text-foreground shrink-0" />
                        ) : (
                          <ArrowUpDown className="size-3.5 text-muted-foreground opacity-50 group-hover/sort:opacity-100 transition-opacity shrink-0" />
                        )}
                      </div>
                    ) : (
                      column.header
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && displayData.length === 0 ? (
              Array.from({ length: 5 }).map((_, rowIndex) => (
                <TableRow key={`skeleton-${rowIndex}`}>
                  {renderExpandedRow ? (
                    <TableCell className="w-10 px-2">
                      <Skeleton className="size-7 rounded-md" />
                    </TableCell>
                  ) : null}
                  {actionCount > 0 ? (
                    <TableCell className="w-14">
                      <Skeleton className="size-8 rounded-md" />
                    </TableCell>
                  ) : null}
                  {columns.map((column, colIndex) => (
                    <TableCell key={`skeleton-col-${colIndex}`} className={getColumnClassName(column.className)}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : displayData.length ? (
              displayData.map((row, rowIndex) => (
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
                              ? actions.extraActions.filter((action) => !action.hidden?.(row)).map((action, actionIndex) => (
                                <DropdownMenuItem
                                  key={typeof action.label === 'string' ? action.label : actionIndex}
                                  onSelect={() => {
                                    setTimeout(() => {
                                      action.onClick(row);
                                    }, 0);
                                  }}
                                >
                                  {typeof action.icon === 'function' ? action.icon(row) : action.icon}
                                  <span>{typeof action.label === 'function' ? action.label(row) : action.label}</span>
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
                    {columns.map((column, colIndex) => (
                      <TableCell key={column.sortKey || String(column.accessorKey || '') || colIndex} className={getColumnClassName(column.className)}>
                        <div
                          className="line-clamp-2 min-w-0 max-w-full whitespace-normal break-words leading-5"
                          title={column.accessorKey ? String(row[column.accessorKey] ?? '') : undefined}
                        >
                          {column.cell
                            ? column.cell(row)
                            : column.accessorKey
                              ? String(row[column.accessorKey] ?? '')
                              : null}
                        </div>
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
                  className="h-48 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/50">
                      <Inbox className="size-6 text-muted-foreground/60" />
                    </div>
                    <span className="text-sm font-medium text-slate-500">{emptyLabel}</span>
                  </div>
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
              <DialogDescription className={`text-start`}>{confirmDescription}</DialogDescription>
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
