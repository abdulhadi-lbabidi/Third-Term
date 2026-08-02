import { Link } from 'react-router-dom';

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

export type TableUser = { id?: number; name?: string; role_type?: string } | string | number | undefined;

export function UserLink({ user }: { user?: TableUser }) {
  if (user && typeof user === 'object' && user.id && user.name) {
    const role = user.role_type || 'user';
    return (
      <Link 
        to={`/users/view/${role}/${user.id}`}
        className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
      >
        {user.name}
      </Link>
    );
  }
  return <span>{getTextLabel(user)}</span>;
}

export function FundLink({ type, info }: { type?: string; info?: any }) {
  let label = getFundTypeLabel(type);
  if (!info) return <span>{label}</span>;

  let to = '';
  
  const isCompanyFund = info.type === 'company_fund' || type === 'App\\Models\\CompanyFundCurrency';
  const isProjectFund = info.type === 'project_fund' || type === 'App\\Models\\ProjectFundCurrency';
  const isUserFund = info.type === 'currency_fund' || type === 'App\\Models\\CurrencyFund';

  if (isCompanyFund) {
    to = '/company-funds';
  } else if (isProjectFund) {
    const pId = info.project_info?.project_id || info.project?.id || info.project_id;
    if (pId) {
      const pName = info.project_info?.project?.name || info.project_info?.name || info.project?.name || 'مشروع';
      label = `صندوق المشروع: ${pName}`;
      to = `/projects/${pId}/${encodeURIComponent(pName)}/funds`;
    } else {
      to = '/projects';
    }
  } else if (isUserFund) {
    const uId = info.user_info?.user_id || info.user?.id || info.user_id;
    if (uId) {
      const uName = info.user_info?.user?.name || info.user_info?.name || info.user?.name || 'مستخدم';
      label = `صندوق المستخدم: ${uName}`;
      to = `/users/${uId}/${encodeURIComponent(uName)}/funds`;
    } else {
      to = '/users';
    }
  }

  if (!to) return <span>{label}</span>;

  return (
    <Link 
      to={to}
      className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
    >
      {label}
    </Link>
  );
}
