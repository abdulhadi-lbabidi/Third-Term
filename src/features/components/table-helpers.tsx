import { Link } from 'react-router-dom';
import { Building2, FolderKanban, User } from 'lucide-react';

export function getBooleanLabel(value?: boolean) {
  return value ? 'نعم' : 'لا';
}

export function getTextLabel(value: unknown) {
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

export function getFundTypeLabel(type?: string) {
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

export function getCurrencyStringFromInfo(info: any) {
  if (!info) return '';
  if (typeof info.currency === 'string') return info.currency;
  if (typeof info.symbol === 'string') return info.symbol;
  if (info.details && typeof info.details.currency === 'string') return info.details.currency;
  if (info.details?.currency?.name) return info.details.currency.name;
  if (info.details?.currency?.currency) return info.details.currency.currency;
  return '';
}

export type TableUser = {
  id?: number;
  name?: string;
  role_type?: string;
  role_details?: any;
} | string | number | undefined;

const roleMapping: Record<string, string> = {
  admin: 'admin',
  admins: 'admin',
  client: 'client',
  clients: 'client',
  investor: 'investor',
  investors: 'investor',
  craftsman: 'craftsman',
  craftsmen: 'craftsman',
  employee: 'employee',
  employees: 'employee',
  engineer: 'engineer',
  engineers: 'engineer',
  supplier: 'supplier',
  suppliers: 'supplier',
  trustee: 'trustee',
  trustees: 'trustee',
};

export function UserLink({ user }: { user?: TableUser }) {
  if (user && typeof user === 'object' && user.id && user.name) {
    const rawRole = user.role_type || 'user';
    const role = roleMapping[rawRole] || rawRole;
    const roleId = user.role_details?.id || user.id;
    const url = role !== 'user'
      ? `/users/view/${role}/${roleId}?tab=${role}`
      : `/users/view/${role}/${roleId}`;

    return (
      <Link
        to={url}
        className="inline-flex items-center text-sm font-medium text-primary hover:text-primary/80 hover:underline"
      >
        {user.name}
      </Link>
    );
  }
  return <span>{getTextLabel(user)}</span>;
}

export function FundLink({ type, info, fundTab, fallbackUser }: { type?: string; info?: any; fundTab?: string; fallbackUser?: any }) {
  let label = getFundTypeLabel(type);
  let Icon = null;

  const isCompanyFund = info?.type === 'company_fund' || type === 'App\\Models\\CompanyFundCurrency';
  const isProjectFund = info?.type === 'project_fund' || type === 'App\\Models\\ProjectFundCurrency';
  const isUserFund = info?.type === 'currency_fund' || type === 'App\\Models\\CurrencyFund';

  if (isCompanyFund) Icon = Building2;
  else if (isProjectFund) Icon = FolderKanban;
  else if (isUserFund) Icon = User;

  if (!info && !fallbackUser) return (
    <span className="inline-flex items-center gap-1.5">
      {Icon && <Icon className="size-4 shrink-0 text-muted-foreground" />}
      <span>{label}</span>
    </span>
  );

  let to = '';

  const fundId = info?.details?.company_fund_id || info?.details?.project_fund_id || info?.details?.id;
  const params = new URLSearchParams();
  if (fundId) params.append('fundId', String(fundId));
  if (fundTab) params.append('fundTab', fundTab);
  const qs = params.toString();
  const qString = qs ? `?${qs}` : '';

  if (isCompanyFund) {
    const companyParams = new URLSearchParams(qs);
    companyParams.set('tab', 'company');
    to = `/funds?${companyParams.toString()}`;
    label = 'الشركة';
  } else if (isProjectFund) {
    const pId = info?.project_info?.project_id || info?.details?.project_fund?.project_id || info?.project?.id || info?.project_id;
    if (pId) {
      const pName = info?.project_info?.project?.name || info?.details?.project_fund?.project?.name || info?.project_info?.name || info?.details?.project_fund?.name || info?.project?.name || 'مشروع';
      label = pName;
      // Add tab=funds for projects
      const projectParams = new URLSearchParams(qs);
      projectParams.set('tab', 'funds');
      const projectQs = projectParams.toString();
      to = `/projects/${pId}?${projectQs}`;
    } else {
      to = `/projects${qString}`;
      label = 'مشروع';
    }
  } else if (isUserFund) {
    const uId = info?.user_info?.user_id || info?.user?.id || info?.user_id || fallbackUser?.id;
    if (uId) {
      const uName = info?.user_info?.user?.name || info?.user_info?.name || info?.user?.name || fallbackUser?.name || 'مستخدم';
      label = uName;
      to = `/users/${uId}/${encodeURIComponent(uName)}/funds${qString}`;
    } else {
      to = `/users${qString}`;
      label = 'مستخدم';
    }
  }

  if (!to) return (
    <span className="inline-flex items-center gap-1.5">
      {Icon && <Icon className="size-4 shrink-0 text-muted-foreground" />}
      <span>{label}</span>
    </span>
  );

  return (
    <Link
      to={to}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 hover:underline"
    >
      {Icon && <Icon className="size-4 shrink-0" />}
      <span>{label}</span>
    </Link>
  );
}
