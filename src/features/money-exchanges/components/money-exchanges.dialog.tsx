import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { SearchableSelect } from '@/shared/components/ui/searchable-select';
import { Skeleton } from '@/shared/components/ui/skeleton';

import { currenciesApi } from '@/features/currencies/currencies.api';
import { companyFundsApi } from '@/features/company-funds/company-funds.api';
import { projectsApi } from '@/features/projects/projects.api';
import { usersApi } from '@/features/users/api/users.api';
import type { UserRole } from '@/features/users/types';
import type { CompanyFund } from '@/features/company-funds/types';
import type { Project, ProjectFund } from '@/features/projects/types';
import type { Fund } from '@/features/funds/types';
import type { MoneyExchange } from '../types';

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
  trustee: 'الأمين',
};

const sourceToExchangeableType: Record<string, string> = {
  company_fund: 'App\\Models\\CompanyFundCurrency',
  project_fund: 'App\\Models\\ProjectFundCurrency',
  user_fund: 'App\\Models\\CurrencyFund',
};

const moneyExchangeFormSchema = z.object({
  source: z.enum(['company_fund', 'user_fund', 'project_fund'], {
    error: 'الرجاء اختيار نوع الصندوق',
  }),
  company_fund_id: z.string().optional(),
  project_id: z.string().optional(),
  project_fund_id: z.string().optional(),
  fund_user_role: z.string().optional(),
  fund_user_id: z.string().optional(),
  user_fund_id: z.string().optional(),
  from_currency: z.string().min(1, 'الرجاء اختيار العملة المصدر'),
  to_currency: z.string().min(1, 'الرجاء اختيار العملة الهدف'),
  amount: z.string().min(1, 'المبلغ مطلوب').refine((val) => !isNaN(Number(val.replace(/,/g, ''))) && Number(val.replace(/,/g, '')) > 0, 'المبلغ يجب أن يكون أكبر من الصفر'),
  exchange_rate: z.string().min(1, 'سعر التصريف مطلوب').refine((val) => !isNaN(Number(val.replace(/,/g, ''))) && Number(val.replace(/,/g, '')) > 0, 'سعر التصريف يجب أن يكون أكبر من الصفر'),
  operation: z.enum(['multiply', 'divide'], {
    error: 'الرجاء تحديد العملية',
  }),
}).refine((data) => data.from_currency !== data.to_currency, {
  message: 'يجب اختيار عملة هدف مختلفة عن عملة المصدر',
  path: ['to_currency'],
}).superRefine((values, ctx) => {
  const requireField = (condition: boolean, path: string, message: string) => {
    if (condition) ctx.addIssue({ code: 'custom', path: [path], message });
  };

  requireField(values.source === 'company_fund' && !values.company_fund_id, 'company_fund_id', 'الرجاء اختيار صندوق الشركة');
  requireField(values.source === 'user_fund' && !values.fund_user_role, 'fund_user_role', 'الرجاء اختيار نوع مستخدم الصندوق');
  requireField(values.source === 'user_fund' && !values.fund_user_id, 'fund_user_id', 'الرجاء اختيار مستخدم الصندوق');
  requireField(values.source === 'user_fund' && !values.user_fund_id, 'user_fund_id', 'الرجاء اختيار صندوق المستخدم');
  requireField(values.source === 'project_fund' && !values.project_id, 'project_id', 'الرجاء اختيار المشروع');
  requireField(values.source === 'project_fund' && !values.project_fund_id, 'project_fund_id', 'الرجاء اختيار صندوق المشروع');
});

type MoneyExchangeFormValues = z.infer<typeof moneyExchangeFormSchema>;

type MoneyExchangesDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: MoneyExchange | null;
  onSubmit: (values: {
    exchangeable_type: string;
    exchangeable_id: number;
    from_currency: number;
    to_currency: number;
    amount: number;
    exchange_rate: number;
    operation: 'multiply' | 'divide';
  }) => Promise<void>;
  loading?: boolean;
};

export function MoneyExchangesDialog({
  open,
  onOpenChange,
  defaultValues,
  onSubmit,
  loading,
}: MoneyExchangesDialogProps) {
  const form = useForm<MoneyExchangeFormValues>({
    resolver: zodResolver(moneyExchangeFormSchema),
    defaultValues: {
      source: 'company_fund',
      company_fund_id: '',
      project_id: '',
      project_fund_id: '',
      fund_user_role: '',
      fund_user_id: '',
      user_fund_id: '',
      from_currency: '',
      to_currency: '',
      amount: '',
      exchange_rate: '',
      operation: 'multiply',
    },
  });

  const source = form.watch('source');
  const companyFundId = form.watch('company_fund_id');
  const fundUserRole = form.watch('fund_user_role') as UserRole | '';
  const fundUserId = form.watch('fund_user_id');
  const selectedProjectId = form.watch('project_id');

  const currenciesQuery = useQuery({
    queryKey: ['currencies-dialog'] as const,
    queryFn: () => currenciesApi.getAll(1, 1000),
    enabled: open,
  });
  const allCurrencies = currenciesQuery.data?.data ?? [];

  const companyFundsQuery = useQuery({
    queryKey: ['money-exchanges-dialog', 'company-funds'] as const,
    queryFn: () => companyFundsApi.getCompanyFunds(),
    enabled: open && source === 'company_fund',
  });
  const companyFunds: CompanyFund[] = useMemo(() => {
    const list = companyFundsQuery.data?.data ?? (Array.isArray(companyFundsQuery.data) ? companyFundsQuery.data : []);
    return [...list].sort((a, b) => b.id - a.id);
  }, [companyFundsQuery.data]);

  const projectsQuery = useQuery({
    queryKey: ['money-exchanges-dialog', 'projects'] as const,
    queryFn: () => projectsApi.getProjects(),
    enabled: open && source === 'project_fund',
  });
  const projects: Project[] = projectsQuery.data?.data ?? (Array.isArray(projectsQuery.data) ? projectsQuery.data : []);

  const selectedProjectDetailsQuery = useQuery<Project | null>({
    queryKey: ['money-exchanges-dialog', 'project-details', selectedProjectId] as const,
    queryFn: async () => {
      if (!selectedProjectId) return null;
      return projectsApi.getProjectById(Number(selectedProjectId));
    },
    enabled: open && source === 'project_fund' && Boolean(selectedProjectId),
  });
  const projectFunds: ProjectFund[] = useMemo(() => {
    const list = selectedProjectDetailsQuery.data?.funds ?? [];
    return [...list].sort((a, b) => b.id - a.id);
  }, [selectedProjectDetailsQuery.data]);

  const fundRoleUsersQuery = useQuery<RoleUser[]>({
    queryKey: ['money-exchanges-dialog', 'fund-role-users', fundUserRole] as const,
    queryFn: async () => {
      if (!fundUserRole) return [];
      const res = await usersApi.getUsersByRole(fundUserRole);
      const list = (res as any)?.data ?? res;
      return list as RoleUser[];
    },
    enabled: open && source === 'user_fund' && Boolean(fundUserRole),
  });
  const fundRoleUsers = fundRoleUsersQuery.data ?? [];

  const fundUserRecordQuery = useQuery<FundUserRecord | null>({
    queryKey: ['money-exchanges-dialog', 'fund-user-record', fundUserRole, fundUserId] as const,
    queryFn: async () => {
      if (!fundUserRole || !fundUserId) return null;
      const user = await usersApi.getUserByRole(fundUserRole, Number(fundUserId));
      return user as FundUserRecord;
    },
    enabled: open && source === 'user_fund' && Boolean(fundUserRole) && Boolean(fundUserId),
  });
  const userFunds = useMemo(() => {
    const list = fundUserRecordQuery.data?.user?.funds ?? [];
    return [...list].sort((a, b) => b.id - a.id);
  }, [fundUserRecordQuery.data]);

  const selectedFundCurrencies = useMemo(() => {
    if (source === 'company_fund') {
      const fund = companyFunds.find((f) => String(f.id) === companyFundId);
      return fund?.currencies ?? [];
    }
    if (source === 'project_fund') {
      const projectFundId = form.watch('project_fund_id');
      const fund = projectFunds.find((f) => String(f.id) === projectFundId);
      return fund?.currencies ?? [];
    }
    if (source === 'user_fund') {
      const userFundId = form.watch('user_fund_id');
      const fund = userFunds.find((f) => String(f.id) === userFundId);
      return fund?.currencies ?? [];
    }
    return [];
  }, [source, companyFundId, form.watch('project_fund_id'), form.watch('user_fund_id'), companyFunds, projectFunds, userFunds]);

  useEffect(() => {
    if (defaultValues) {
      const type = defaultValues.exchangeable_info?.type;
      const details = defaultValues.exchangeable_info?.details;
      const userInfo = defaultValues.exchangeable_info?.user_info;

      const mapped: MoneyExchangeFormValues = {
        source: type === 'company_fund' ? 'company_fund' : type === 'project_fund' ? 'project_fund' : 'user_fund',
        company_fund_id: type === 'company_fund' ? String(details?.company_fund_id || '') : '',
        project_id: type === 'project_fund' ? String(details?.project_fund?.project?.id || details?.project_fund?.project_id || '') : '',
        project_fund_id: type === 'project_fund' ? String(details?.project_fund_id || details?.fund_id || details?.project_fund?.id || '') : '',
        fund_user_role: type === 'currency_fund' ? (userInfo?.role_type || details?.fund?.user?.role_type || '') : '',
        fund_user_id: type === 'currency_fund' ? String(details?.fund?.user_id || details?.fund?.user?.id || '') : '',
        user_fund_id: type === 'currency_fund' ? String(details?.fund_id || details?.fund?.id || '') : '',
        from_currency: String(defaultValues.from_currency.id),
        to_currency: String(defaultValues.to_currency.id),
        amount: String(defaultValues.amount),
        exchange_rate: String(defaultValues.exchange_rate),
        operation: defaultValues.operation,
      };
      form.reset(mapped);
    } else if (!open) {
      form.reset({
        source: 'company_fund',
        company_fund_id: '',
        project_id: '',
        project_fund_id: '',
        fund_user_role: '',
        fund_user_id: '',
        user_fund_id: '',
        from_currency: '',
        to_currency: '',
        amount: '',
        exchange_rate: '',
        operation: 'multiply',
      });
    }
  }, [form, open, defaultValues]);

  const handleSubmitForm = async (values: MoneyExchangeFormValues) => {
    const selectedCurrency = selectedFundCurrencies.find((c) => String(c.id) === values.from_currency);
    const exchangeableId = selectedCurrency
      ? (selectedCurrency.expenseable_id ?? selectedCurrency.pivot?.id ?? selectedCurrency.id)
      : 0;

    await onSubmit({
      exchangeable_type: sourceToExchangeableType[values.source],
      exchangeable_id: exchangeableId,
      from_currency: Number(values.from_currency),
      to_currency: Number(values.to_currency),
      amount: Number(values.amount.replace(/,/g, '')),
      exchange_rate: Number(values.exchange_rate.replace(/,/g, '')),
      operation: values.operation,
    });
  };

  const formatNumberWithCommas = (value: string) => {
    if (!value) return '';
    const clean = value.replace(/,/g, '');
    if (isNaN(Number(clean))) return value;
    const parts = clean.split('.');
    parts[0] = Number(parts[0]).toLocaleString('en-US');
    return parts.join('.');
  };

  const parseNumberFromCommas = (value: string) => {
    return value.replace(/,/g, '');
  };

  const formatFundCurrencies = (currencies?: { currency: string; balance: string }[]) => {
    if (!currencies || currencies.length === 0) return '';
    return `(${currencies.map(c => `${c.currency}: ${Number(c.balance).toLocaleString()}`).join(', ')})`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{defaultValues ? 'تعديل عملية تصريف عملة' : 'إضافة عملية تصريف عملة'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmitForm)}>
            <FormField
              control={form.control}
              name="source"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>نوع الصندوق</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      form.setValue('company_fund_id', '');
                      form.setValue('project_id', '');
                      form.setValue('project_fund_id', '');
                      form.setValue('fund_user_role', '');
                      form.setValue('fund_user_id', '');
                      form.setValue('user_fund_id', '');
                    }}
                  >
                    <FormControl>
                      <SelectTrigger className="h-11 bg-white">
                        <SelectValue placeholder="اختر نوع الصندوق">
                          {field.value === 'company_fund' && 'صندوق الشركة'}
                          {field.value === 'project_fund' && 'صندوق المشروع'}
                          {field.value === 'user_fund' && 'صندوق مستخدم'}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="company_fund">صندوق الشركة</SelectItem>
                      <SelectItem value="project_fund">صندوق المشروع</SelectItem>
                      <SelectItem value="user_fund">صندوق مستخدم</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {source === 'company_fund' && (
              <FormField
                control={form.control}
                name="company_fund_id"
                render={({ field }) => {
                  const selected = companyFunds.find((f) => String(f.id) === field.value);
                  return (
                    <FormItem>
                      <FormLabel>صناديق الشركة</FormLabel>
                      {companyFundsQuery.isLoading ? (
                        <Skeleton className="h-10 w-full" />
                      ) : (
                        <Select
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value);
                            form.setValue('from_currency', '');
                          }}
                        >
                          <FormControl>
                            <SelectTrigger>
                              {field.value && selected ? (
                                <span>{selected.name} {formatFundCurrencies(selected.currencies)}</span>
                              ) : (
                                <SelectValue placeholder="اختر صندوق الشركة" />
                              )}
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {companyFunds.map((fund) => (
                              <SelectItem key={fund.id} value={String(fund.id)}>
                                {fund.name} {formatFundCurrencies(fund.currencies)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            )}

            {source === 'project_fund' && (
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="project_id"
                  render={({ field }) => {
                    const selected = projects.find((p) => String(p.id) === field.value);
                    return (
                      <FormItem>
                        <FormLabel>المشروع</FormLabel>
                        {projectsQuery.isLoading ? (
                          <Skeleton className="h-10 w-full" />
                        ) : (
                          <Select
                            value={field.value}
                            onValueChange={(val) => {
                              field.onChange(val);
                              form.setValue('project_fund_id', '');
                              form.setValue('from_currency', '');
                            }}
                          >
                            <FormControl>
                              <SelectTrigger>
                                {field.value && selected ? (
                                  <span>{selected.name}</span>
                                ) : (
                                  <SelectValue placeholder="اختر المشروع" />
                                )}
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
                    );
                  }}
                />

                <FormField
                  control={form.control}
                  name="project_fund_id"
                  render={({ field }) => {
                    const selected = projectFunds.find((f) => String(f.id) === field.value);
                    return (
                      <FormItem>
                        <FormLabel>صندوق المشروع</FormLabel>
                        {selectedProjectDetailsQuery.isLoading ? (
                          <Skeleton className="h-10 w-full" />
                        ) : (
                          <Select
                            value={field.value}
                            onValueChange={(val) => {
                              field.onChange(val);
                              form.setValue('from_currency', '');
                            }}
                            disabled={!selectedProjectId}
                          >
                            <FormControl>
                              <SelectTrigger disabled={!selectedProjectId}>
                                {field.value && selected ? (
                                  <span>{selected.name} {formatFundCurrencies(selected.currencies)}</span>
                                ) : (
                                  <SelectValue placeholder="اختر صندوق المشروع" />
                                )}
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {projectFunds.map((fund) => (
                                <SelectItem key={fund.id} value={String(fund.id)}>
                                  {fund.name} {formatFundCurrencies(fund.currencies)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              </div>
            )}

            {source === 'user_fund' && (
              <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50/50 p-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="fund_user_role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>نوع المستخدم</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={(val) => {
                            field.onChange(val);
                            form.setValue('fund_user_id', '');
                            form.setValue('user_fund_id', '');
                            form.setValue('from_currency', '');
                          }}
                        >
                          <FormControl>
                            <SelectTrigger>
                              {field.value ? roleLabels[field.value as UserRole] : <SelectValue placeholder="اختر النوع" />}
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
                              value={field.value ? Number(field.value) : undefined}
                              onValueChange={(val) => {
                                field.onChange(String(val));
                                form.setValue('user_fund_id', '');
                                form.setValue('from_currency', '');
                              }}
                              disabled={!fundUserRole}
                              placeholder="اختر المستخدم"
                              options={fundRoleUsers.map((user) => ({
                                value: user.id,
                                label: user.user.name,
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
                    render={({ field }) => {
                      const selected = userFunds.find((f) => String(f.id) === field.value);
                      return (
                        <FormItem>
                          <FormLabel>صندوق المستخدم</FormLabel>
                          {fundUserRecordQuery.isLoading ? (
                            <Skeleton className="h-10 w-full" />
                          ) : (
                            <Select
                              value={field.value}
                              onValueChange={(val) => {
                                field.onChange(val);
                                form.setValue('from_currency', '');
                              }}
                              disabled={!fundUserId}
                            >
                              <FormControl>
                                  <SelectTrigger disabled={!fundUserId}>
                                    {field.value && selected ? (
                                      <span>{selected.name} {formatFundCurrencies(selected.currencies)}</span>
                                    ) : (
                                      <SelectValue placeholder="اختر صندوق المستخدم" />
                                    )}
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {userFunds.map((fund) => (
                                    <SelectItem key={fund.id} value={String(fund.id)}>
                                      {fund.name} {formatFundCurrencies(fund.currencies)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="from_currency"
                  render={({ field }) => {
                    const selected = selectedFundCurrencies.find((c) => String(c.id) === field.value);
                    return (
                      <FormItem>
                        <FormLabel>من العملة</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              {field.value && selected ? (
                                <span>{selected.currency} ({selected.symbol})</span>
                              ) : (
                                <SelectValue placeholder="اختر العملة المصدر" />
                              )}
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {selectedFundCurrencies.map((c) => (
                              <SelectItem key={c.id} value={String(c.id)}>
                                {c.currency} ({c.symbol}) - الرصيد: {Number(c.balance).toLocaleString()}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                <FormField
                  control={form.control}
                  name="to_currency"
                  render={({ field }) => {
                    const selected = allCurrencies.find((c) => String(c.id) === field.value);
                    return (
                      <FormItem>
                        <FormLabel>إلى العملة</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              {field.value && selected ? (
                                <span>{selected.currency} ({selected.symbol})</span>
                              ) : (
                                <SelectValue placeholder="اختر العملة الهدف" />
                              )}
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {allCurrencies.map((c) => (
                              <SelectItem key={c.id} value={String(c.id)}>
                                {c.currency} ({c.symbol})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>المبلغ المراد تصريفه</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="100"
                          value={formatNumberWithCommas(field.value)}
                          onChange={(e) => {
                            const parsed = parseNumberFromCommas(e.target.value);
                            if (parsed === '' || /^\d*\.?\d*$/.test(parsed)) {
                              field.onChange(parsed);
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="exchange_rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>سعر التصريف</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="500"
                          value={formatNumberWithCommas(field.value)}
                          onChange={(e) => {
                            const parsed = parseNumberFromCommas(e.target.value);
                            if (parsed === '' || /^\d*\.?\d*$/.test(parsed)) {
                              field.onChange(parsed);
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="operation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>العملية</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            {field.value === 'multiply' ? (
                              'ضرب (*)'
                            ) : field.value === 'divide' ? (
                              'قسمة (/)'
                            ) : (
                              <SelectValue placeholder="اختر العملية" />
                            )}
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="multiply">ضرب (*)</SelectItem>
                          <SelectItem value="divide">قسمة (/)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button
                type="submit"
                className="w-full h-11"
                disabled={loading || currenciesQuery.isLoading}
              >
                {loading ? 'جاري إضافة عملية تصريف العملة...' : 'تصريف'}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
  );
}
