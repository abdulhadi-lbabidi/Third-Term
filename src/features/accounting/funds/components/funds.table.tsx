import DataTable, { type TableColumn } from 'react-data-table-component';
import type { Fund } from '../fund.types';
import { Button } from '@/shared/components/ui/button';
import { Edit2, Trash2, Eye } from 'lucide-react';
import dayjs from 'dayjs';

interface FundsTableProps {
  data: Fund[];
  isLoading?: boolean;
  onView?: (fund: Fund) => void;
  onEdit?: (fund: Fund) => void;
  onDelete?: (fund: Fund) => void;
}

export function FundsTable({ data, isLoading, onView, onEdit, onDelete }: FundsTableProps) {
  const columns: TableColumn<Fund>[] = [
    {
      name: 'Name',
      selector: row => row.name,
      sortable: true,
      cell: row => <span className="font-medium">{row.name}</span>,
    },
    {
      name: 'Currency',
      selector: row => row.currency?.symbol || '-',
      sortable: true,
    },
    {
      name: 'Balance',
      selector: row => row.balance,
      sortable: true,
      cell: row => <span className="text-primary font-semibold">{row.balance}</span>,
    },
    {
      name: 'Owner',
      selector: row => row.owner?.name || '-',
      sortable: true,
    },
    {
      name: 'Created',
      selector: row => row.created_at,
      sortable: true,
      cell: row => dayjs(row.created_at).format('MMM D, YYYY'),
    },
    {
      name: 'Actions',
      cell: row => (
        <div className="flex items-center gap-2">
          {onView && (
            <Button variant="ghost" size="icon-sm" onClick={() => onView(row)}>
              <Eye className="size-4" />
            </Button>
          )}
          {onEdit && (
            <Button variant="ghost" size="icon-sm" onClick={() => onEdit(row)}>
              <Edit2 className="size-4" />
            </Button>
          )}
          {onDelete && (
            <Button variant="ghost" size="icon-sm" onClick={() => onDelete(row)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
              <Trash2 className="size-4" />
            </Button>
          )}
        </div>
      ),
      button: true,
      width: '140px',
    },
  ];

  return (
    <div className="border rounded-md bg-card overflow-hidden">
      <DataTable
        columns={columns}
        data={data}
        progressPending={isLoading}
        pagination
        responsive
        highlightOnHover
        customStyles={{
          headRow: {
            style: {
              backgroundColor: 'hsl(var(--muted))',
              color: 'hsl(var(--muted-foreground))',
              borderBottom: '1px solid hsl(var(--border))',
            },
          },
          rows: {
            style: {
              backgroundColor: 'hsl(var(--card))',
              color: 'hsl(var(--foreground))',
            },
          },
          pagination: {
            style: {
              backgroundColor: 'hsl(var(--card))',
              color: 'hsl(var(--foreground))',
              borderTopColor: 'hsl(var(--border))',
            },
          },
        }}
      />
    </div>
  );
}
