import { useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
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
import { fundsApi } from '@/features/funds/funds.api';
import type { Fund } from '@/features/funds/types';
import { projectsApi } from '@/features/projects/projects.api';
import type { Project } from '@/features/projects/types';
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
    name: string;
  };
};

type FundLabelSource = {
  name: string;
  user?: {
    name?: string;
  } | null;
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

function getExpenseableId<T extends { id: number; currencies?: Array<{ id: number }> }>(item: T) {
  return item.currencies?.[0]?.id ?? item.id;
}

function getFundLabel(item: FundLabelSource) {
  return item.user?.name ?? item.name;
}

export function ExpensesForm({ defaultValues, onSubmit, loading }: ExpensesFormProps) {
  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      source: getSourceFromType(defaultValues?.expenseable_type),
      expenseable_type: defaultValues?.expenseable_type ?? sourceToExpenseableType.company_fund,
      expenseable_id: defaultValues?.expenseable_id,
      user_role: defaultValues?.user_role ?? '',
      user_id: defaultValues?.user_id ?? undefined,
      fund_user_role: '',
      fund_user_id: undefined,
      description: defaultValues?.description ?? '',
      amount: Number(defaultValues?.amount ?? 0),
      is_posted: Boolean(defaultValues?.is_posted ?? true),
      created_by: defaultValues?.created_by ?? 1,
    },
  });

  const source = form.watch('source');
  const userRole = form.watch('user_role') as UserRole | '';
  const fundUserRole = form.watch('fund_user_role') as UserRole | '';
  const fundUserId = form.watch('fund_user_id');
  const selectedProjectId = form.watch('project_id');

  const { data: companyFunds = [] } = useQuery<CompanyFund[]>({
    queryKey: ['expenses', 'company-funds'] as const,
    queryFn: () => companyFundsApi.getCompanyFunds(),
    enabled: source === 'company_fund',
  });

  const { data: userFunds = [] } = useQuery<Fund[]>({
    queryKey: ['expenses', 'user-funds'] as const,
    queryFn: () => fundsApi.getFunds(),
    enabled: source === 'user_fund',
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['expenses', 'projects'] as const,
    queryFn: () => projectsApi.getProjects(),
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

  const projectFunds = useMemo(() => {
    if (source !== 'project_fund' || !selectedProjectId) return [];
    return projects.find((project) => project.id === selectedProjectId)?.funds ?? [];
  }, [projects, selectedProjectId, source]);

  const filteredUserFunds = useMemo(() => {
    if (source !== 'user_fund' || !fundUserId) return [];
    return userFunds.filter((fund) => fund.user?.id === fundUserId);
  }, [fundUserId, source, userFunds]);

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
                    form.setValue('fund_user_role', '');
                    form.setValue('fund_user_id', undefined);

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
              <p className="text-xs text-slate-500">
                اختر نوع المستخدم ثم المستخدم نفسه، وبعدها يفتح لك الصندوق المرتبط فقط بهذا المستخدم.
              </p>
            </div>

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
                        form.setValue('expenseable_id', undefined);
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر نوع المستخدم" />
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
                        form.setValue('expenseable_id', undefined);
                      }}
                      disabled={!fundUserRole}
                    >
                      <FormControl>
                        <SelectTrigger disabled={!fundUserRole}>
                          <SelectValue placeholder="اختر المستخدم" />
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
            </div>

            <FormField
              control={form.control}
              name="expenseable_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>صناديق المستخدم</FormLabel>
                  <Select
                    value={field.value ? String(field.value) : ''}
                    onValueChange={(value) => field.onChange(Number(value))}
                    disabled={!fundUserId}
                  >
                    <FormControl>
                      <SelectTrigger disabled={!fundUserId}>
                        <SelectValue placeholder="اختر صندوق المستخدم" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {filteredUserFunds.map((fund) => (
                        <SelectItem key={fund.id} value={String(getExpenseableId(fund))}>
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
                      <SelectValue placeholder="اختر نوع المستخدم" />
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
                      <SelectValue placeholder="اختر المستخدم" />
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
          <FormField
            control={form.control}
            name="expenseable_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>صناديق الشركة</FormLabel>
                <Select
                  value={field.value ? String(field.value) : ''}
                  onValueChange={(value) => field.onChange(Number(value))}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر صندوق الشركة" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {companyFunds.map((fund) => (
                      <SelectItem key={fund.id} value={String(getExpenseableId(fund))}>
                        {getFundLabel(fund)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : null}

        {source === 'project_fund' ? (
          <>
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
                      form.setValue('expenseable_id', undefined);
                    }}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر المشروع" />
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
              name="expenseable_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>صناديق المشروع</FormLabel>
                  <Select
                    value={field.value ? String(field.value) : ''}
                    onValueChange={(value) => field.onChange(Number(value))}
                    disabled={!selectedProjectId}
                  >
                    <FormControl>
                      <SelectTrigger disabled={!selectedProjectId}>
                        <SelectValue placeholder="اختر صندوق المشروع" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {projectFunds.map((fund) => (
                        <SelectItem key={fund.id} value={String(getExpenseableId(fund))}>
                          {getFundLabel(fund)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
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

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'جاري الحفظ...' : 'حفظ'}
        </Button>
      </form>
    </Form>
  );
}
