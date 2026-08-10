import { useEffect, useMemo, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { useForm, type Control } from 'react-hook-form';
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
import { Plus } from 'lucide-react';

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
  onSubmitWithInvoice?: (data: CreateExpensePayload) => Promise<void>;
  onCancel?: () => void;
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
  trustee: 'الأمين',
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

function newestFundsFirst<T extends { id: number; created_at?: string }>(funds: T[]): T[] {
  return [...funds].sort((a, b) => {
    const dateDifference = (Date.parse(b.created_at ?? '') || 0) - (Date.parse(a.created_at ?? '') || 0);
    return dateDifference || b.id - a.id;
  });
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
  const [integer, decimal] = String(value).replace(/,/g, '').split('.');
  const formatted = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return decimal === undefined ? formatted : `${formatted}.${decimal}`;
}

function ExpenseAmountField({ control, className }: { control: Control<ExpenseFormValues>; className?: string }) {
  return (
    <FormField control={control} name="amount" render={({ field }) => (
      <FormItem className={className}>
        <FormLabel>المبلغ</FormLabel>
        <FormControl>
          <Input type="text" inputMode="decimal" value={formatNumberWithCommas(field.value)} onChange={(event) => {
            const raw = event.target.value.replace(/,/g, '');
            if (/^\d*\.?\d*$/.test(raw)) field.onChange(raw === '' ? '' : Number(raw));
          }} />
        </FormControl>
        <FormMessage />
      </FormItem>
    )} />
  );
}

type ExpenseCurrencyOption = {
  id: number;
  expenseable_id?: number;
  pivot?: { id: number };
  currency: string;
  balance: string;
};

function ExpenseCurrencyField({ control, currencies, selectedCurrency, disabled, className }: {
  control: Control<ExpenseFormValues>;
  currencies: ExpenseCurrencyOption[];
  selectedCurrency: ExpenseCurrencyOption | null;
  disabled: boolean;
  className?: string;
}) {
  return (
    <FormField control={control} name="expenseable_id" render={({ field }) => (
      <FormItem className={className}>
        <FormLabel>عملة الصندوق</FormLabel>
        <Select value={field.value ? String(field.value) : ''} onValueChange={(value) => field.onChange(Number(value))} disabled={disabled}>
          <FormControl>
            <SelectTrigger disabled={disabled}>
              {selectedCurrency ? renderCurrencyValue(selectedCurrency) : <SelectValue placeholder="اختر العملة" />}
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            {currencies.map((currency) => {
              const value = getCurrencyExpenseableId(currency);
              return <SelectItem key={`${currency.id}-${value}`} value={String(value)}>{renderCurrencyValue(currency)}</SelectItem>;
            })}
          </SelectContent>
        </Select>
        <FormMessage />
      </FormItem>
    )} />
  );
}

export function ExpensesForm({ defaultValues, fixedValues, fixedFundCurrencies, onSubmit, onSubmitWithInvoice, loading }: ExpensesFormProps) {
  const submitModeRef = useRef<'expense' | 'invoice'>('expense');
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
  const [assignUser, setAssignUser] = useState(() => Boolean(fixedValues?.user_id || getExpenseUserId(defaultValues)));

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

  const companyFundsQuery = useQuery({
    queryKey: ['expenses', 'company-funds'] as const,
    queryFn: () => companyFundsApi.getCompanyFunds(),
    enabled: source === 'company_fund',
  });
  const companyFunds: CompanyFund[] = useMemo(() => {
    const funds = companyFundsQuery.data?.data ?? (Array.isArray(companyFundsQuery.data) ? companyFundsQuery.data : []);
    return newestFundsFirst(funds);
  }, [companyFundsQuery.data]);

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
    enabled: assignUser && Boolean(userRole) && !fixedValues?.user_id,
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
  const userFunds = useMemo(
    () => newestFundsFirst(selectedFundUserRecord?.user.funds ?? []),
    [selectedFundUserRecord],
  );

  const projectFunds: ProjectFund[] = useMemo(() => {
    if (source !== 'project_fund' || !selectedProjectId) return [];
    return newestFundsFirst(selectedProjectDetails?.funds ?? []);
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

    return userFunds.find((fund) =>
      fund.currencies?.some((currency) => currencyMatchesExpenseableId(currency, selectedExpenseableId)),
    )?.id;
  }, [selectedExpenseableId, userFundId, userFunds]);

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

  const selectedCompanyFundName = useMemo(() => {
    if (!derivedCompanyFundId) return '';
    return companyFunds.find((fund) => fund.id === derivedCompanyFundId)?.name ?? '';
  }, [companyFunds, derivedCompanyFundId]);

  const selectedUserFund = useMemo(() => {
    if (!derivedUserFundId) return undefined;
    return userFunds.find((fund) => fund.id === derivedUserFundId);
  }, [derivedUserFundId, userFunds]);

  const selectedUserFundName = useMemo(() => {
    if (!derivedUserFundId) return '';

    const fromFunds = userFunds.find((fund) => fund.id === derivedUserFundId)?.name;
    if (fromFunds) return fromFunds;

    const details = getExpenseUserFundDetails(defaultValues);
    if (details?.fund?.id === derivedUserFundId) {
      return details.fund.name ?? '';
    }

    return '';
  }, [defaultValues, derivedUserFundId, userFunds]);

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
    const found = currencies.find((c) => Number(getCurrencyExpenseableId(c)) === Number(selectedExpenseableId));
    if (found) return found;

    if (source === 'company_fund' && Number(defaultValues?.expenseable_info?.id) === Number(selectedExpenseableId)) {
      const details = defaultValues?.expenseable_info?.details;
      if (details && typeof details === 'object' && 'currency' in details) {
        return {
          currency: (details as any).currency?.currency || '',
          balance: String((details as any).balance ?? '0'),
        };
      }
    }
    if (source === 'project_fund') {
      const details = getExpenseProjectFundDetails(defaultValues);
      if (details && Number(details?.id) === Number(selectedExpenseableId) && details.currency) {
        return {
          currency: details.currency.currency,
          balance: String(details.balance ?? '0'),
        };
      }
    }
    if (source === 'user_fund') {
      const details = getExpenseUserFundDetails(defaultValues);
      if (details && Number(details?.id) === Number(selectedExpenseableId) && details.currency) {
        return {
          currency: details.currency.currency,
          balance: String(details.balance ?? '0'),
        };
      }
    }

    return null;
  }, [selectedExpenseableId, source, selectedCompanyFund, selectedProjectFundCurrencies, selectedUserFund, userFundCurrencies, defaultValues]);


  const initialSource = useMemo(() => getInitialSource(defaultValues), [defaultValues]);
  const initialCompanyFundId = useMemo(() => defaultValues?.expenseable_info?.company_fund_id ?? defaultValues?.expenseable_info?.id, [defaultValues]);
  const initialUserFundId = useMemo(() => getUserFundId(defaultValues), [defaultValues]);
  const initialProjectFundId = useMemo(() => getExpenseProjectFundId(defaultValues), [defaultValues]);

  useEffect(() => {
    if (source === 'project_fund' && selectedProjectId && projectFunds.length === 1 && !projectFundId) {
      form.setValue('project_fund_id', projectFunds[0].id);
    }
  }, [source, selectedProjectId, projectFunds, projectFundId, form]);

  useEffect(() => {
    if (!defaultValues) {
      return;
    }

    const isSourceChanged = source !== initialSource;
    const isCompanyFundChanged = source === 'company_fund' && companyFundId !== initialCompanyFundId;
    const isUserFundChanged = source === 'user_fund' && userFundId !== initialUserFundId;
    const isProjectFundChanged = source === 'project_fund' && projectFundId !== initialProjectFundId;

    if (isSourceChanged || isCompanyFundChanged || isUserFundChanged || isProjectFundChanged) {
      form.setValue('expenseable_id', null);
    }
  }, [source, companyFundId, userFundId, projectFundId, initialSource, initialCompanyFundId, initialUserFundId, initialProjectFundId, defaultValues, form]);

  return (
    <Form {...form}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(
          async (values) => {
            const urlUserId = (() => {
              const match = window.location.pathname.match(/\/users\/view\/[^/]+\/(\d+)/);
              return match ? Number(match[1]) : undefined;
            })();
            const finalUserId = assignUser ? (values.user_id || fixedValues?.user_id || urlUserId) : undefined;

            const payload = toExpenseApiPayload({
                expenseable_type: sourceToExpenseableType[values.source],
                expenseable_id: values.expenseable_id ?? 0,
                description: values.description,
                amount: values.amount,
                is_posted: values.is_posted,
                user_id: finalUserId,
                created_by: values.created_by ?? 1,
              });
            if (submitModeRef.current === 'invoice' && onSubmitWithInvoice) {
              await onSubmitWithInvoice(payload);
            } else {
              await onSubmit(payload);
            }
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
                      form.setValue('expenseable_id', null);
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
          <div className={`grid items-start gap-4 ${fixedValues?.company_fund_id ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
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
                          form.setValue('expenseable_id', null);
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

            <ExpenseCurrencyField control={form.control} currencies={selectedCompanyFund?.currencies ?? []} selectedCurrency={selectedCurrency} disabled={!derivedCompanyFundId} />
            <ExpenseAmountField control={form.control} />
          </div>
        ) : null}

        {source === 'project_fund' ? (
          <div className={`grid items-start gap-4 ${fixedValues?.project_fund_id ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
            {!fixedValues?.project_id && (
              <FormField
                control={form.control}
                name="project_id"
                render={({ field }) => (
                  <FormItem className="md:col-span-3">
                    <FormLabel>المشروع</FormLabel>
                    {projectsQuery.isLoading ? (
                      <Skeleton className="h-10 w-full" />
                    ) : (
                      <Select
                        value={field.value ? String(field.value) : ''}
                        onValueChange={(value) => {
                          field.onChange(Number(value));
                          form.setValue('project_fund_id', undefined);
                          form.setValue('expenseable_id', null);
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
                          form.setValue('expenseable_id', null);
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

            <ExpenseAmountField control={form.control} className="md:order-3" />

            <ExpenseCurrencyField control={form.control} currencies={selectedProjectFundCurrencies} selectedCurrency={selectedCurrency} disabled={!derivedProjectFundId} className="md:order-2" />
          </div>
        ) : null}

        {source === 'user_fund' && !fixedValues?.user_fund_id ? (
          <div className="space-y-4 rounded-lg border border-border bg-muted/40 p-4">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">صندوق المستخدم</p>
            </div>

            <div className="grid items-start gap-4 md:grid-cols-3">
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
                        form.setValue('expenseable_id', null);
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
                            form.setValue('expenseable_id', null);
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
                          form.setValue('expenseable_id', null);
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
                          {userFunds.map((fund) => (
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

              <ExpenseCurrencyField control={form.control} currencies={userFundCurrencies} selectedCurrency={selectedCurrency} disabled={!userFundId} />
            </div>
          </div>
        ) : source === 'user_fund' ? (
          <div className={`grid items-start gap-4 ${fixedValues?.user_fund_id ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
            <ExpenseCurrencyField control={form.control} currencies={userFundCurrencies} selectedCurrency={selectedCurrency} disabled={!userFundId} />

            {isUserFundFixed && (
              <ExpenseAmountField control={form.control} />
            )}
          </div>
        ) : null}

        {!fixedValues?.user_id && assignUser ? (
          <div className="grid gap-4 md:grid-cols-2 items-start">
            <FormField
              control={form.control}
              name="user_role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>نوع المستخدم</FormLabel>
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
                  <FormLabel>المستخدم</FormLabel>
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

            {source === 'user_fund' && <ExpenseAmountField control={form.control} />}
          </div>
        ) : !isUserFundFixed && source === 'user_fund' ? (
          <ExpenseAmountField control={form.control} />
        ) : null}

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>البيان</FormLabel>
              <FormControl>
                <Textarea rows={4} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {!fixedValues?.user_id && (
          <div className="flex items-center justify-start gap-2 px-3 py-2">
            <button
              type="button"
              role="switch"
              aria-checked={assignUser}
              onClick={() => {
                setAssignUser((current) => {
                  const next = !current;
                  if (!next) {
                    form.setValue('user_role', '');
                    form.setValue('user_id', undefined);
                    form.clearErrors(['user_role', 'user_id']);
                  }
                  return next;
                });
              }}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${assignUser ? 'bg-primary' : 'bg-muted-foreground/30'}`}
            >
              <span className={`absolute top-0.5 size-5 rounded-full border border-border bg-white shadow-sm transition-all ${assignUser ? 'start-[22px]' : 'start-0.5'}`} />
            </button>

            <div>
              <p className="text-sm font-medium">ربط المصروف بمستخدم</p>
              <p className="text-xs text-muted-foreground">فعّل هذا الخيار إذا كان المصروف مرتبطًا بمستخدم محدد.</p>
            </div>
          </div>
        )}

        <FormField
          control={form.control}
          name="is_posted"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md  rtl:space-x-reverse bg-muted/10">
              <FormControl>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    className="peer sr-only "
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                  />
                  <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white rtl:peer-checked:after:-translate-x-full"></div>
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

        <div className="flex items-center justify-end gap-3 pt-2">
          {onSubmitWithInvoice && !defaultValues?.id && (
            <Button type="submit" variant="outline" disabled={loading} onClick={() => { submitModeRef.current = 'invoice'; }}>
              <Plus className='w-6 h-6' />
              إنشاء مع فاتورة
            </Button>
          )}
          <Button type="submit" disabled={loading} onClick={() => { submitModeRef.current = 'expense'; }}>
            <Plus className='w-6 h-6' />
            {loading
              ? (defaultValues?.id ? 'جاري التحديث...' : 'جاري الإضافة...')
              : (defaultValues?.id ? 'تحديث المصروف' : 'إضافة')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
