import DataTable, { type TableColumn } from 'react-data-table-component';
import type { CloudFile } from '../types';
import { Button } from '@/shared/components/ui/button';
import { Edit2, Trash2 } from 'lucide-react';
import dayjs from 'dayjs';

interface FilesTableProps {
  data: CloudFile[];
  isLoading?: boolean;
  onRename?: (file: CloudFile) => void;
  onDelete?: (file: CloudFile) => void;
}

export function FilesTable({ data, isLoading, onRename, onDelete }: FilesTableProps) {
  const columns: TableColumn<CloudFile>[] = [
    {
      name: 'Name',
      selector: row => row.name,
      sortable: true,
      cell: row => <span className="font-medium">{row.name}</span>,
    },
    {
      name: 'Size',
      selector: row => row.size,
      sortable: true,
      cell: row => `${(row.size / 1024).toFixed(2)} KB`,
    },
    {
      name: 'Type',
      selector: row => row.type,
      sortable: true,
    },
    {
      name: 'Uploaded',
      selector: row => row.createdAt,
      sortable: true,
      cell: row => dayjs(row.createdAt).format('MMM D, YYYY h:mm A'),
    },
    {
      name: 'Actions',
      cell: row => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon-sm" onClick={() => onRename?.(row)}>
            <Edit2 className="size-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => onDelete?.(row)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
      button: true,
      width: '120px',
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
