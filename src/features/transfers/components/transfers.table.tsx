import { useNavigate } from 'react-router-dom';
import { DataTable, type DataTableColumn } from '@/features/components/data-table';
import type { Transfer } from '../types';
import { Link } from 'react-router-dom';

type CurrentFundInfo = {
  id: number;
  name: string;
  type: string;
  currencies: { id: number; currency: string }[];
};

function getFundDetailsLabel(info?: Transfer['morph_from_info'], currentFund?: CurrentFundInfo) {
  if (!info) return '-';

  let typeLabel = '-';
  if (info.type === 'company_fund') {
    typeLabel = 'صندوق الشركة';
  } else if (info.type === 'project_fund') {
    typeLabel = 'صندوق المشروع';
  } else if (info.type === 'user_fund' || info.type === 'currency_fund') {
    typeLabel = 'صندوق مستخدم';
  }

  let name = '-';
  let currencyStr = '';
  const details = info.details;

  if (currentFund && info.type === currentFund.type && details) {
    name = currentFund.name;
    const matchedCur = currentFund.currencies.find(c => c.id === details.id);
    if (matchedCur) {
      currencyStr = ` (${matchedCur.currency})`;
    }
  }

  if (name === '-' && details) {
    if (info.type === 'company_fund' && details.company_fund) {
      name = details.company_fund.name ?? '-';
    } else if (info.type === 'project_fund' && details.project_fund) {
      name = details.project_fund.name ?? '-';
    } else if (details.fund) {
      name = details.fund.name ?? details.fund.user?.name ?? '-';
    }

    if (details.currency?.currency) {
      currencyStr = ` (${details.currency.currency})`;
    }
  }

  if (name === '-') {
    name = `صندوق #${details?.company_fund_id ?? details?.project_fund_id ?? details?.fund_id ?? '-'}`;
  }

  return `${typeLabel}: ${name}${currencyStr}`;
}

function renderFundLink(info?: Transfer['morph_from_info'], currentFund?: CurrentFundInfo) {
  if (!info) return '-';
  const label = getFundDetailsLabel(info, currentFund);

  const details = info.details;
  if (!details) return <span>{label}</span>;

  const fundId = details.company_fund_id ?? details.project_fund_id ?? details.fund_id;
  if (!fundId) return <span>{label}</span>;

  let tab = '';
  if (info.type === 'project_fund') {
    tab = 'project';
  } else if (info.type === 'user_fund' || info.type === 'currency_fund') {
    tab = 'users';
  }

  const url = `/funds?${tab ? `tab=${tab}&` : ''}fundId=${fundId}&fundTab=revenues`;

  return (
    <Link to={url} className="text-primary hover:underline font-medium">
      {label}
    </Link>
  );
}

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

type TransfersTableProps = {
  data: Transfer[];
  loading?: boolean;
  onEdit?: (transfer: Transfer) => void;
  onDelete?: (transfer: Transfer) => void;
  currentFund?: CurrentFundInfo;
  sort?: string;
  onSortChange?: (sort: string | undefined) => void;
};

export function TransfersTable({
  data,
  loading,
  onEdit,
  onDelete,
  currentFund,
  sort,
  onSortChange,
}: TransfersTableProps) {
  const navigate = useNavigate();

  const handleRowClick = (row: Transfer) => {
    navigate(`/transfers/${row.id}`);
  };

  const isSent = (row: Transfer) => {
    if (!currentFund) return false;
    const details = row.morph_from_info?.details;
    if (!details) return false;
    if (currentFund.type === 'company_fund') {
      return details.company_fund_id === currentFund.id;
    }
    if (currentFund.type === 'project_fund') {
      return details.project_fund_id === currentFund.id;
    }
    return details.fund_id === currentFund.id;
  };

  const columns: DataTableColumn<Transfer>[] = [
    { header: 'البيان', sortable: true, sortKey: 'name', cell: (row) => row.name },
    ...(currentFund ? [{
      header: 'نوع التحويل',
      cell: (row: Transfer) => {
        const sent = isSent(row);
        return (
          <span className={sent
            ? 'inline-flex text-nowrap items-center rounded-full px-2 py-0.5 text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/60'
            : 'inline-flex  text-nowrap items-center rounded-full px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60'
          }>
            {sent ? 'تحويل مرسل' : 'تحويل وارد'}
          </span>
        );
      }
    }] : []),
    {
      header: 'المبلغ',
      sortable: true,
      sortKey: 'amount',
      cell: (row) => (
        <span className="finance-num font-medium text-[#c9a84c]">
          {Number(row.amount || 0).toLocaleString()}
        </span>
      ),
    },
    { header: 'من صندوق', cell: (row: Transfer) => renderFundLink(row.morph_from_info, currentFund) },
    { header: 'إلى صندوق', cell: (row) => renderFundLink(row.morph_to_info, currentFund) },
    { header: 'أنشئ بواسطة', sortable: true, sortKey: 'creator_name', cell: (row) => getTextLabel(row.created_by) },
    { header: 'تاريخ التحويل', sortable: true, sortKey: 'created_at', cell: (row) => row.created_at ?? '-' },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      loading={loading}
      emptyLabel="لا توجد تحويلات مالية"
      loadingLabel="جاري التحميل..."
      confirmTitle="تأكيد الحذف"
      confirmDescription="هل أنت متأكد من حذف هذا التحويل؟ لا يمكن التراجع عن هذا الإجراء."
      cancelLabel="إلغاء"
      deleteLabel="حذف"
      sort={sort}
      onSortChange={onSortChange}
      onRowClick={handleRowClick}
      actions={{
        onEdit,
        onDelete,
        onView: (row) => navigate(`/transfers/${row.id}`),
        hideEdit: (row) => !isSent(row),
      }}
    />
  );
}
