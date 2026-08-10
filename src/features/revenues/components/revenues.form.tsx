import { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { User, Wallet, Shield, TrendingUp, Hammer, BadgeCheck, HardHat, Truck, Lock, Plus } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/shared/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Textarea } from '@/shared/components/ui/textarea';
import { SearchableSelect } from '@/shared/components/ui/searchable-select';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { companyFundsApi } from '@/features/company-funds/company-funds.api';
import type { CompanyFund } from '@/features/company-funds/types';
import type { Fund } from '@/features/funds/types';
import { fundsApi } from '@/features/funds/funds.api';
import { projectsApi } from '@/features/projects/projects.api';
import type { Project } from '@/features/projects/types';
import { projectFundsApi } from '@/features/projects/project-funds/project-funds.api';
import type { ProjectFund } from '@/features/projects/project-funds/project-funds.types';
import { usersApi } from '@/features/users/api/users.api';
import type { UserRole } from '@/features/users/types';
import { revenueFormSchema, revenueSourceLabels, type RevenueFormValues, type RevenueFormInput } from '../schemas/revenues.schema';
import type { CreateRevenuePayload, Revenue, RevenueSource, RevenueableType } from '../types';

type RevenuesFormProps = {
  defaultValues?: Revenue | null;
  fixedValues?: {
    source?: RevenueSource;
    project_id?: number;
    project_fund_id?: number;
    user_id?: number;
    user_fund_id?: number;
    company_fund_id?: number;
    fund_user_role?: string;
  };
  onSubmit: (data: CreateRevenuePayload) => Promise<void>;
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

const roleIcons: Record<UserRole, React.ElementType> = {
  admin: Shield,
  client: User,
  investor: TrendingUp,
  craftsman: Hammer,
  employee: BadgeCheck,
  engineer: HardHat,
  supplier: Truck,
  trustee: Lock,
};

function formatNumberWithCommas(value: unknown): string {
  if (value === undefined || value === null || value === '' || Number.isNaN(value)) return '';
  const str = String(value).replace(/,/g, '');
  const parts = str.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
}

const sourceToRevenueableType: Record<RevenueSource, RevenueableType> = {
  company_fund: 'App\\Models\\CompanyFundCurrency',
  user_fund: 'App\\Models\\CurrencyFund',
  project_fund: 'App\\Models\\ProjectFundCurrency',
};

function getSourceFromType(type?: string): RevenueSource {
  if (type === 'App\\Models\\ProjectFundCurrency') return 'project_fund';
  if (type === 'App\\Models\\CompanyFundCurrency') return 'company_fund';
  return 'user_fund';
}

function getFundLabel(item: FundLabelSource) {
  return item.user?.name ?? item.name;
}

function getCompanyFundLabel(item: CompanyFund) {
  return item.name;
}

function getCurrencyRevenueableId(currency: { id: number; revenueable_id?: number; expenseable_id?: number; pivot?: { id: number } }) {
  return currency.revenueable_id ?? currency.expenseable_id ?? currency.pivot?.id ?? currency.id;
}

function currencyMatchesRevenueableId(
  currency: { id: number; revenueable_id?: number; expenseable_id?: number; pivot?: { id: number } },
  revenueableId: number,
) {
  return getCurrencyRevenueableId(currency) === revenueableId;
}

function getCurrencyLabel(currency: { currency: string; balance: string }) {
  return `${currency.currency} - ${currency.balance}`;
}

function getRoleLabel(role: UserRole | '') {
  return role ? roleLabels[role] : '';
}

export function RevenuesForm({ defaultValues, fixedValues, onSubmit, loading }: RevenuesFormProps) {
  const defaultReceiver = defaultValues?.received_by;
  const defaultReceiverId = typeof defaultReceiver === 'object'
    ? Number(defaultReceiver.user?.id ?? defaultReceiver.id ?? 0) || undefined
    : Number(defaultReceiver ?? 0) || undefined;
  const [assignReceiver, setAssignReceiver] = useState(() => Boolean(defaultReceiverId));
  const receiverRoleCandidates = [
    defaultValues?.received_by_role,
    typeof defaultReceiver === 'object' ? defaultReceiver.user?.role : undefined,
    typeof defaultReceiver === 'object' ? defaultReceiver.user?.role_type : undefined,
    typeof defaultReceiver === 'object' ? defaultReceiver.role : undefined,
    typeof defaultReceiver === 'object' ? defaultReceiver.role_type : undefined,
  ];
  const defaultReceiverRole = receiverRoleCandidates.find(
    (role): role is UserRole => userRoles.includes(role as UserRole)
  ) ?? '';

  const form = useForm<RevenueFormInput, any, RevenueFormValues>({
    resolver: zodResolver(revenueFormSchema),
    defaultValues: {
      source: fixedValues?.source ?? (defaultValues ? getSourceFromType(defaultValues.revenueable_type) : 'company_fund'),
      revenueable_type: defaultValues?.revenueable_type ?? sourceToRevenueableType[fixedValues?.source ?? 'company_fund'],
      revenueable_id: defaultValues?.revenueable_id ? Number(defaultValues.revenueable_id) : undefined,
      company_fund_id: fixedValues?.company_fund_id ?? undefined,
      user_role: defaultValues?.user_role ?? ((defaultValues as any)?.user?.role_type) ?? '',
      user_id: defaultValues?.user_id ? Number(defaultValues.user_id) : ((defaultValues as any)?.user?.id ? Number((defaultValues as any).user.id) : (fixedValues?.user_id ?? undefined)),
      received_by_role: defaultReceiverRole,
      received_by: defaultReceiverId,
      fund_user_role: fixedValues?.fund_user_role ?? (defaultValues?.revenueable_info?.user_info as any)?.role_type ?? (defaultValues?.revenueable_info?.user_info as any)?.role ?? '',
      fund_user_id: (defaultValues?.revenueable_info?.user_info as any)?.user_id ?? (defaultValues?.revenueable_info?.user_info as any)?.id ?? fixedValues?.user_id ?? undefined,
      user_fund_id: defaultValues?.revenueable_info?.details?.fund_id ?? defaultValues?.revenueable_info?.details?.fund?.id ?? fixedValues?.user_fund_id ?? undefined,
      project_fund_id: fixedValues?.project_fund_id ?? undefined,
      project_id: fixedValues?.project_id ?? undefined,
      statement: defaultValues?.statement ?? '',
      amount: defaultValues ? Number(defaultValues.amount ?? 0) : '' as any,
      is_posted: Boolean(defaultValues?.is_posted ?? true),
      // received_by: defaultValues?.received_by ? Number(defaultValues.received_by) : 1,
    },
  });

  const source = form.watch('source') as RevenueSource;
  const companyFundId = form.watch('company_fund_id') as number | undefined;
  const selectedRevenueableId = form.watch('revenueable_id') as number | undefined;
  const fundUserRole = form.watch('fund_user_role') as UserRole | '';
  const fundUserId = form.watch('fund_user_id') as number | undefined;
  const userFundId = form.watch('user_fund_id') as number | undefined;
  const projectFundId = form.watch('project_fund_id') as number | undefined;
  const selectedProjectId = form.watch('project_id') as number | undefined;
  const receivedByRole = form.watch('received_by_role') as UserRole | '';

  const companyFundsQuery = useQuery({
    queryKey: ['revenues', 'company-funds'] as const,
    queryFn: () => companyFundsApi.getCompanyFunds(),
    enabled: source === 'company_fund',
  });
  const companyFunds: CompanyFund[] = companyFundsQuery.data?.data ?? (Array.isArray(companyFundsQuery.data) ? companyFundsQuery.data : []);

  const derivedCompanyFundId = useMemo(() => {
    if (companyFundId) return companyFundId;
    if (!selectedRevenueableId) return undefined;
    return companyFunds.find((fund: CompanyFund) => fund.currencies?.some((currency: any) => currencyMatchesRevenueableId(currency, selectedRevenueableId)))?.id;
  }, [companyFundId, companyFunds, selectedRevenueableId]);

  useEffect(() => {
    if (source === 'company_fund' && !companyFundId && derivedCompanyFundId) {
      form.setValue('company_fund_id', derivedCompanyFundId);
    }
  }, [companyFundId, derivedCompanyFundId, form, source]);

  const { data: selectedCompanyFund } = useQuery<CompanyFund | null>({
    queryKey: ['revenues', 'company-fund', derivedCompanyFundId] as const,
    queryFn: async () => {
      if (!derivedCompanyFundId) return null;
      return companyFundsApi.getCompanyFundById(derivedCompanyFundId);
    },
    enabled: source === 'company_fund' && Boolean(derivedCompanyFundId),
  });

  const projectsQuery = useQuery({
    queryKey: ['revenues', 'projects'] as const,
    queryFn: () => projectsApi.getProjects(),
    enabled: source === 'project_fund' && !fixedValues?.project_id,
  });
  const projects: Project[] = projectsQuery.data?.data ?? (Array.isArray(projectsQuery.data) ? projectsQuery.data : []);

  const allProjectFundsQuery = useQuery<ProjectFund[]>({
    queryKey: ['revenues', 'project-funds', fixedValues?.project_id] as const,
    queryFn: async () => (await projectFundsApi.getProjectFunds({ projectId: fixedValues?.project_id, perPage: 1000 })).data,
    enabled: source === 'project_fund',
  });
  const allProjectFunds = allProjectFundsQuery.data ?? [];

  const fundRoleUsersQuery = useQuery<RoleUser[]>({
    queryKey: ['revenues', 'fund-role-users', fundUserRole] as const,
    queryFn: async () => {
      if (!fundUserRole) return [];
      const res = await usersApi.getUsersByRole(fundUserRole);
      const list = (res as any)?.data ?? res;
      return list as RoleUser[];
    },
    enabled: source === 'user_fund' && Boolean(fundUserRole),
  });
  const fundRoleUsers = fundRoleUsersQuery.data ?? [];

  const receiverRoleUsersQuery = useQuery<RoleUser[]>({
    queryKey: ['revenues', 'receiver-role-users', receivedByRole] as const,
    queryFn: async () => {
      if (!receivedByRole) return [];
      const res = await usersApi.getUsersByRole(receivedByRole);
      const list = (res as any)?.data ?? res;
      return list as RoleUser[];
    },
    enabled: assignReceiver && Boolean(receivedByRole),
  });
  const receiverRoleUsers = receiverRoleUsersQuery.data ?? [];

  const receiverRoleDetectionQuery = useQuery<UserRole | ''>({
    queryKey: ['revenues', 'detect-receiver-role', defaultReceiverId] as const,
    queryFn: async () => {
      if (!defaultReceiverId) return '';
      const results = await Promise.all(
        userRoles.map(async (role) => ({ role, response: await usersApi.getUsersByRole(role, 1, 1000) })),
      );
      return results.find(({ response }) =>
        response.data.some((record: any) =>
          Number(record.user?.id ?? record.id) === defaultReceiverId
        )
      )?.role ?? '';
    },
    enabled: assignReceiver && Boolean(defaultReceiverId) && !Boolean(receivedByRole),
  });

  useEffect(() => {
    if (!receivedByRole && receiverRoleDetectionQuery.data) {
      form.setValue('received_by_role', receiverRoleDetectionQuery.data);
      form.setValue('received_by', defaultReceiverId);
    }
  }, [defaultReceiverId, form, receivedByRole, receiverRoleDetectionQuery.data]);

  const fundUserRecordQuery = useQuery<FundUserRecord | null>({
    queryKey: ['revenues', 'fund-user-record', fundUserRole, fundUserId] as const,
    queryFn: async () => {
      if (!fundUserRole || !fundUserId) return null;
      const roleRecordId = fundRoleUsers.find((record) => record.user.id === fundUserId)?.id ?? fundUserId;
      const user = await usersApi.getUserByRole(fundUserRole, roleRecordId);
      return user as FundUserRecord;
    },
    enabled: source === 'user_fund' && Boolean(fundUserRole) && Boolean(fundUserId),
  });
  const selectedFundUserRecord = fundUserRecordQuery.data;

  const projectFunds = useMemo(() => {
    if (source !== 'project_fund' || !selectedProjectId) return [];
    return allProjectFunds.filter((fund) => fund.project.id === selectedProjectId);
  }, [allProjectFunds, selectedProjectId, source]);

  const derivedProjectFundId = useMemo(() => {
    if (projectFundId) return projectFundId;
    if (!selectedRevenueableId) return undefined;
    return allProjectFunds.find((fund) =>
      fund.currencies?.some((currency) => currencyMatchesRevenueableId(currency, selectedRevenueableId)),
    )?.id;
  }, [projectFundId, allProjectFunds, selectedRevenueableId]);

  const derivedProjectId = useMemo(() => {
    if (selectedProjectId) return selectedProjectId;
    if (!derivedProjectFundId) return undefined;
    return allProjectFunds.find((fund) => fund.id === derivedProjectFundId)?.project?.id;
  }, [selectedProjectId, derivedProjectFundId, allProjectFunds]);

  useEffect(() => {
    if (source === 'project_fund') {
      if (!projectFundId && derivedProjectFundId) {
        form.setValue('project_fund_id', derivedProjectFundId);
      }
      if (!selectedProjectId && derivedProjectId) {
        form.setValue('project_id', derivedProjectId);
      }
    }
  }, [derivedProjectFundId, derivedProjectId, form, projectFundId, selectedProjectId, source]);

  const { data: allUserFunds = [] } = useQuery<Fund[]>({
    queryKey: ['revenues', 'all-user-funds'] as const,
    queryFn: async () => (await fundsApi.getFunds({ perPage: 1000 })).data,
    enabled: source === 'user_fund' && Boolean(fundUserId || userFundId || defaultValues?.id),
  });

  const derivedUserFundId = useMemo(() => {
    if (userFundId) return userFundId;
    if (!selectedRevenueableId) return undefined;
    return allUserFunds.find((fund) =>
      fund.currencies?.some((currency) => currencyMatchesRevenueableId(currency, selectedRevenueableId)),
    )?.id;
  }, [selectedRevenueableId, allUserFunds, userFundId]);

  const derivedFundUserId = useMemo(() => {
    if (fundUserId) return fundUserId;
    if (!derivedUserFundId) return undefined;
    return allUserFunds.find((fund) => fund.id === derivedUserFundId)?.user?.id;
  }, [derivedUserFundId, fundUserId, allUserFunds]);

  useEffect(() => {
    if (source === 'user_fund') {
      if (!userFundId && derivedUserFundId) {
        form.setValue('user_fund_id', derivedUserFundId);
      }
      if (!fundUserId && derivedFundUserId) {
        form.setValue('fund_user_id', derivedFundUserId);
      }
    }
  }, [derivedUserFundId, derivedFundUserId, form, source, userFundId, fundUserId]);

  const { data: selectedProjectFund } = useQuery<ProjectFund | null>({
    queryKey: ['revenues', 'project-fund', derivedProjectFundId] as const,
    queryFn: async () => {
      if (!derivedProjectFundId) return null;
      return projectFundsApi.getProjectFundById(derivedProjectFundId);
    },
    enabled: source === 'project_fund' && Boolean(derivedProjectFundId),
  });

  const receiverOptions = useMemo(() => {
    const options = receiverRoleUsers.map(ru => ({ value: ru.user.id, label: ru.user.name }));
    if (defaultReceiverId && !options.some(o => o.value === defaultReceiverId)) {
      const val = typeof defaultReceiver === 'object'
        ? defaultReceiver.user?.name ?? defaultReceiver.name ?? `مستلم ${defaultReceiverId}`
        : `مستلم ${defaultReceiverId}`;
      options.push({ value: defaultReceiverId, label: val });
    }
    return options;
  }, [receiverRoleUsers, defaultReceiver, defaultReceiverId]);

  const fundUserOptions = fundRoleUsers.map(ru => ({ value: ru.user.id, label: ru.user.name }));

  // Options for currencies
  const toCurrencyOption = (currency: { id: number; currency: string; balance: string; revenueable_id?: number; expenseable_id?: number; pivot?: { id: number } }) => ({
    value: getCurrencyRevenueableId(currency),
    label: getCurrencyLabel(currency),
    className: Number(currency.balance) > 0 ? 'font-semibold text-success' : 'font-semibold text-destructive',
  });
  const companyCurrencyOptions = (companyFunds.find(f => f.id === derivedCompanyFundId)?.currencies || selectedCompanyFund?.currencies)?.map(toCurrencyOption) || [];
  const projectCurrencyOptions = (allProjectFunds.find(f => f.id === derivedProjectFundId)?.currencies || selectedProjectFund?.currencies)?.map(toCurrencyOption) || [];
  const userCurrencyOptions = (selectedFundUserRecord?.user.funds?.find(f => f.id === derivedUserFundId) || allUserFunds.find(f => f.id === derivedUserFundId))?.currencies?.map(toCurrencyOption) || [];

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
    const options = source === 'company_fund' ? companyCurrencyOptions
      : source === 'project_fund' ? projectCurrencyOptions
        : userCurrencyOptions;

    if (options.length === 1 && !selectedRevenueableId) {
      form.setValue('revenueable_id', options[0].value);
    }
  }, [source, companyCurrencyOptions, projectCurrencyOptions, userCurrencyOptions, selectedRevenueableId, form]);

  const amountField = (
    <FormField
      control={form.control}
      name="amount"
      render={({ field }) => (
        <FormItem>
          <FormLabel>المبلغ</FormLabel>
          <FormControl>
            <Input
              className="h-11 bg-white pl-4"
              type="text"
              inputMode="decimal"
              value={formatNumberWithCommas(field.value)}
              onChange={(e) => {
                const raw = e.target.value.replace(/,/g, '');
                if (/^\d*\.?\d*$/.test(raw)) field.onChange(raw === '' ? '' : Number(raw));
              }}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  const currencyField = (
    <FormField
      control={form.control}
      name="revenueable_id"
      render={({ field }) => (
        <FormItem>
          <FormLabel>عملة الصندوق</FormLabel>
          <FormControl>
            <SearchableSelect
              disabled={
                (source === 'company_fund' && !derivedCompanyFundId) ||
                (source === 'project_fund' && !derivedProjectFundId) ||
                (source === 'user_fund' && !derivedUserFundId)
              }
              options={
                source === 'company_fund' ? companyCurrencyOptions :
                  source === 'project_fund' ? projectCurrencyOptions :
                    userCurrencyOptions
              }
              value={field.value}
              onValueChange={field.onChange}
              placeholder="اختر العملة..."
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  return (
    <Form {...form}>
      <form
        className="space-y-3"
        onSubmit={form.handleSubmit(
          async (values) => {
            await onSubmit({
              revenueable_type: (values.revenueable_type ?? sourceToRevenueableType[values.source]) as RevenueableType,
              revenueable_id: values.revenueable_id ?? 0,
              statement: values.statement,
              amount: values.amount,
              is_posted: values.is_posted,
              user_id: values.user_id ?? 1,
              ...(assignReceiver && values.received_by ? { received_by: values.received_by } : {}),
            });
          },
          (errors) => {
            console.error('Validation Errors:', errors);
            toast.error('الرجاء التأكد من تعبئة جميع الحقول المطلوبة بشكل صحيح.');
          }
        )}
      >
        {!fixedValues?.source && (
          <div>
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
                        const nextSource = value as RevenueSource;
                        const nextRevenueableType: RevenueableType = sourceToRevenueableType[nextSource];
                        field.onChange(nextSource);
                        form.setValue('revenueable_type', nextRevenueableType);
                        form.setValue('revenueable_id', undefined);
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
                      {(Object.keys(revenueSourceLabels) as RevenueSource[]).map((item) => (
                        <label
                          key={item}
                          className="flex cursor-pointer items-center gap-1 rounded-md border border-border bg-card px-4 py-3 text-sm font-medium text-foreground transition-colors has-[:checked]:border-primary has-[:checked]:bg-accent"
                        >
                          <RadioGroupItem className="border-none !p-1" value={item} />
                          <span>{revenueSourceLabels[item]}</span>
                        </label>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* User Fund Fields */}
        {source === 'user_fund' && !fixedValues?.user_fund_id && (
          <div className="space-y-4 rounded-lg border border-border bg-muted/40 p-4">
            <p className="text-sm font-semibold text-foreground">صندوق المستخدم</p>

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
                        form.setValue('revenueable_id', undefined);
                      }}
                    >
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="اختر نوع المستخدم">
                            {field.value ? (
                              <div className="flex items-center gap-2">
                                {(() => {
                                  const Icon = roleIcons[field.value as UserRole] || User;
                                  return <Icon className="size-4 text-slate-500" />;
                                })()}
                                <span>{getRoleLabel(field.value as UserRole)}</span>
                              </div>
                            ) : null}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {userRoles.map((role) => {
                          const Icon = roleIcons[role] || User;
                          return (
                            <SelectItem key={role} value={role}>
                              <div className="flex items-center gap-2">
                                <Icon className="size-4 text-slate-500" />
                                <span>{roleLabels[role]}</span>
                              </div>
                            </SelectItem>
                          );
                        })}
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
                        <Skeleton className="h-11 w-full" />
                      ) : (
                        <SearchableSelect
                          disabled={!fundUserRole}
                          options={fundUserOptions}
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value);
                            form.setValue('user_fund_id', undefined);
                            form.setValue('revenueable_id', undefined);
                          }}
                          placeholder="اختر المستخدم..."
                          className="bg-white"
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
                      <Skeleton className="h-11 w-full" />
                    ) : (
                      <Select
                        value={field.value ? String(field.value) : ''}
                        onValueChange={(value) => {
                          field.onChange(Number(value));
                          form.setValue('revenueable_id', undefined);
                        }}
                        disabled={!fundUserId}
                      >
                        <FormControl>
                          <SelectTrigger className="h-11 bg-white">
                            <SelectValue placeholder="اختر صندوق المستخدم">
                              {field.value ? (
                                <span>
                                  {selectedFundUserRecord?.user.funds?.find((f) => f.id === field.value)?.name ?? allUserFunds.find(f => f.id === field.value)?.name ?? ''}
                                </span>
                              ) : null}
                            </SelectValue>
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
            </div>
          </div>
        )}


        {/* Receiver Fields (المستلم) */}
        <div className={assignReceiver ? 'space-y-4 px-2' : 'hidden'}>
          <h3 className="font-semibold text-slate-800">تفاصيل المستلم</h3>
          <div className="grid gap-4 md:grid-cols-2 items-start">
            <FormField
              control={form.control}
              name="received_by_role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>نوع المستلم</FormLabel>
                  <Select
                    onValueChange={(val) => {
                      field.onChange(val);
                      form.setValue('received_by', undefined);
                    }}
                    value={field.value ?? ''}
                  >
                    <FormControl>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="اختر نوع المستلم">
                          {field.value ? (
                            <div className="flex items-center gap-2">
                              {(() => {
                                const Icon = roleIcons[field.value as UserRole] || User;
                                return <Icon className="size-4 text-slate-500" />;
                              })()}
                              <span>{getRoleLabel(field.value as UserRole)}</span>
                            </div>
                          ) : null}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {userRoles.map((role) => {
                        const Icon = roleIcons[role] || User;
                        return (
                          <SelectItem key={role} value={role}>
                            <div className="flex items-center gap-2">
                              <Icon className="size-4 text-slate-500" />
                              <span>{roleLabels[role]}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="received_by"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="mb-1">المستلم</FormLabel>
                  <SearchableSelect
                    options={receiverOptions}
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder="اختر المستلم..."
                    disabled={!receivedByRole}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>



        {/* Fund Selection and Money Fields */}
        <div className="space-y-4">
          <div className={`grid items-start gap-4 ${source === 'company_fund'
            ? (fixedValues?.company_fund_id ? 'md:grid-cols-2' : 'md:grid-cols-3')
            : source === 'project_fund'
              ? (fixedValues?.project_fund_id ? 'md:grid-cols-2' : 'md:grid-cols-4')
              : 'md:grid-cols-2'
            }`}>
            {source === 'company_fund' && !fixedValues?.company_fund_id && (
              <FormField
                control={form.control}
                name="company_fund_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>صندوق الشركة</FormLabel>
                    {companyFundsQuery.isLoading ? (
                      <Skeleton className="h-11 w-full" />
                    ) : (
                      <Select
                        value={field.value ? String(field.value) : ''}
                        onValueChange={(value) => {
                          field.onChange(Number(value));
                          form.setValue('revenueable_id', undefined);
                        }}
                      >
                        <FormControl>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="اختر صندوق الشركة">
                              {field.value ? (
                                <div className="flex items-center gap-2">
                                  <Wallet className="size-4 text-slate-500" />
                                  <span>{companyFunds.find((f: any) => f.id === field.value)?.name ?? ''}</span>
                                </div>
                              ) : null}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {companyFunds.map((fund: any) => (
                            <SelectItem key={fund.id} value={String(fund.id)}>
                              <div className="flex items-center gap-2">
                                <Wallet className="size-4 text-slate-500" />
                                <span>{getCompanyFundLabel(fund)}</span>
                              </div>
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

            {source === 'project_fund' && (
              <div className="contents">
                {!fixedValues?.project_id && (
                  <FormField
                    control={form.control}
                    name="project_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>المشروع</FormLabel>
                        {projectsQuery.isLoading ? (
                          <Skeleton className="h-11 w-full" />
                        ) : (
                          <Select
                            value={field.value ? String(field.value) : ''}
                            onValueChange={(value) => {
                              field.onChange(Number(value));
                              form.setValue('project_fund_id', undefined);
                              form.setValue('revenueable_id', undefined);
                            }}
                          >
                            <FormControl>
                              <SelectTrigger className="h-11">
                                <SelectValue placeholder="اختر المشروع">
                                  {field.value ? (
                                    <span>{projects.find((p: any) => p.id === field.value)?.name ?? ''}</span>
                                  ) : null}
                                </SelectValue>
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {projects.map((project: any) => (
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
                        {allProjectFundsQuery.isLoading ? (
                          <Skeleton className="h-11 w-full" />
                        ) : (
                          <Select
                            value={field.value ? String(field.value) : ''}
                            onValueChange={(value) => {
                              field.onChange(Number(value));
                              form.setValue('revenueable_id', undefined);
                            }}
                            disabled={!selectedProjectId}
                          >
                            <FormControl>
                              <SelectTrigger className="h-11">
                                <SelectValue placeholder="اختر صندوق المشروع">
                                  {field.value ? (
                                    <span>{projectFunds.find(f => f.id === field.value)?.name ?? ''}</span>
                                  ) : null}
                                </SelectValue>
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
              </div>
            )}

            <div className={(source === 'project_fund' || source === 'company_fund') && !fixedValues?.source ? 'contents' : 'grid gap-4 md:col-span-full md:grid-cols-2'}>
              {fixedValues?.source ? <>{amountField}{currencyField}</> : <>{currencyField}{amountField}</>}
            </div>

            <FormField
              control={form.control}
              name="statement"
              render={({ field }) => (
                <FormItem className="md:col-span-full">
                  <FormLabel>البيان</FormLabel>
                  <FormControl>
                    <Textarea className="resize-none" rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 px-2 pt-2">
          <button
            type="button"
            role="switch"
            aria-checked={assignReceiver}
            onClick={() => {
              const next = !assignReceiver;
              setAssignReceiver(next);
              if (!next) {
                form.setValue('received_by_role', '');
                form.setValue('received_by', undefined);
                form.clearErrors(['received_by_role', 'received_by']);
              }
            }}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${assignReceiver ? 'bg-primary' : 'bg-muted-foreground/30'}`}
          >
            <span className={`absolute top-0.5 size-5 rounded-full border border-border bg-white shadow-sm transition-all ${assignReceiver ? 'start-[22px]' : 'start-0.5'}`} />
          </button>
          <div>
            <p className="text-sm font-medium">ربط الإيراد بمستلم</p>
            <p className="text-xs text-muted-foreground">فعّل هذا الخيار إذا كان الإيراد مرتبطًا بمستلم محدد.</p>
          </div>
        </div>

        <FormField
          control={form.control}
          name="is_posted"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md bg-muted/10 rtl:space-x-reverse">
              <FormControl>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                  />
                  <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white rtl:peer-checked:after:-translate-x-full"></div>
                </label>
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="text-sm font-medium text-slate-700 cursor-pointer">
                  مرحل (إرسال الإيراد للصندوق المباشر)
                </FormLabel>
              </div>
            </FormItem>
          )}
        />

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="submit" disabled={loading}>
            <Plus className="size-6" />
            {loading
              ? (defaultValues?.id ? 'جاري التحديث...' : 'جاري الإضافة...')
              : (defaultValues?.id ? 'تحديث الإيراد' : 'إضافة')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
