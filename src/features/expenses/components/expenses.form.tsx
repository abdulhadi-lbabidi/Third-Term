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
import { companyFundsApi } from '@/features/company-funds/company-funds.api';
import type { CompanyFund } from '@/features/company-funds/types';
import type { Fund } from '@/features/funds/types';
import { projectsApi } from '@/features/projects/projects.api';
import type { Project } from '@/features/projects/types';
import { projectFundsApi } from '@/features/projects/project-funds/project-funds.api';
import type { ProjectFund } from '@/features/projects/project-funds/project-funds.types';
import { usersApi } from '@/features/users/api/users.api';
import type { UserRole } from '@/features/users/types';
import { expenseFormSchema, expenseSourceLabels, type ExpenseFormValues } from '../schemas/expenses.schema';
import type { CreateExpensePayload, Expense, ExpenseSource, ExpenseableType } from '../types';

type ExpensesFormProps = {
  defaultValues?: Expense | null;
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

function getRoleLabel(role: UserRole | '') {
  return role ? roleLabels[role] : '';
}

export function ExpensesForm({ defaultValues, onSubmit, loading }: ExpensesFormProps) {
  const navigate = useNavigate();
  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      source: getSourceFromType(defaultValues?.expenseable_type),
      expenseable_type: defaultValues?.expenseable_type ?? sourceToExpenseableType.company_fund,
      expenseable_id: defaultValues?.expenseable_id,
      company_fund_id: undefined,
      user_role: defaultValues?.user_role ?? '',
      user_id: defaultValues?.user_id ?? undefined,
      fund_user_role: '',
      fund_user_id: undefined,
      user_fund_id: undefined,
      project_fund_id: undefined,
      project_id: undefined,
      description: defaultValues?.description ?? '',
      amount: Number(defaultValues?.amount ?? 0),
      is_posted: Boolean(defaultValues?.is_posted ?? true),
      created_by: defaultValues?.created_by ?? 1,
    },
  });

  const source = form.watch('source');
  const companyFundId = form.watch('company_fund_id');
  const selectedExpenseableId = form.watch('expenseable_id');
  const userRole = form.watch('user_role') as UserRole | '';
  const fundUserRole = form.watch('fund_user_role') as UserRole | '';
  const fundUserId = form.watch('fund_user_id');
  const userFundId = form.watch('user_fund_id');
  const projectFundId = form.watch('project_fund_id');
  const selectedProjectId = form.watch('project_id');

  const { data: companyFunds = [] } = useQuery<CompanyFund[]>({
    queryKey: ['expenses', 'company-funds'] as const,
    queryFn: () => companyFundsApi.getCompanyFunds(),
    enabled: source === 'company_fund',
  });

  const derivedCompanyFundId = useMemo(() => {
    if (companyFundId) {
      return companyFundId;
    }

    if (!selectedExpenseableId) {
      return undefined;
    }

    return companyFunds.find((fund) => fund.currencies?.some((currency) => currency.id === selectedExpenseableId))?.id;
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

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['expenses', 'projects'] as const,
    queryFn: () => projectsApi.getProjects(),
    enabled: source === 'project_fund',
  });

  const { data: allProjectFunds = [] } = useQuery<ProjectFund[]>({
    queryKey: ['expenses', 'project-funds'] as const,
    queryFn: () => projectFundsApi.getProjectFunds(),
    enabled: source === 'project_fund',
  });

  const { data: roleUsers = [] } = useQuery<RoleUser[]>({
    queryKey: ['expenses', 'role-users', userRole] as const,
    queryFn: async () => {
      if (!userRole) {
        return [];
      }

      const users = await usersApi.getUsersByRole(userRole);
      return users as RoleUser[];
    },
    enabled: Boolean(userRole),
  });

  const { data: fundRoleUsers = [] } = useQuery<RoleUser[]>({
    queryKey: ['expenses', 'fund-role-users', fundUserRole] as const,
    queryFn: async () => {
      if (!fundUserRole) {
        return [];
      }

      const users = await usersApi.getUsersByRole(fundUserRole);
      return users as RoleUser[];
    },
    enabled: source === 'user_fund' && Boolean(fundUserRole),
  });

  const { data: selectedFundUserRecord } = useQuery<FundUserRecord | null>({
    queryKey: ['expenses', 'fund-user-record', fundUserRole, fundUserId] as const,
    queryFn: async () => {
      if (!fundUserRole || !fundUserId) {
        return null;
      }

      const user = await usersApi.getUserByRole(fundUserRole, fundUserId);
      return user as FundUserRecord;
    },
    enabled: source === 'user_fund' && Boolean(fundUserRole) && Boolean(fundUserId),
  });

  const projectFunds = useMemo(() => {
    if (source !== 'project_fund' || !selectedProjectId) return [];
    return allProjectFunds.filter((fund) => fund.project.id === selectedProjectId);
  }, [allProjectFunds, selectedProjectId, source]);

  const derivedProjectFundId = useMemo(() => {
    if (projectFundId) {
      return projectFundId;
    }

    if (!selectedExpenseableId) {
      return undefined;
    }

    return projectFunds.find((fund) =>
      fund.currencies?.some((currency) => currency.id === selectedExpenseableId),
    )?.id;
  }, [projectFundId, projectFunds, selectedExpenseableId]);

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
      fund.currencies?.some((currency) => currency.id === selectedExpenseableId),
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

  const selectedProjectName = useMemo(() => {
    if (!selectedProjectId) return '';
    return projects.find((project) => project.id === selectedProjectId)?.name ?? '';
  }, [projects, selectedProjectId]);

  const { data: selectedProjectFund } = useQuery<ProjectFund | null>({
    queryKey: ['expenses', 'project-fund', derivedProjectFundId] as const,
    queryFn: async () => {
      if (!derivedProjectFundId) {
        return null;
      }

      return projectFundsApi.getProjectFundById(derivedProjectFundId);
    },
    enabled: source === 'project_fund' && Boolean(derivedProjectFundId),
  });

  const selectedProjectFundName = useMemo(() => {
    if (!derivedProjectFundId) return '';
    return projectFunds.find((fund) => fund.id === derivedProjectFundId)?.name ?? '';
  }, [derivedProjectFundId, projectFunds]);

  const selectedProjectCurrencyName = useMemo(() => {
    if (!selectedExpenseableId || !selectedProjectFund) return '';
    const currency = selectedProjectFund.currencies?.find((item) => item.id === selectedExpenseableId);
    return currency ? getCurrencyLabel(currency) : '';
  }, [selectedExpenseableId, selectedProjectFund]);

  const selectedCompanyFundName = useMemo(() => {
    if (!derivedCompanyFundId) return '';
    return companyFunds.find((fund) => fund.id === derivedCompanyFundId)?.name ?? '';
  }, [companyFunds, derivedCompanyFundId]);

  const selectedCompanyCurrencyName = useMemo(() => {
    if (!selectedExpenseableId || !selectedCompanyFund) return '';
    const currency = selectedCompanyFund.currencies?.find((item) => item.id === selectedExpenseableId);
    return currency ? getCurrencyLabel(currency) : '';
  }, [selectedCompanyFund, selectedExpenseableId]);

  const selectedUserFund = useMemo(() => {
    if (!derivedUserFundId) return undefined;
    return selectedFundUserRecord?.user.funds?.find((fund) => fund.id === derivedUserFundId);
  }, [derivedUserFundId, selectedFundUserRecord]);

  const selectedUserFundName = useMemo(() => {
    if (!derivedUserFundId) return '';
    return selectedFundUserRecord?.user.funds?.find((fund) => fund.id === derivedUserFundId)?.name ?? '';
  }, [derivedUserFundId, selectedFundUserRecord]);

  const selectedUserCurrencyName = useMemo(() => {
    if (!selectedExpenseableId || !selectedUserFund) return '';
    const currency = selectedUserFund.currencies?.find((item) => item.id === selectedExpenseableId);
    return currency ? getCurrencyLabel(currency) : '';
  }, [selectedExpenseableId, selectedUserFund]);

  return (
    <Form {...form}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(async (values) => {
          await onSubmit({
            expenseable_type: (values.expenseable_type ?? sourceToExpenseableType[values.source]) as ExpenseableType,
            expenseable_id: values.expenseable_id ?? 0,
            description: values.description,
            amount: values.amount,
            is_posted: values.is_posted,
            user_id: values.user_id ?? 1,
            created_by: values.created_by ?? 1,
          });
        })}
      >
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
                      className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 transition-colors has-[:checked]:border-slate-900 has-[:checked]:bg-slate-50"
                    >
                      <span>{expenseSourceLabels[item]}</span>
                      <RadioGroupItem value={item} />
                    </label>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {source === 'user_fund' ? (
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-900">صندوق المستخدم</p>
           
            </div>

            <div className="grid gap-4 md:grid-cols-4">
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
                    <Select
                      value={field.value ? String(field.value) : ''}
                      onValueChange={(value) => {
                        field.onChange(Number(value));
                        form.setValue('user_fund_id', undefined);
                        form.setValue('expenseable_id', undefined);
                      }}
                      disabled={!fundUserRole}
                    >
                      <FormControl>
                        <SelectTrigger disabled={!fundUserRole}>
                          {field.value
                            ? (fundRoleUsers.find((user) => user.id === field.value)?.user.name ?? 'اختر المستخدم')
                            : <SelectValue placeholder="اختر المستخدم" />}
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {fundRoleUsers.map((user) => (
                          <SelectItem key={user.id} value={String(user.id)}>
                            {user.user.name}
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
                name="user_fund_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>صندوق المستخدم</FormLabel>
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
                      onValueChange={(value) => field.onChange(Number(value))}
                      disabled={!userFundId}
                    >
                      <FormControl>
                        <SelectTrigger disabled={!userFundId}>
                          {field.value
                            ? (selectedUserCurrencyName || 'اختر العملة')
                            : <SelectValue placeholder="اختر العملة" />}
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {selectedUserFund?.currencies?.map((currency) => (
                          <SelectItem key={currency.id} value={String(currency.id)}>
                            {getCurrencyLabel(currency)}
                          </SelectItem>
                        )) ?? null}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
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
                <Select
                  value={field.value ? String(field.value) : ''}
                  onValueChange={(value) => field.onChange(Number(value))}
                  disabled={!userRole}
                >
                  <FormControl>
                    <SelectTrigger disabled={!userRole}>
                      {field.value
                        ? (roleUsers.find((user) => user.id === field.value)?.user.name ?? 'اختر المستخدم')
                        : <SelectValue placeholder="اختر المستخدم" />}
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {roleUsers.map((user) => (
                      <SelectItem key={user.id} value={String(user.id)}>
                        {user.user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {source === 'company_fund' ? (
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="company_fund_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>صناديق الشركة</FormLabel>
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
                    onValueChange={(value) => field.onChange(Number(value))}
                    disabled={!derivedCompanyFundId}
                  >
                    <FormControl>
                      <SelectTrigger disabled={!derivedCompanyFundId}>
                        {field.value
                          ? (selectedCompanyCurrencyName || 'اختر العملة')
                          : <SelectValue placeholder="اختر العملة" />}
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(selectedCompanyFund?.currencies ?? []).map((currency) => (
                        <SelectItem key={currency.id} value={String(currency.id)}>
                          {getCurrencyLabel(currency)}
                        </SelectItem>
                      ))}
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
            <FormField
              control={form.control}
              name="project_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>المشروع</FormLabel>
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
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="project_fund_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>صندوق المشروع</FormLabel>
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
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expenseable_id"
              render={({ field }) => (
                <FormItem className="">
                  <FormLabel>عملة الصندوق</FormLabel>
                  <Select
                    value={field.value ? String(field.value) : ''}
                    onValueChange={(value) => field.onChange(Number(value))}
                    disabled={!derivedProjectFundId}
                  >
                    <FormControl>
                      <SelectTrigger disabled={!derivedProjectFundId}>
                        {field.value
                          ? (selectedProjectCurrencyName || 'اختر العملة')
                          : <SelectValue placeholder="اختر العملة" />}
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(selectedProjectFund?.currencies ?? []).map((currency) => (
                        <SelectItem key={currency.id} value={String(currency.id)}>
                          {getCurrencyLabel(currency)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
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
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>المبلغ</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  value={field.value}
                  onChange={(event) => field.onChange(Number(event.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center justify-start gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(-1)}
            className="h-11 rounded-xl border-slate-200 px-5 text-sm font-semibold text-slate-900 hover:bg-slate-50"
          >
            إلغاء
          </Button>

          <Button
            type="submit"
            className="h-11 rounded-xl bg-slate-950 px-5 text-sm font-semibold hover:bg-slate-800"
            disabled={loading}
          >
            {loading ? 'جاري الحفظ...' : 'حفظ'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
