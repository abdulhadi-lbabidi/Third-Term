import { useEffect, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/shared/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Textarea } from '@/shared/components/ui/textarea';
import { SearchableSelect } from '@/shared/components/ui/searchable-select';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { companyFundsApi } from '@/features/company-funds/company-funds.api';
import type { CompanyFund } from '@/features/company-funds/types';
import type { Fund } from '@/features/funds/types';
import { projectsApi } from '@/features/projects/projects.api';
import type { Project, ProjectFund } from '@/features/projects/types';
import { usersApi } from '@/features/users/api/users.api';
import type { UserRole } from '@/features/users/types';
import { expenseFormSchema, expenseSourceLabels, type ExpenseFormValues } from '../schemas/expenses.schema';
import { toExpenseApiPayload } from '../expenses.payload';
import type { CreateExpensePayload, Expense, ExpenseProjectFundCurrencyDetails, ExpenseSource, ExpenseUserFundCurrencyDetails, ExpenseableType } from '../types';

type ExpensesFormProps = {
  defaultValues?: Expense | null;
  fixedValues?: {
    source?: ExpenseSource;
    project_id?: number;
    project_fund_id?: number;
    user_id?: number;
    user_fund_id?: number;
    company_fund_id?: number;
    fund_user_role?: string;
  };
  fixedType?: string;
  fixedFundCurrencies?: {
    id: number;
    currency: string;
    symbol: string;
    balance: string;
  }[];
  onSubmit: (data: CreateExpensePayload) => Promise<void>;
  loading?: boolean;
};

type RoleUser = {
  id: number;
  user: {
    id: number;
    name: string;
  };
};

type FundLabelSource = {
  name: string;
  user?: {
    name?: string;
  } | null;
};

type FundUserRecord = {
  user: {
    id: number;
    name: string;
    funds?: Fund[];
  };
};

const userRoles: UserRole[] = [
  'admin',
  'client',
  'investor',
  'craftsman',
  'employee',
  'engineer',
  'supplier',
  'trustee',
];

const roleLabels: Record<UserRole, string> = {
  admin: 'المدير',
  client: 'العميل',
  investor: 'المستثمر',
  craftsman: 'الحرفي',
  employee: 'الموظف',
  engineer: 'المهندس',
  supplier: 'المورد',
  trustee: 'الوصي',
};

const sourceToExpenseableType: Record<ExpenseSource, ExpenseableType> = {
  company_fund: 'App\\Models\\CompanyFundCurrency',
  user_fund: 'App\\Models\\CurrencyFund',
  project_fund: 'App\\Models\\ProjectFundCurrency',
};

function getSourceFromType(type?: string): ExpenseSource {
  if (type === 'App\\Models\\CompanyFundCurrency') return 'company_fund';
  if (type === 'App\\Models\\ProjectFundCurrency') return 'project_fund';
  if (type === 'App\\Models\\CurrencyFund') return 'user_fund';
  return 'company_fund';
}

function getFundLabel(item: FundLabelSource) {
  return item.user?.name ?? item.name;
}

function getCompanyFundLabel(item: CompanyFund) {
  return item.name;
}

function getCurrencyLabel(currency: { currency: string; balance: string }) {
  return `${currency.currency} - ${currency.balance}`;
}

function renderCurrencyValue(currency: { currency: string; balance: string }) {
  const bal = Number(currency.balance) || 0;
  const isPositive = bal > 0;
  return (
    <span className="flex items-center gap-1.5 font-sans">
      <span>{currency.currency} -</span>
      <span className={isPositive ? 'text-success font-bold font-mono' : 'text-destructive font-bold font-mono'}>
        {currency.balance}
      </span>
    </span>
  );
}

/** القيمة المرسلة في expenseable_id — من حقل expenseable_id وليس id العملة */
function getCurrencyExpenseableId(currency: { id: number; expenseable_id?: number; pivot?: { id: number } }) {
  return currency.expenseable_id ?? currency.pivot?.id ?? currency.id;
}

function currencyMatchesExpenseableId(
  currency: { id: number; expenseable_id?: number; pivot?: { id: number } },
  expenseableId: number,
) {
  return getCurrencyExpenseableId(currency) === expenseableId;
}

function getRoleLabel(role: UserRole | '') {
  return role ? roleLabels[role] : '';
}

function normalizeExpenseSource(type?: string): ExpenseSource | undefined {
  if (type === 'currency_fund' || type === 'user_fund') {
    return 'user_fund';
  }

  if (type === 'company_fund' || type === 'project_fund') {
    return type;
  }

  return undefined;
}

function getInitialSource(expense?: Expense | null): ExpenseSource {
  const fromInfo = normalizeExpenseSource(expense?.expenseable_info?.type);
  if (fromInfo) {
    return fromInfo;
  }

  return getSourceFromType(expense?.expenseable_type);
}

function getExpenseProjectFundDetails(expense?: Expense | null): ExpenseProjectFundCurrencyDetails | null {
  const details = expense?.expenseable_info?.details;
  if (!details || typeof details !== 'object' || !('id' in details)) {
    return null;
  }

  if ('project_fund' in details || 'project_fund_id' in details) {
    return details as ExpenseProjectFundCurrencyDetails;
  }

  return null;
}

function getExpenseUserFundDetails(expense?: Expense | null): ExpenseUserFundCurrencyDetails | null {
  const details = expense?.expenseable_info?.details;
  if (!details || typeof details !== 'object' || !('id' in details)) {
    return null;
  }

  if ('fund' in details || 'fund_id' in details) {
    return details as ExpenseUserFundCurrencyDetails;
  }

  return null;
}

function getExpenseUserFundUserInfo(expense?: Expense | null) {
  const userInfo = expense?.expenseable_info?.user_info;
  if (!userInfo || typeof userInfo !== 'object') {
    return null;
  }

  return userInfo;
}

function getExpenseProjectId(expense?: Expense | null): number | undefined {
  const info = expense?.expenseable_info;
  if (info?.project_id) {
    return info.project_id;
  }

  const details = getExpenseProjectFundDetails(expense);
  return details?.project_fund?.project_id ?? details?.project_fund?.project?.id;
}

function getExpenseProjectFundId(expense?: Expense | null): number | undefined {
  const details = getExpenseProjectFundDetails(expense);
  return details?.project_fund_id ?? details?.project_fund?.id;
}

function getExpenseableCurrencyId(expense?: Expense | null): number | undefined {
  if (expense?.expenseable_id) {
    return expense.expenseable_id;
  }

  const projectDetails = getExpenseProjectFundDetails(expense);
  if (projectDetails?.id) {
    return projectDetails.id;
  }

  const userFundDetails = getExpenseUserFundDetails(expense);
  if (userFundDetails?.id) {
    return userFundDetails.id;
  }

  return expense?.expenseable_info?.id;
}

function getFundUserRole(expense?: Expense | null): string {
  // مستخدم الصندوق فقط من expenseable_info.user_info
  return normalizeRole(getExpenseUserFundUserInfo(expense)?.role_type);
}

function getFundUserId(expense?: Expense | null): number | undefined {
  // معرّف سجل الدور لمستخدم الصندوق من expenseable_info.user_info فقط
  const userInfo = getExpenseUserFundUserInfo(expense);
  if (!userInfo) {
    return undefined;
  }

  if (userInfo.id) {
    return userInfo.id;
  }

  const roleDetails = userInfo.user?.role_details as { id?: number } | undefined;
  if (roleDetails?.id) {
    return roleDetails.id;
  }

  return undefined;
}

function getFundUserBaseUserId(expense?: Expense | null): number | undefined {
  const userInfo = getExpenseUserFundUserInfo(expense);
  return userInfo?.user_id ?? userInfo?.user?.id;
}

function getUserFundId(expense?: Expense | null): number | undefined {
  const details = getExpenseUserFundDetails(expense);
  return details?.fund_id ?? details?.fund?.id;
}

function normalizeRole(role?: string): string {
  if (!role) return '';
  if (role === 'craftsmen') return 'craftsman';
  return role;
}

function getExpenseUserRole(expense?: Expense | null): string {
  if (expense?.user_role) {
    return normalizeRole(expense.user_role);
  }

  if (expense?.user && typeof expense.user === 'object') {
    return normalizeRole(expense.user.role_type);
  }

  return '';
}

function getExpenseUserId(expense?: Expense | null): number | undefined {
  // المستخدم السفلي فقط من كائن user الأعلى (user.id)
  if (expense?.user_id) {
    return expense.user_id;
  }

  if (expense?.user && typeof expense.user === 'object') {
    return expense.user.id;
  }

  return undefined;
}

function getExpenseCreatedById(expense?: Expense | null): number {
  if (typeof expense?.created_by === 'number') {
    return expense.created_by;
  }

  if (expense?.created_by && typeof expense.created_by === 'object') {
    return expense.created_by.id;
  }

  return 1;
}

function formatNumberWithCommas(value: unknown): string {
  if (value === undefined || value === null || value === '' || Number.isNaN(value)) return '';
  const str = String(value).replace(/,/g, '');
  const parts = str.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
}

export function ExpensesForm({ defaultValues, fixedValues, fixedFundCurrencies, onSubmit, loading }: ExpensesFormProps) {
  const navigate = useNavigate();
  const isUserFundFixed = Boolean(fixedValues?.user_fund_id);
  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      source: fixedValues?.source ?? getInitialSource(defaultValues),
      expenseable_type: defaultValues?.expenseable_type ?? (fixedValues?.source ? sourceToExpenseableType[fixedValues.source] : sourceToExpenseableType.company_fund),
      expenseable_id: getExpenseableCurrencyId(defaultValues),
      company_fund_id: fixedValues?.company_fund_id ?? defaultValues?.expenseable_info?.company_fund_id ?? undefined,
      user_role: fixedValues?.fund_user_role ?? getExpenseUserRole(defaultValues),
      user_id: fixedValues?.user_id ?? getExpenseUserId(defaultValues),
      fund_user_role: fixedValues?.fund_user_role ?? getFundUserRole(defaultValues),
      fund_user_id: fixedValues?.user_id ?? getFundUserId(defaultValues),
      user_fund_id: fixedValues?.user_fund_id ?? getUserFundId(defaultValues),
      project_fund_id: fixedValues?.project_fund_id ?? getExpenseProjectFundId(defaultValues),
      project_id: fixedValues?.project_id ?? getExpenseProjectId(defaultValues),
      description: defaultValues?.description ?? '',
      amount: Number(defaultValues?.amount ?? 0),
      is_posted: Boolean(defaultValues?.is_posted ?? true),
      created_by: getExpenseCreatedById(defaultValues),
    },
  });

  useEffect(() => {
    if (!defaultValues) {
      return;
    }

    form.reset({
      source: getInitialSource(defaultValues),
      expenseable_type: defaultValues.expenseable_type ?? sourceToExpenseableType.company_fund,
      expenseable_id: getExpenseableCurrencyId(defaultValues),
      company_fund_id: fixedValues?.company_fund_id ?? defaultValues.expenseable_info?.company_fund_id ?? undefined,
      user_role: getExpenseUserRole(defaultValues),
      user_id: getExpenseUserId(defaultValues),
      fund_user_role: fixedValues?.fund_user_role ?? getFundUserRole(defaultValues),
      fund_user_id: fixedValues?.user_id ?? getFundUserId(defaultValues),
      user_fund_id: fixedValues?.user_fund_id ?? getUserFundId(defaultValues),
      project_fund_id: getExpenseProjectFundId(defaultValues),
      project_id: getExpenseProjectId(defaultValues),
      description: defaultValues.description ?? '',
      amount: Number(defaultValues.amount ?? 0),
      is_posted: Boolean(defaultValues.is_posted ?? true),
      created_by: getExpenseCreatedById(defaultValues),
    });
  }, [defaultValues, form]);

  const source = form.watch('source');
  const companyFundId = form.watch('company_fund_id');
  const selectedExpenseableId = form.watch('expenseable_id');
  const userRole = form.watch('user_role') as UserRole | '';
  form.watch('user_id');
  const fundUserRole = form.watch('fund_user_role') as UserRole | '';
  const fundUserId = form.watch('fund_user_id');
  const userFundId = form.watch('user_fund_id');
  const projectFundId = form.watch('project_fund_id');
  const selectedProjectId = form.watch('project_id');

  useEffect(() => {
    form.clearErrors('expenseable_id');
  }, [selectedExpenseableId, source, form]);

  const companyFundsQuery = useQuery({
    queryKey: ['expenses', 'company-funds'] as const,
    queryFn: () => companyFundsApi.getCompanyFunds(),
    enabled: source === 'company_fund',
  });
  const companyFunds: CompanyFund[] = companyFundsQuery.data?.data ?? (Array.isArray(companyFundsQuery.data) ? companyFundsQuery.data : []);

  const derivedCompanyFundId = useMemo(() => {
    if (companyFundId) {
      return companyFundId;
    }

    if (!selectedExpenseableId) {
      return undefined;
    }

    return companyFunds.find((fund) =>
      fund.currencies?.some((currency) => currencyMatchesExpenseableId(currency, selectedExpenseableId)),
    )?.id;
  }, [companyFundId, companyFunds, selectedExpenseableId]);

  useEffect(() => {
    if (source !== 'company_fund') {
      return;
    }

    if (companyFundId || !derivedCompanyFundId) {
      return;
    }

    form.setValue('company_fund_id', derivedCompanyFundId);
  }, [companyFundId, derivedCompanyFundId, form, source]);

  const { data: selectedCompanyFund } = useQuery<CompanyFund | null>({
    queryKey: ['expenses', 'company-fund', derivedCompanyFundId] as const,
    queryFn: async () => {
      if (!derivedCompanyFundId) {
        return null;
      }

      return companyFundsApi.getCompanyFundById(derivedCompanyFundId);
    },
    enabled: source === 'company_fund' && Boolean(derivedCompanyFundId),
  });

  const projectsQuery = useQuery({
    queryKey: ['expenses', 'projects'] as const,
    queryFn: () => projectsApi.getProjects(),
    enabled: source === 'project_fund',
  });
  const projects: Project[] = projectsQuery.data?.data ?? (Array.isArray(projectsQuery.data) ? projectsQuery.data : []);

  // عند اختيار مشروع: نجلب تفاصيله مع الصناديق والعملات من /projects/:id
  const selectedProjectDetailsQuery = useQuery<Project | null>({
    queryKey: ['expenses', 'project-details', selectedProjectId] as const,
    queryFn: async () => {
      if (!selectedProjectId) {
        return null;
      }

      return projectsApi.getProjectById(selectedProjectId);
    },
    enabled: source === 'project_fund' && Boolean(selectedProjectId),
  });
  const selectedProjectDetails = selectedProjectDetailsQuery.data;

  const roleUsersQuery = useQuery<RoleUser[]>({
    queryKey: ['expenses', 'role-users', userRole] as const,
    queryFn: async () => {
      if (!userRole) {
        return [];
      }

      const res = await usersApi.getUsersByRole(userRole);
      const list = (res as any)?.data ?? res;
      return list as RoleUser[];
    },
    enabled: Boolean(userRole) && !fixedValues?.user_id,
  });
  const roleUsers = roleUsersQuery.data ?? [];

  const fundRoleUsersQuery = useQuery<RoleUser[]>({
    queryKey: ['expenses', 'fund-role-users', fundUserRole] as const,
    queryFn: async () => {
      if (!fundUserRole) {
        return [];
      }

      const res = await usersApi.getUsersByRole(fundUserRole);
      const list = (res as any)?.data ?? res;
      return list as RoleUser[];
    },
    enabled: source === 'user_fund' && Boolean(fundUserRole) && !fixedValues?.user_id,
  });
  const fundRoleUsers = fundRoleUsersQuery.data ?? [];

  const fundUserRecordQuery = useQuery<FundUserRecord | null>({
    queryKey: ['expenses', 'fund-user-record', fundUserRole, fundUserId] as const,
    queryFn: async () => {
      if (!fundUserRole || !fundUserId) {
        return null;
      }

      const user = await usersApi.getUserByRole(fundUserRole, fundUserId);
      return user as FundUserRecord;
    },
    enabled: source === 'user_fund' && Boolean(fundUserRole) && Boolean(fundUserId) && !fixedFundCurrencies,
  });
  const selectedFundUserRecord = fundUserRecordQuery.data;

  const projectFunds: ProjectFund[] = useMemo(() => {
    if (source !== 'project_fund' || !selectedProjectId) return [];
    return selectedProjectDetails?.funds ?? [];
  }, [selectedProjectDetails?.funds, selectedProjectId, source]);

  const derivedProjectFundId = useMemo(() => {
    if (projectFundId) {
      return projectFundId;
    }

    if (!selectedExpenseableId) {
      return undefined;
    }

    return projectFunds.find((fund) =>
      fund.currencies?.some((currency) => currencyMatchesExpenseableId(currency, selectedExpenseableId)),
    )?.id;
  }, [projectFundId, projectFunds, selectedExpenseableId]);

  const selectedProjectFund = useMemo(() => {
    const fundId = projectFundId ?? derivedProjectFundId;
    if (!fundId) return undefined;
    return projectFunds.find((fund) => fund.id === fundId);
  }, [derivedProjectFundId, projectFundId, projectFunds]);

  const selectedProjectFundCurrencies = useMemo(() => {
    return selectedProjectFund?.currencies ?? [];
  }, [selectedProjectFund]);

  useEffect(() => {
    if (source !== 'project_fund') {
      return;
    }

    if (projectFundId || !derivedProjectFundId) {
      return;
    }

    form.setValue('project_fund_id', derivedProjectFundId);
  }, [derivedProjectFundId, form, projectFundId, source]);

  const derivedUserFundId = useMemo(() => {
    if (userFundId) {
      return userFundId;
    }

    if (!selectedExpenseableId) {
      return undefined;
    }

    return selectedFundUserRecord?.user.funds?.find((fund) =>
      fund.currencies?.some((currency) => currencyMatchesExpenseableId(currency, selectedExpenseableId)),
    )?.id;
  }, [selectedExpenseableId, selectedFundUserRecord, userFundId]);

  useEffect(() => {
    if (source !== 'user_fund') {
      return;
    }

    if (userFundId || !derivedUserFundId) {
      return;
    }

    form.setValue('user_fund_id', derivedUserFundId);
  }, [derivedUserFundId, form, source, userFundId]);

  // إذا جاء user_info.user_id بدون معرّف سجل الدور، نطابقه من قائمة الدور
  useEffect(() => {
    if (source !== 'user_fund' || fundUserId || !fundUserRole || !fundRoleUsers.length) {
      return;
    }

    const baseUserId = getFundUserBaseUserId(defaultValues);
    if (!baseUserId) {
      return;
    }

    const matched = fundRoleUsers.find((user) => user.user.id === baseUserId);
    if (matched) {
      form.setValue('fund_user_id', matched.id);
    }
  }, [defaultValues, fundRoleUsers, fundUserId, fundUserRole, form, source]);

  const selectedProjectName = useMemo(() => {
    if (!selectedProjectId) return '';

    const fromProjects = projects.find((project) => project.id === selectedProjectId)?.name;
    if (fromProjects) return fromProjects;

    if (selectedProjectDetails?.id === selectedProjectId) {
      return selectedProjectDetails.name;
    }

    const details = getExpenseProjectFundDetails(defaultValues);
    const project = details?.project_fund?.project;
    if (project?.id === selectedProjectId) {
      return project.name ?? '';
    }

    return '';
  }, [defaultValues, projects, selectedProjectDetails, selectedProjectId]);

  const selectedProjectFundName = useMemo(() => {
    if (!derivedProjectFundId) return '';

    const fromFunds = projectFunds.find((fund) => fund.id === derivedProjectFundId)?.name;
    if (fromFunds) return fromFunds;

    const details = getExpenseProjectFundDetails(defaultValues);
    if (details?.project_fund?.id === derivedProjectFundId) {
      return details.project_fund.name ?? '';
    }

    return '';
  }, [defaultValues, derivedProjectFundId, projectFunds]);

  const selectedProjectCurrencyName = useMemo(() => {
    if (!selectedExpenseableId) return '';

    const currency = selectedProjectFundCurrencies.find((item) =>
      currencyMatchesExpenseableId(item, selectedExpenseableId),
    );
    if (currency) return getCurrencyLabel(currency);

    const details = getExpenseProjectFundDetails(defaultValues);
    if (details?.id === selectedExpenseableId && details.currency) {
      return getCurrencyLabel({
        currency: details.currency.currency,
        balance: details.balance ?? '0',
      });
    }

    return '';
  }, [defaultValues, selectedExpenseableId, selectedProjectFundCurrencies]);

  const selectedCompanyFundName = useMemo(() => {
    if (!derivedCompanyFundId) return '';
    return companyFunds.find((fund) => fund.id === derivedCompanyFundId)?.name ?? '';
  }, [companyFunds, derivedCompanyFundId]);

  const selectedCompanyCurrencyName = useMemo(() => {
    if (!selectedExpenseableId || !selectedCompanyFund) return '';
    const currency = selectedCompanyFund.currencies?.find((item) =>
      currencyMatchesExpenseableId(item, selectedExpenseableId),
    );
    return currency ? getCurrencyLabel(currency) : '';
  }, [selectedCompanyFund, selectedExpenseableId]);

  const selectedUserFund = useMemo(() => {
    if (!derivedUserFundId) return undefined;
    return selectedFundUserRecord?.user.funds?.find((fund) => fund.id === derivedUserFundId);
  }, [derivedUserFundId, selectedFundUserRecord]);

  const selectedUserFundName = useMemo(() => {
    if (!derivedUserFundId) return '';

    const fromFunds = selectedFundUserRecord?.user.funds?.find((fund) => fund.id === derivedUserFundId)?.name;
    if (fromFunds) return fromFunds;

    const details = getExpenseUserFundDetails(defaultValues);
    if (details?.fund?.id === derivedUserFundId) {
      return details.fund.name ?? '';
    }

    return '';
  }, [defaultValues, derivedUserFundId, selectedFundUserRecord]);

  const selectedUserCurrencyName = useMemo(() => {
    if (!selectedExpenseableId) return '';

    if (selectedUserFund) {
      const currency = selectedUserFund.currencies?.find((item) =>
        currencyMatchesExpenseableId(item, selectedExpenseableId),
      );
      if (currency) return getCurrencyLabel(currency);
    }

    const details = getExpenseUserFundDetails(defaultValues);
    if (details?.id === selectedExpenseableId && details.currency) {
      return getCurrencyLabel({
        currency: details.currency.currency,
        balance: details.balance ?? '0',
      });
    }

    return '';
  }, [defaultValues, selectedExpenseableId, selectedUserFund]);

  const userFundCurrencies = useMemo(() => {
    if (fixedFundCurrencies) {
      return fixedFundCurrencies;
    }
    return selectedUserFund?.currencies ?? [];
  }, [fixedFundCurrencies, selectedUserFund]);

  const selectedCurrency = useMemo(() => {
    if (!selectedExpenseableId) return null;
    let currencies: any[] = [];
    if (source === 'company_fund') {
      currencies = selectedCompanyFund?.currencies ?? [];
    } else if (source === 'project_fund') {
      currencies = selectedProjectFundCurrencies;
    } else if (source === 'user_fund') {
      currencies = userFundCurrencies;
    }
    const found = currencies.find((c) => getCurrencyExpenseableId(c) === selectedExpenseableId);
    if (found) return found;

    if (source === 'company_fund' && defaultValues?.expenseable_info?.id === selectedExpenseableId) {
      const details = defaultValues.expenseable_info?.details;
      if (details && typeof details === 'object' && 'currency' in details) {
        return {
          currency: (details as any).currency?.currency || '',
          balance: String((details as any).balance ?? '0'),
        };
      }
    }
    if (source === 'project_fund') {
      const details = getExpenseProjectFundDetails(defaultValues);
      if (details?.id === selectedExpenseableId && details.currency) {
        return {
          currency: details.currency.currency,
          balance: String(details.balance ?? '0'),
        };
      }
    }
    if (source === 'user_fund') {
      const details = getExpenseUserFundDetails(defaultValues);
      if (details?.id === selectedExpenseableId && details.currency) {
        return {
          currency: details.currency.currency,
          balance: String(details.balance ?? '0'),
        };
      }
    }

    return null;
  }, [selectedExpenseableId, source, selectedCompanyFund, selectedProjectFundCurrencies, selectedUserFund, defaultValues]);


  useEffect(() => {
    if (source === 'project_fund' && selectedProjectId && projectFunds.length === 1 && !projectFundId) {
      form.setValue('project_fund_id', projectFunds[0].id);
    }
  }, [source, selectedProjectId, projectFunds, projectFundId, form]);

  useEffect(() => {
    if (source === 'company_fund' && companyFunds.length === 1 && !companyFundId) {
      form.setValue('company_fund_id', companyFunds[0].id);
    }
  }, [source, companyFunds, companyFundId, form]);

  useEffect(() => {
    let currencies: any[] = [];
    if (source === 'company_fund') {
      currencies = selectedCompanyFund?.currencies ?? [];
    } else if (source === 'project_fund') {
      currencies = selectedProjectFundCurrencies;
    } else if (source === 'user_fund') {
      currencies = selectedUserFund?.currencies ?? [];
    }
    
    if (currencies.length === 1 && !selectedExpenseableId) {
      const val = getCurrencyExpenseableId(currencies[0]);
      if (val) form.setValue('expenseable_id', val);
    }
  }, [source, selectedCompanyFund, selectedProjectFundCurrencies, selectedUserFund, selectedExpenseableId, form]);

  return (
    <Form {...form}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(
          async (values) => {
            const bal = selectedCurrency ? Number(selectedCurrency.balance) || 0 : null;
            if (bal !== null && bal <= 0) {
              form.setError('expenseable_id', {
                type: 'custom',
                message: 'رصيد الصندوق 0 أو أقل، غير مسموح بإضافة المصروف',
              });
              return;
            }
            const urlUserId = (() => {
              const match = window.location.pathname.match(/\/users\/view\/[^/]+\/(\d+)/);
              return match ? Number(match[1]) : undefined;
            })();
            const finalUserId = values.user_id || fixedValues?.user_id || urlUserId || 0;

            await onSubmit(
              toExpenseApiPayload({
                expenseable_type: sourceToExpenseableType[values.source],
                expenseable_id: values.expenseable_id ?? 0,
                description: values.description,
                amount: values.amount,
                is_posted: values.is_posted,
                user_id: finalUserId,
                created_by: values.created_by ?? 1,
              }),
            );
          },
          (errors) => {
            console.log('Validation Errors:', errors);
          }
        )}
      >
        {!fixedValues?.source && (
          <FormField
            control={form.control}
            name="source"
            render={({ field }) => (
              <FormItem>
                <FormLabel>نوع الصندوق</FormLabel>
                <FormControl>
                  <RadioGroup
                    value={field.value}
                    onValueChange={(value) => {
                      const nextSource = value as ExpenseSource;
                      const nextExpenseableType: ExpenseableType = sourceToExpenseableType[nextSource];
                      field.onChange(nextSource);
                      form.setValue('expenseable_type', nextExpenseableType);
                      form.setValue('expenseable_id', undefined);
                      form.setValue('company_fund_id', undefined);
                      form.setValue('fund_user_role', '');
                      form.setValue('fund_user_id', undefined);
                      form.setValue('user_fund_id', undefined);
                      form.setValue('project_fund_id', undefined);

                      if (nextSource !== 'project_fund') {
                        form.setValue('project_id', undefined);
                      }
                    }}
                    className="grid gap-3 md:grid-cols-3"
                  >
                    {(Object.keys(expenseSourceLabels) as ExpenseSource[]).map((item) => (
                      <label
                        key={item}
                        className="flex cursor-pointer items-center gap-1 rounded-md border border-border bg-card px-4 py-3 text-sm font-medium text-foreground transition-colors has-[:checked]:border-primary has-[:checked]:bg-accent"
                      >
                        <RadioGroupItem className='border-none !p-1' value={item} />
                        <span>{expenseSourceLabels[item]}</span>
                      </label>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {source === 'company_fund' ? (
          <div className="grid gap-4 md:grid-cols-2">
            {!fixedValues?.company_fund_id && (
              <FormField
                control={form.control}
              name="company_fund_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>صناديق الشركة</FormLabel>
                  {companyFundsQuery.isLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Select
                      value={field.value ? String(field.value) : ''}
                      onValueChange={(value) => {
                        field.onChange(Number(value));
                        form.setValue('expenseable_id', undefined);
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          {field.value
                            ? (selectedCompanyFundName || 'اختر صندوق الشركة')
                            : <SelectValue placeholder="اختر صندوق الشركة" />}
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {companyFunds.map((fund) => (
                          <SelectItem key={fund.id} value={String(fund.id)}>
                            {getCompanyFundLabel(fund)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </FormItem>
              )}
            />
            )}

            <FormField
              control={form.control}
              name="expenseable_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>عملة الصندوق</FormLabel>
                  <Select
                    value={field.value ? String(field.value) : ''}
                    onValueChange={(value) => {
                      field.onChange(Number(value));
                      form.clearErrors('expenseable_id');
                    }}
                    disabled={!derivedCompanyFundId}
                  >
                    <FormControl>
                      <SelectTrigger disabled={!derivedCompanyFundId}>
                        {selectedCurrency ? (
                          renderCurrencyValue(selectedCurrency)
                        ) : (
                          <SelectValue placeholder="اختر العملة" />
                        )}
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(selectedCompanyFund?.currencies ?? []).map((currency) => {
                        const value = getCurrencyExpenseableId(currency);
                        return (
                          <SelectItem key={`${currency.id}-${value}`} value={String(value)}>
                            {renderCurrencyValue(currency)}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        ) : null}

        {source === 'project_fund' ? (
          <div className="grid gap-4 md:grid-cols-3">
            {!fixedValues?.project_id && (
              <FormField
                control={form.control}
                name="project_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>المشروع</FormLabel>
                    {projectsQuery.isLoading ? (
                      <Skeleton className="h-10 w-full" />
                    ) : (
                      <Select
                        value={field.value ? String(field.value) : ''}
                        onValueChange={(value) => {
                          field.onChange(Number(value));
                          form.setValue('project_fund_id', undefined);
                          form.setValue('expenseable_id', undefined);
                        }}
                      >
                        <FormControl>
                          <SelectTrigger>
                            {field.value ? selectedProjectName : <SelectValue placeholder="اختر المشروع" />}
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {projects.map((project) => (
                            <SelectItem key={project.id} value={String(project.id)}>
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {!fixedValues?.project_fund_id && (
              <FormField
                control={form.control}
                name="project_fund_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>صندوق المشروع</FormLabel>
                    {selectedProjectDetailsQuery.isLoading ? (
                      <Skeleton className="h-10 w-full" />
                    ) : (
                      <Select
                        value={field.value ? String(field.value) : ''}
                        onValueChange={(value) => {
                          field.onChange(Number(value));
                          form.setValue('expenseable_id', undefined);
                        }}
                        disabled={!selectedProjectId}
                      >
                        <FormControl>
                          <SelectTrigger disabled={!selectedProjectId}>
                            {field.value
                              ? (selectedProjectFundName || 'اختر صندوق المشروع')
                              : <SelectValue placeholder="اختر صندوق المشروع" />}
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {projectFunds.map((fund) => (
                            <SelectItem key={fund.id} value={String(fund.id)}>
                              {fund.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="expenseable_id"
              render={({ field }) => (
                <FormItem className="">
                  <FormLabel>عملة الصندوق</FormLabel>
                  <Select
                    value={field.value ? String(field.value) : ''}
                    onValueChange={(value) => {
                      field.onChange(Number(value));
                      form.clearErrors('expenseable_id');
                    }}
                    disabled={!derivedProjectFundId}
                  >
                    <FormControl>
                      <SelectTrigger disabled={!derivedProjectFundId}>
                        {selectedCurrency ? (
                          renderCurrencyValue(selectedCurrency)
                        ) : (
                          <SelectValue placeholder="اختر العملة" />
                        )}
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {selectedProjectFundCurrencies.map((currency) => {
                        const value = getCurrencyExpenseableId(currency);
                        return (
                          <SelectItem key={`${currency.id}-${value}`} value={String(value)}>
                            {renderCurrencyValue(currency)}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        ) : null}

        {source === 'user_fund' && !fixedValues?.user_fund_id ? (
          <div className="space-y-4 rounded-lg border border-border bg-muted/40 p-4">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">صندوق المستخدم</p>
            </div>

            <div className="flex flex-wrap gap-4 [&>*]:flex-[1_1_200px] items-start">
              <FormField
                control={form.control}
                name="fund_user_role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نوع المستخدم</FormLabel>
                    <Select
                      value={field.value ?? ''}
                      onValueChange={(value) => {
                        field.onChange(value);
                        form.setValue('fund_user_id', undefined);
                        form.setValue('user_fund_id', undefined);
                        form.setValue('expenseable_id', undefined);
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          {field.value ? getRoleLabel(field.value as UserRole) : <SelectValue placeholder="اختر نوع المستخدم" />}
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {userRoles.map((role) => (
                          <SelectItem key={role} value={role}>
                            {roleLabels[role]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fund_user_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>المستخدم</FormLabel>
                    <FormControl>
                      {fundRoleUsersQuery.isLoading ? (
                        <Skeleton className="h-10 w-full" />
                      ) : (
                        <SearchableSelect
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(Number(value));
                            form.setValue('user_fund_id', undefined);
                            form.setValue('expenseable_id', undefined);
                          }}
                          disabled={!fundUserRole}
                          placeholder="اختر المستخدم"
                          options={fundRoleUsers.map((user) => ({
                            value: user.id,
                            label: user.user.name
                          }))}
                        />
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="user_fund_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>صندوق المستخدم</FormLabel>
                    {fundUserRecordQuery.isLoading ? (
                      <Skeleton className="h-10 w-full" />
                    ) : (
                      <Select
                        value={field.value ? String(field.value) : ''}
                        onValueChange={(value) => {
                          field.onChange(Number(value));
                          form.setValue('expenseable_id', undefined);
                        }}
                        disabled={!fundUserId}
                      >
                        <FormControl>
                          <SelectTrigger disabled={!fundUserId}>
                            {field.value
                              ? (selectedUserFundName || 'اختر صندوق المستخدم')
                              : <SelectValue placeholder="اختر صندوق المستخدم" />}
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(selectedFundUserRecord?.user.funds ?? []).map((fund) => (
                            <SelectItem key={fund.id} value={String(fund.id)}>
                              {getFundLabel(fund)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expenseable_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>عملة الصندوق</FormLabel>
                    <Select
                      value={field.value ? String(field.value) : ''}
                      onValueChange={(value) => {
                        field.onChange(Number(value));
                        form.clearErrors('expenseable_id');
                      }}
                      disabled={!userFundId}
                    >
                      <FormControl>
                        <SelectTrigger disabled={!userFundId}>
                          {selectedCurrency ? (
                            renderCurrencyValue(selectedCurrency)
                          ) : (
                            <SelectValue placeholder="اختر العملة" />
                          )}
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {userFundCurrencies.map((currency) => {
                          const value = getCurrencyExpenseableId(currency);
                          return (
                            <SelectItem key={`${currency.id}-${value}`} value={String(value)}>
                              {renderCurrencyValue(currency)}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        ) : source === 'user_fund' ? (
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="expenseable_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>عملة الصندوق</FormLabel>
                  <Select
                    value={field.value ? String(field.value) : ''}
                    onValueChange={(value) => {
                      field.onChange(Number(value));
                      form.clearErrors('expenseable_id');
                    }}
                    disabled={!userFundId}
                  >
                    <FormControl>
                      <SelectTrigger disabled={!userFundId}>
                        {selectedCurrency ? (
                          renderCurrencyValue(selectedCurrency)
                        ) : (
                          <SelectValue placeholder="اختر العملة" />
                        )}
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {userFundCurrencies.map((currency) => {
                        const value = getCurrencyExpenseableId(currency);
                        return (
                          <SelectItem key={`${currency.id}-${value}`} value={String(value)}>
                            {renderCurrencyValue(currency)}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isUserFundFixed && (
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>المبلغ</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={formatNumberWithCommas(field.value)}
                        onChange={(event) => {
                          const raw = event.target.value.replace(/,/g, '');
                          if (/^\d*\.?\d*$/.test(raw)) {
                            field.onChange(raw === '' ? '' : Number(raw));
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        ) : null}

        {!fixedValues?.user_id ? (
          <div className="grid gap-4 md:grid-cols-3">
            <FormField
              control={form.control}
              name="user_role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>نوع المستلم</FormLabel>
                  <Select
                    value={field.value ?? ''}
                    onValueChange={(value) => {
                      field.onChange(value);
                      form.setValue('user_id', undefined);
                    }}
                  >
                    <FormControl>
                      <SelectTrigger>
                        {field.value ? getRoleLabel(field.value as UserRole) : <SelectValue placeholder="اختر نوع المستخدم" />}
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {userRoles.map((role) => (
                        <SelectItem key={role} value={role}>
                          {roleLabels[role]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="user_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>المستلم</FormLabel>
                  <FormControl>
                    {roleUsersQuery.isLoading ? (
                      <Skeleton className="h-10 w-full" />
                    ) : (
                      <SearchableSelect
                        value={field.value}
                        onValueChange={(value) => field.onChange(Number(value))}
                        disabled={!userRole}
                        placeholder="اختر المستخدم"
                        options={roleUsers.map((user) => ({
                          value: user?.user.id,
                          label: user?.user.name
                        }))}
                      />
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>المبلغ</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={formatNumberWithCommas(field.value)}
                      onChange={(event) => {
                        const raw = event.target.value.replace(/,/g, '');
                        if (/^\d*\.?\d*$/.test(raw)) {
                          field.onChange(raw === '' ? '' : Number(raw));
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        ) : !isUserFundFixed ? (
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>المبلغ</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={formatNumberWithCommas(field.value)}
                    onChange={(event) => {
                      const raw = event.target.value.replace(/,/g, '');
                      if (/^\d*\.?\d*$/.test(raw)) {
                        field.onChange(raw === '' ? '' : Number(raw));
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : null}

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>الوصف</FormLabel>
              <FormControl>
                <Textarea rows={4} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="is_posted"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border border-border p-4 shadow-sm rtl:space-x-reverse bg-muted/10">
              <FormControl>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                  />
                  <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-slate-900 peer-checked:after:translate-x-full peer-checked:after:border-white rtl:peer-checked:after:-translate-x-full dark:border-gray-600 dark:bg-gray-700 dark:peer-focus:ring-slate-800"></div>
                </label>
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="text-sm font-medium text-slate-700 cursor-pointer">
                  مرحل (إرسال المصروف للصندوق المباشر)
                </FormLabel>
              </div>
            </FormItem>
          )}
        />

        <div className="flex items-center justify-start gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            إلغاء
          </Button>

          <Button type="submit" disabled={loading}>
            {loading
              ? (defaultValues?.id ? 'جاري التحديث...' : 'جاري الإضافة...')
              : (defaultValues?.id ? 'تحديث المصروف' : 'إضافة')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
