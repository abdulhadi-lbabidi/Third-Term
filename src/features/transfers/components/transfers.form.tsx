import { useEffect, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
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
import { SearchableSelect } from '@/shared/components/ui/searchable-select';
import { companyFundsApi } from '@/features/company-funds/company-funds.api';
import type { CompanyFund } from '@/features/company-funds/types';
import type { Fund } from '@/features/funds/types';
import { projectsApi } from '@/features/projects/projects.api';
import type { Project, ProjectFund } from '@/features/projects/types';
import { usersApi } from '@/features/users/api/users.api';
import type { UserRole } from '@/features/users/types';
import type { TransferableType, CreateTransferPayload } from '../types';

const transferFormSchema = z.object({
  name: z.string().min(1, 'الرجاء إدخال البيان'),
  amount: z.number().positive('الرجاء إدخال مبلغ صحيح'),
  morph_from_id: z.number({ message: 'الرجاء اختيار عملة المصدر' }),
  morph_to_type: z.enum([
    'App\\Models\\CompanyFundCurrency',
    'App\\Models\\CurrencyFund',
    'App\\Models\\ProjectFundCurrency',
  ]),
  morph_to_id: z.number({ message: 'الرجاء اختيار عملة الوجهة' }),
  company_fund_id: z.number().optional(),
  user_role: z.string().optional(),
  user_id: z.number().optional(),
  fund_user_role: z.string().optional(),
  fund_user_id: z.number().optional(),
  user_fund_id: z.number().optional(),
  project_fund_id: z.number().optional(),
  project_id: z.number().optional(),
}).superRefine((values, ctx) => {
  if (!values.user_role) {
    ctx.addIssue({
      code: 'custom',
      path: ['user_role'],
      message: 'الرجاء اختيار نوع المستخدم للتحويل',
    });
  }
  if (!values.user_id) {
    ctx.addIssue({
      code: 'custom',
      path: ['user_id'],
      message: 'الرجاء اختيار المستخدم للتحويل',
    });
  }
  if (values.morph_to_type === 'App\\Models\\CompanyFundCurrency') {
    if (!values.company_fund_id) {
      ctx.addIssue({
        code: 'custom',
        path: ['company_fund_id'],
        message: 'الرجاء اختيار صندوق الشركة',
      });
    }
    if (!values.morph_to_id) {
      ctx.addIssue({
        code: 'custom',
        path: ['morph_to_id'],
        message: 'الرجاء اختيار عملة صندوق الشركة',
      });
    }
  }
  if (values.morph_to_type === 'App\\Models\\ProjectFundCurrency') {
    if (!values.project_id) {
      ctx.addIssue({
        code: 'custom',
        path: ['project_id'],
        message: 'الرجاء اختيار المشروع',
      });
    }
    if (!values.project_fund_id) {
      ctx.addIssue({
        code: 'custom',
        path: ['project_fund_id'],
        message: 'الرجاء اختيار صندوق المشروع',
      });
    }
    if (!values.morph_to_id) {
      ctx.addIssue({
        code: 'custom',
        path: ['morph_to_id'],
        message: 'الرجاء اختيار عملة صندوق المشروع',
      });
    }
  }
  if (values.morph_to_type === 'App\\Models\\CurrencyFund') {
    if (!values.fund_user_role) {
      ctx.addIssue({
        code: 'custom',
        path: ['fund_user_role'],
        message: 'الرجاء اختيار نوع المستخدم لصندوق الوجهة',
      });
    }
    if (!values.fund_user_id) {
      ctx.addIssue({
        code: 'custom',
        path: ['fund_user_id'],
        message: 'الرجاء اختيار مستخدم لصندوق الوجهة',
      });
    }
    if (!values.user_fund_id) {
      ctx.addIssue({
        code: 'custom',
        path: ['user_fund_id'],
        message: 'الرجاء اختيار صندوق الوجهة',
      });
    }
    if (!values.morph_to_id) {
      ctx.addIssue({
        code: 'custom',
        path: ['morph_to_id'],
        message: 'الرجاء اختيار عملة صندوق الوجهة',
      });
    }
  }
});

type TransferFormValues = z.infer<typeof transferFormSchema>;

type TransferFormProps = {
  morph_from_type: TransferableType;
  fixedFromCurrencies: {
    id: number;
    currency: string;
    symbol: string;
    balance: string;
  }[];
  onSubmit: (data: CreateTransferPayload) => Promise<void>;
  loading?: boolean;
};

type RoleUser = {
  id: number;
  user: {
    id: number;
    name: string;
  };
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

function getCompanyFundLabel(item: CompanyFund) {
  return item.name;
}

function getCurrencyLabel(currency: { currency: string; balance: string }) {
  return `${currency.currency} - ${currency.balance}`;
}

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

function getFundLabel(item: { id: number; name: string; user?: { name: string } | null }) {
  return item.user?.name ?? item.name;
}

function formatNumberWithCommas(value: unknown): string {
  if (value === undefined || value === null || value === '' || Number.isNaN(value)) return '';
  const str = String(value).replace(/,/g, '');
  const parts = str.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
}

export function TransfersForm({ morph_from_type, fixedFromCurrencies, onSubmit, loading }: TransferFormProps) {
  const form = useForm<TransferFormValues>({
    resolver: zodResolver(transferFormSchema),
    defaultValues: {
      name: '',
      amount: 0,
      morph_from_id: fixedFromCurrencies[0]?.id,
      morph_to_type: 'App\\Models\\CompanyFundCurrency',
      morph_to_id: undefined,
      user_role: '',
      user_id: undefined,
    },
  });

  const morphToType = form.watch('morph_to_type');
  const companyFundId = form.watch('company_fund_id');
  const selectedMorphToId = form.watch('morph_to_id');
  const userRole = form.watch('user_role') as UserRole | '';
  const fundUserRole = form.watch('fund_user_role') as UserRole | '';
  const fundUserId = form.watch('fund_user_id');
  const userFundId = form.watch('user_fund_id');
  const projectFundId = form.watch('project_fund_id');
  const selectedProjectId = form.watch('project_id');

  const { data: roleUsers = [] } = useQuery<RoleUser[]>({
    queryKey: ['transfers', 'role-users', userRole] as const,
    queryFn: async () => {
      if (!userRole) return [];
      const res = await usersApi.getUsersByRole(userRole);
      const list = (res as any)?.data ?? res;
      return list as RoleUser[];
    },
    enabled: Boolean(userRole),
  });

  const companyFundsQuery = useQuery({
    queryKey: ['transfers', 'company-funds'] as const,
    queryFn: () => companyFundsApi.getCompanyFunds(),
    enabled: morphToType === 'App\\Models\\CompanyFundCurrency',
  });
  const companyFunds: CompanyFund[] = companyFundsQuery.data?.data ?? (Array.isArray(companyFundsQuery.data) ? companyFundsQuery.data : []);

  const derivedCompanyFundId = useMemo(() => {
    if (companyFundId) {
      return companyFundId;
    }
    if (!selectedMorphToId) {
      return undefined;
    }
    return companyFunds.find((fund) =>
      fund.currencies?.some((currency) => currencyMatchesExpenseableId(currency, selectedMorphToId)),
    )?.id;
  }, [companyFundId, companyFunds, selectedMorphToId]);

  useEffect(() => {
    if (morphToType !== 'App\\Models\\CompanyFundCurrency') return;
    if (companyFundId || !derivedCompanyFundId) return;
    form.setValue('company_fund_id', derivedCompanyFundId);
  }, [companyFundId, derivedCompanyFundId, form, morphToType]);

  const { data: selectedCompanyFund } = useQuery<CompanyFund | null>({
    queryKey: ['transfers', 'company-fund', derivedCompanyFundId] as const,
    queryFn: async () => {
      if (!derivedCompanyFundId) return null;
      return companyFundsApi.getCompanyFundById(derivedCompanyFundId);
    },
    enabled: morphToType === 'App\\Models\\CompanyFundCurrency' && Boolean(derivedCompanyFundId),
  });

  const projectsQuery = useQuery({
    queryKey: ['transfers', 'projects'] as const,
    queryFn: () => projectsApi.getProjects(),
    enabled: morphToType === 'App\\Models\\ProjectFundCurrency',
  });
  const projects: Project[] = projectsQuery.data?.data ?? (Array.isArray(projectsQuery.data) ? projectsQuery.data : []);

  const { data: selectedProjectDetails } = useQuery<Project | null>({
    queryKey: ['transfers', 'project-details', selectedProjectId] as const,
    queryFn: async () => {
      if (!selectedProjectId) return null;
      return projectsApi.getProjectById(selectedProjectId);
    },
    enabled: morphToType === 'App\\Models\\ProjectFundCurrency' && Boolean(selectedProjectId),
  });

  const { data: fundRoleUsers = [] } = useQuery<RoleUser[]>({
    queryKey: ['transfers', 'fund-role-users', fundUserRole] as const,
    queryFn: async () => {
      if (!fundUserRole) return [];
      const res = await usersApi.getUsersByRole(fundUserRole);
      const list = (res as any)?.data ?? res;
      return list as RoleUser[];
    },
    enabled: morphToType === 'App\\Models\\CurrencyFund' && Boolean(fundUserRole),
  });

  const { data: selectedFundUserRecord } = useQuery<FundUserRecord | null>({
    queryKey: ['transfers', 'fund-user-record', fundUserRole, fundUserId] as const,
    queryFn: async () => {
      if (!fundUserRole || !fundUserId) return null;
      const user = await usersApi.getUserByRole(fundUserRole, fundUserId);
      return user as FundUserRecord;
    },
    enabled: morphToType === 'App\\Models\\CurrencyFund' && Boolean(fundUserRole) && Boolean(fundUserId),
  });

  const projectFunds: ProjectFund[] = useMemo(() => {
    if (morphToType !== 'App\\Models\\ProjectFundCurrency' || !selectedProjectId) return [];
    return selectedProjectDetails?.funds ?? [];
  }, [selectedProjectDetails?.funds, selectedProjectId, morphToType]);

  const derivedProjectFundId = useMemo(() => {
    if (projectFundId) return projectFundId;
    if (!selectedMorphToId) return undefined;
    return projectFunds.find((fund) =>
      fund.currencies?.some((currency) => currencyMatchesExpenseableId(currency, selectedMorphToId)),
    )?.id;
  }, [projectFundId, projectFunds, selectedMorphToId]);

  const selectedProjectFund = useMemo(() => {
    const fundId = projectFundId ?? derivedProjectFundId;
    if (!fundId) return undefined;
    return projectFunds.find((fund) => fund.id === fundId);
  }, [derivedProjectFundId, projectFundId, projectFunds]);

  const selectedProjectFundCurrencies = useMemo(() => {
    return selectedProjectFund?.currencies ?? [];
  }, [selectedProjectFund]);

  useEffect(() => {
    if (morphToType !== 'App\\Models\\ProjectFundCurrency') return;
    if (projectFundId || !derivedProjectFundId) return;
    form.setValue('project_fund_id', derivedProjectFundId);
  }, [derivedProjectFundId, form, projectFundId, morphToType]);

  const derivedUserFundId = useMemo(() => {
    if (userFundId) return userFundId;
    if (!selectedMorphToId) return undefined;
    return selectedFundUserRecord?.user.funds?.find((fund) =>
      fund.currencies?.some((currency) => currencyMatchesExpenseableId(currency, selectedMorphToId)),
    )?.id;
  }, [selectedMorphToId, selectedFundUserRecord, userFundId]);

  useEffect(() => {
    if (morphToType !== 'App\\Models\\CurrencyFund') return;
    if (userFundId || !derivedUserFundId) return;
    form.setValue('user_fund_id', derivedUserFundId);
  }, [derivedUserFundId, form, morphToType, userFundId]);

  const selectedUserFund = useMemo(() => {
    if (!derivedUserFundId) return undefined;
    return selectedFundUserRecord?.user.funds?.find((fund) => fund.id === derivedUserFundId);
  }, [derivedUserFundId, selectedFundUserRecord]);

  useEffect(() => {
    if (morphToType === 'App\\Models\\ProjectFundCurrency' && selectedProjectId && projectFunds.length === 1 && !projectFundId) {
      form.setValue('project_fund_id', projectFunds[0].id);
    }
  }, [morphToType, selectedProjectId, projectFunds, projectFundId, form]);

  useEffect(() => {
    if (morphToType === 'App\\Models\\CompanyFundCurrency' && companyFunds.length === 1 && !companyFundId) {
      form.setValue('company_fund_id', companyFunds[0].id);
    }
  }, [morphToType, companyFunds, companyFundId, form]);

  useEffect(() => {
    let currencies: any[] = [];
    if (morphToType === 'App\\Models\\CompanyFundCurrency') {
      currencies = selectedCompanyFund?.currencies ?? [];
    } else if (morphToType === 'App\\Models\\ProjectFundCurrency') {
      currencies = selectedProjectFundCurrencies;
    } else if (morphToType === 'App\\Models\\CurrencyFund') {
      currencies = selectedUserFund?.currencies ?? [];
    }
    
    if (currencies.length === 1 && !selectedMorphToId) {
      const val = getCurrencyExpenseableId(currencies[0]);
      if (val) form.setValue('morph_to_id', val);
    }
  }, [morphToType, selectedCompanyFund, selectedProjectFundCurrencies, selectedUserFund, selectedMorphToId, form]);

  const selectedProjectName = useMemo(() => {
    if (!selectedProjectId) return '';
    return projects.find((project) => project.id === selectedProjectId)?.name ?? '';
  }, [projects, selectedProjectId]);

  const selectedProjectFundName = useMemo(() => {
    if (!derivedProjectFundId) return '';
    return projectFunds.find((fund) => fund.id === derivedProjectFundId)?.name ?? '';
  }, [derivedProjectFundId, projectFunds]);

  const selectedProjectCurrencyName = useMemo(() => {
    if (!selectedMorphToId) return '';
    const currency = selectedProjectFundCurrencies.find((item) =>
      currencyMatchesExpenseableId(item, selectedMorphToId),
    );
    return currency ? getCurrencyLabel(currency) : '';
  }, [selectedMorphToId, selectedProjectFundCurrencies]);

  const selectedCompanyFundName = useMemo(() => {
    if (!derivedCompanyFundId) return '';
    return companyFunds.find((fund) => fund.id === derivedCompanyFundId)?.name ?? '';
  }, [companyFunds, derivedCompanyFundId]);

  const selectedCompanyCurrencyName = useMemo(() => {
    if (!selectedMorphToId || !selectedCompanyFund) return '';
    const currency = selectedCompanyFund.currencies?.find((item) =>
      currencyMatchesExpenseableId(item, selectedMorphToId),
    );
    return currency ? getCurrencyLabel(currency) : '';
  }, [selectedCompanyFund, selectedMorphToId]);

  const selectedUserFundName = useMemo(() => {
    if (!derivedUserFundId) return '';
    return selectedFundUserRecord?.user.funds?.find((fund) => fund.id === derivedUserFundId)?.name ?? '';
  }, [derivedUserFundId, selectedFundUserRecord]);

  const selectedUserCurrencyName = useMemo(() => {
    if (!selectedMorphToId || !selectedUserFund) return '';
    const currency = selectedUserFund.currencies?.find((item) =>
      currencyMatchesExpenseableId(item, selectedMorphToId),
    );
    return currency ? getCurrencyLabel(currency) : '';
  }, [selectedUserFund, selectedMorphToId]);

  return (
    <Form {...form}>
      <form
        className="space-y-6"
        onSubmit={form.handleSubmit(async (values) => {
          await onSubmit({
            morph_from_type,
            morph_from_id: values.morph_from_id,
            morph_to_type: values.morph_to_type,
            morph_to_id: values.morph_to_id,
            name: values.name,
            amount: values.amount,
            created_by: 1,
            user_id: values.user_id ?? 1,
          });
        })}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>البيان / الوصف</FormLabel>
                <FormControl>
                  <Input placeholder="تحويل مبلغ لشراء مواد بناء المشروع الأول" {...field} />
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
                        field.onChange(raw === '' ? 0 : Number(raw));
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="morph_from_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>عملة المصدر</FormLabel>
                <Select
                  value={field.value ? String(field.value) : ''}
                  onValueChange={(val) => field.onChange(Number(val))}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر العملة للمصدر" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {fixedFromCurrencies.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.currency} ({c.balance})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 border border-slate-100 rounded-lg p-4 bg-slate-50/50">
          <FormField
            control={form.control}
            name="user_role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>نوع المستخدم المسؤول</FormLabel>
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
                <FormLabel>المستخدم المسؤول</FormLabel>
                <FormControl>
                  <SearchableSelect
                    value={field.value}
                    onValueChange={(value) => field.onChange(Number(value))}
                    disabled={!userRole}
                    placeholder="اختر المستخدم"
                    options={roleUsers.map((user) => ({
                      value: user?.user.id,
                      label: user?.user.name,
                    }))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4 rounded-lg border border-border bg-slate-50/40 p-4">
          <FormField
            control={form.control}
            name="morph_to_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-semibold text-slate-800">نوع صندوق الوجهة</FormLabel>
                <FormControl>
                  <RadioGroup
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      form.setValue('morph_to_id', undefined as any);
                      form.setValue('company_fund_id', undefined);
                      form.setValue('fund_user_role', '');
                      form.setValue('fund_user_id', undefined);
                      form.setValue('user_fund_id', undefined);
                      form.setValue('project_fund_id', undefined);
                      form.setValue('project_id', undefined);
                    }}
                    className="grid gap-3 md:grid-cols-3"
                  >
                    <label className="flex cursor-pointer items-center gap-1 rounded-md border border-border bg-card px-4 py-3 text-sm font-medium text-foreground transition-colors has-[:checked]:border-primary has-[:checked]:bg-accent">
                      <RadioGroupItem className="border-none !p-1" value={'App\\Models\\CompanyFundCurrency'} />
                      <span>صندوق الشركة</span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-1 rounded-md border border-border bg-card px-4 py-3 text-sm font-medium text-foreground transition-colors has-[:checked]:border-primary has-[:checked]:bg-accent">
                      <RadioGroupItem className="border-none !p-1" value={'App\\Models\\ProjectFundCurrency'} />
                      <span>صندوق المشروع</span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-1 rounded-md border border-border bg-card px-4 py-3 text-sm font-medium text-foreground transition-colors has-[:checked]:border-primary has-[:checked]:bg-accent">
                      <RadioGroupItem className="border-none !p-1" value={'App\\Models\\CurrencyFund'} />
                      <span>صندوق مستخدم</span>
                    </label>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {morphToType === 'App\\Models\\CompanyFundCurrency' && (
            <div className="grid gap-4 md:grid-cols-2 pt-2">
              <FormField
                control={form.control}
                name="company_fund_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>صناديق الشركة</FormLabel>
                    <Select
                      value={field.value ? String(field.value) : ''}
                      onValueChange={(val) => {
                        field.onChange(Number(val));
                        form.setValue('morph_to_id', undefined as any);
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
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="morph_to_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>عملة الصندوق</FormLabel>
                    <Select
                      value={field.value ? String(field.value) : ''}
                      onValueChange={(val) => field.onChange(Number(val))}
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
                        {(selectedCompanyFund?.currencies ?? []).map((currency) => {
                          const value = getCurrencyExpenseableId(currency);
                          return (
                            <SelectItem key={`${currency.id}-${value}`} value={String(value)}>
                              {getCurrencyLabel(currency)}
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
          )}

          {morphToType === 'App\\Models\\ProjectFundCurrency' && (
            <div className="grid gap-4 md:grid-cols-3 pt-2">
              <FormField
                control={form.control}
                name="project_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>المشروع</FormLabel>
                    <Select
                      value={field.value ? String(field.value) : ''}
                      onValueChange={(val) => {
                        field.onChange(Number(val));
                        form.setValue('project_fund_id', undefined);
                        form.setValue('morph_to_id', undefined as any);
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
                      onValueChange={(val) => {
                        field.onChange(Number(val));
                        form.setValue('morph_to_id', undefined as any);
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
                name="morph_to_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>عملة الصندوق</FormLabel>
                    <Select
                      value={field.value ? String(field.value) : ''}
                      onValueChange={(val) => field.onChange(Number(val))}
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
                        {selectedProjectFundCurrencies.map((currency) => {
                          const value = getCurrencyExpenseableId(currency);
                          return (
                            <SelectItem key={`${currency.id}-${value}`} value={String(value)}>
                              {getCurrencyLabel(currency)}
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
          )}

          {morphToType === 'App\\Models\\CurrencyFund' && (
            <div className="grid gap-4 md:grid-cols-4 pt-2">
              <FormField
                control={form.control}
                name="fund_user_role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نوع المستخدم</FormLabel>
                    <Select
                      value={field.value ?? ''}
                      onValueChange={(val) => {
                        field.onChange(val);
                        form.setValue('fund_user_id', undefined);
                        form.setValue('user_fund_id', undefined);
                        form.setValue('morph_to_id', undefined as any);
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
                      <SearchableSelect
                        value={field.value}
                        onValueChange={(val) => {
                          field.onChange(Number(val));
                          form.setValue('user_fund_id', undefined);
                          form.setValue('morph_to_id', undefined as any);
                        }}
                        disabled={!fundUserRole}
                        placeholder="اختر المستخدم"
                        options={fundRoleUsers.map((item) => ({
                          value: item.id,
                          label: item.user.name,
                        }))}
                      />
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
                    <Select
                      value={field.value ? String(field.value) : ''}
                      onValueChange={(val) => {
                        field.onChange(Number(val));
                        form.setValue('morph_to_id', undefined as any);
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
                name="morph_to_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>عملة الصندوق</FormLabel>
                    <Select
                      value={field.value ? String(field.value) : ''}
                      onValueChange={(val) => field.onChange(Number(val))}
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
                        {(selectedUserFund?.currencies ?? []).map((currency) => {
                          const value = getCurrencyExpenseableId(currency);
                          return (
                            <SelectItem key={`${currency.id}-${value}`} value={String(value)}>
                              {getCurrencyLabel(currency)}
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
          )}
        </div>

        <Button type="submit" className="w-full bg-slate-950 text-white" disabled={loading}>
          {loading ? 'جاري التحويل...' : 'تأكيد التحويل'}
        </Button>
      </form>
    </Form>
  );
}
