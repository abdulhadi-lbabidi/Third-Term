import { useEffect, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { User, Wallet, UserCircle, Briefcase, FileText, CheckCircle2, Shield, TrendingUp, Hammer, BadgeCheck, HardHat, Truck, Lock } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Textarea } from '@/shared/components/ui/textarea';
import { SearchableSelect } from '@/shared/components/ui/searchable-select';
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
  };
  onSubmit: (data: CreateRevenuePayload) => Promise<void>;
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

const sourceToRevenueableType: Record<RevenueSource, RevenueableType> = {
  company_fund: 'App\\Models\\CompanyFundCurrency',
  user_fund: 'App\\Models\\CurrencyFund',
  project_fund: 'App\\Models\\ProjectFundCurrency',
};

function getSourceFromType(type?: string): RevenueSource {
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

export function RevenuesForm({ defaultValues, fixedValues, onSubmit, loading }: RevenuesFormProps) {
  const form = useForm<RevenueFormInput, any, RevenueFormValues>({
    resolver: zodResolver(revenueFormSchema),
    defaultValues: {
      source: fixedValues?.source ?? getSourceFromType(defaultValues?.revenueable_type),
      revenueable_type: defaultValues?.revenueable_type ?? (fixedValues?.source ? sourceToRevenueableType[fixedValues.source] : sourceToRevenueableType.company_fund),
      revenueable_id: defaultValues?.revenueable_id ? Number(defaultValues.revenueable_id) : undefined,
      company_fund_id: undefined,
      user_role: defaultValues?.user_role ?? '',
      user_id: defaultValues?.user_id ? Number(defaultValues.user_id) : ((defaultValues as any)?.user?.id ? Number((defaultValues as any).user.id) : undefined),
      received_by: (() => {
        if (!defaultValues?.received_by) return undefined;
        const val = typeof defaultValues.received_by === 'object'
          ? (defaultValues.received_by as any).id
          : defaultValues.received_by;
        const num = Number(val);
        return Number.isNaN(num) ? undefined : num;
      })(),
      fund_user_role: '',
      fund_user_id: undefined,
      user_fund_id: undefined,
      project_fund_id: fixedValues?.project_fund_id ?? undefined,
      project_id: fixedValues?.project_id ?? undefined,
      statement: defaultValues?.statement ?? '',
      amount: Number(defaultValues?.amount ?? 0),
      is_posted: Boolean(defaultValues?.is_posted ?? true),
      // received_by: defaultValues?.received_by ? Number(defaultValues.received_by) : 1,
    },
  });

  const source = form.watch('source') as RevenueSource;
  const companyFundId = form.watch('company_fund_id') as number | undefined;
  const selectedRevenueableId = form.watch('revenueable_id') as number | undefined;
  const userRole = form.watch('user_role') as UserRole | '';
  const fundUserRole = form.watch('fund_user_role') as UserRole | '';
  const fundUserId = form.watch('fund_user_id') as number | undefined;
  const userFundId = form.watch('user_fund_id') as number | undefined;
  const projectFundId = form.watch('project_fund_id') as number | undefined;
  const selectedProjectId = form.watch('project_id') as number | undefined;

  const { data: companyFunds = [] } = useQuery<CompanyFund[]>({
    queryKey: ['revenues', 'company-funds'] as const,
    queryFn: () => companyFundsApi.getCompanyFunds(),
    enabled: source === 'company_fund',
  });

  const derivedCompanyFundId = useMemo(() => {
    if (companyFundId) return companyFundId;
    if (!selectedRevenueableId) return undefined;
    return companyFunds.find((fund) => fund.currencies?.some((currency) => currency.id === selectedRevenueableId))?.id;
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

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['revenues', 'projects'] as const,
    queryFn: () => projectsApi.getProjects(),
    enabled: source === 'project_fund',
  });

  const { data: allProjectFunds = [] } = useQuery<ProjectFund[]>({
    queryKey: ['revenues', 'project-funds'] as const,
    queryFn: () => projectFundsApi.getProjectFunds(),
    enabled: source === 'project_fund',
  });

  const { data: roleUsers = [] } = useQuery<RoleUser[]>({
    queryKey: ['revenues', 'role-users', userRole] as const,
    queryFn: async () => {
      if (!userRole) return [];
      const users = await usersApi.getUsersByRole(userRole);
      return users as RoleUser[];
    },
    enabled: Boolean(userRole),
  });

  const { data: fundRoleUsers = [] } = useQuery<RoleUser[]>({
    queryKey: ['revenues', 'fund-role-users', fundUserRole] as const,
    queryFn: async () => {
      if (!fundUserRole) return [];
      const users = await usersApi.getUsersByRole(fundUserRole);
      return users as RoleUser[];
    },
    enabled: source === 'user_fund' && Boolean(fundUserRole),
  });

  const { data: selectedFundUserRecord } = useQuery<FundUserRecord | null>({
    queryKey: ['revenues', 'fund-user-record', fundUserRole, fundUserId] as const,
    queryFn: async () => {
      if (!fundUserRole || !fundUserId) return null;
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
    if (projectFundId) return projectFundId;
    if (!selectedRevenueableId) return undefined;
    return allProjectFunds.find((fund) =>
      fund.currencies?.some((currency) => currency.id === selectedRevenueableId),
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
    queryFn: () => fundsApi.getFunds(),
    enabled: source === 'user_fund',
  });

  const derivedUserFundId = useMemo(() => {
    if (userFundId) return userFundId;
    if (!selectedRevenueableId) return undefined;
    return allUserFunds.find((fund) =>
      fund.currencies?.some((currency) => currency.id === selectedRevenueableId),
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

  // Mapped options for searchable select
  const userOptions = useMemo(() => {
    const options = roleUsers.map(ru => ({ value: ru.user.id, label: ru.user.name }));
    if (defaultValues?.user_id && !options.some(o => o.value === defaultValues.user_id)) {
      const name = (defaultValues as any).user?.name ?? `مستخدم ${defaultValues.user_id}`;
      options.push({ value: defaultValues.user_id, label: name });
    }
    return options;
  }, [roleUsers, defaultValues]);

  const fundUserOptions = fundRoleUsers.map(ru => ({ value: ru.user.id, label: ru.user.name }));

  // Options for currencies
  const companyCurrencyOptions = selectedCompanyFund?.currencies?.map(c => ({ value: c.id, label: getCurrencyLabel(c) })) || [];
  const projectCurrencyOptions = selectedProjectFund?.currencies?.map(c => ({ value: c.id, label: getCurrencyLabel(c) })) || [];
  const userCurrencyOptions = (selectedFundUserRecord?.user.funds?.find(f => f.id === derivedUserFundId) || allUserFunds.find(f => f.id === derivedUserFundId))?.currencies?.map(c => ({ value: c.id, label: getCurrencyLabel(c) })) || [];

  return (
    <Form {...form}>
      <form
        className="space-y-6"
        onSubmit={form.handleSubmit(
          async (values) => {
            await onSubmit({
              revenueable_type: (values.revenueable_type ?? sourceToRevenueableType[values.source]) as RevenueableType,
              revenueable_id: values.revenueable_id ?? 0,
              statement: values.statement,
              amount: values.amount,
              is_posted: values.is_posted,
              user_id: values.user_id ?? 1,
              received_by: values.received_by ?? 1,
            });
          },
          (errors) => {
            console.error('Validation Errors:', errors);
            toast.error('الرجاء التأكد من تعبئة جميع الحقول المطلوبة بشكل صحيح.');
          }
        )}
      >
        {!fixedValues?.source && (
          <div className="grid gap-4 md:grid-cols-2">
            {/* Fund Type as Select */}
            <FormField
              control={form.control}
              name="source"
              render={({ field }) => (
                <FormItem className="col-span-full">
                  <FormLabel>نوع الصندوق</FormLabel>
                  <Select
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
                  >
                    <FormControl>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="اختر نوع الصندوق">
                          {field.value && (
                            <div className="flex items-center gap-2">
                              {field.value === 'company_fund' && <Briefcase className="size-4" />}
                              {field.value === 'user_fund' && <UserCircle className="size-4" />}
                              {field.value === 'project_fund' && <FileText className="size-4" />}
                              <span>{revenueSourceLabels[field.value as RevenueSource]}</span>
                            </div>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(Object.keys(revenueSourceLabels) as RevenueSource[]).map((item) => (
                        <SelectItem key={item} value={item}>
                          <div className="flex items-center gap-2">
                            {item === 'company_fund' && <Briefcase className="size-4" />}
                            {item === 'user_fund' && <UserCircle className="size-4" />}
                            {item === 'project_fund' && <FileText className="size-4" />}
                            <span>{revenueSourceLabels[item]}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* User Fund Fields */}
        {source === 'user_fund' && (
          <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-800">صندوق المستخدم</h3>

            <div className="grid gap-4 md:grid-cols-2">
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
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="user_fund_id"
                render={({ field }) => (
                  <FormItem className="col-span-full">
                    <FormLabel>صندوق المستخدم</FormLabel>
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}

        {/* Auth User Fields */}
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-slate-800">تفاصيل المستلم (آمر التأكيد)</h3>
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
              name="user_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>المستخدم</FormLabel>
                  <FormControl>
                    <SearchableSelect
                      disabled={!userRole && !defaultValues?.user_id}
                      options={userOptions}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="اختر المستخدم..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Fund Selection and Money Fields */}
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-slate-800">بيانات الإيراد</h3>
          <div className="grid gap-4">
            {source === 'company_fund' && (
              <FormField
                control={form.control}
                name="company_fund_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>صندوق الشركة</FormLabel>
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
                                <span>{companyFunds.find(f => f.id === field.value)?.name ?? ''}</span>
                              </div>
                            ) : null}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {companyFunds.map((fund) => (
                          <SelectItem key={fund.id} value={String(fund.id)}>
                            <div className="flex items-center gap-2">
                              <Wallet className="size-4 text-slate-500" />
                              <span>{getCompanyFundLabel(fund)}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {source === 'project_fund' && (
              <>
                {!fixedValues?.project_id && (
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
                            form.setValue('revenueable_id', undefined);
                          }}
                        >
                          <FormControl>
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="اختر المشروع">
                                {field.value ? (
                                  <span>{projects.find(p => p.id === field.value)?.name ?? ''}</span>
                                ) : null}
                              </SelectValue>
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
                )}

                {!fixedValues?.project_fund_id && (
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>المبلغ</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          className="h-11 bg-white pl-4"
                          type="number"
                          step="0.01"
                          min="0"
                          {...field}
                          value={field.value as string | number | undefined}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />

                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
            </div>

            <FormField
              control={form.control}
              name="statement"
              render={({ field }) => (
                <FormItem>
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

        {/* Switch and Submit at the bottom */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 mt-4">
          <FormField
            control={form.control}
            name="is_posted"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border-none rtl:space-x-reverse">
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
                    مرحل (إرسال الإيراد للصندوق المباشر)
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />

          <Button type="submit" className="h-11 bg-slate-950 text-white min-w-[140px] shadow-md hover:bg-slate-800" disabled={loading}>
            {loading ? 'جاري الحفظ...' : 'حفظ الإيراد'}
            <CheckCircle2 className="size-4 ml-2" />
          </Button>
        </div>
      </form>
    </Form>
  );
}
