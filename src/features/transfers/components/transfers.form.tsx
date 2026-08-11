import { useEffect, useMemo } from 'react';
import { cn } from '@/shared/lib/utils';
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
import { fundsApi } from '@/features/funds/funds.api';
import type { Fund } from '@/features/funds/types';
import { projectsApi } from '@/features/projects/projects.api';
import type { Project, ProjectFund } from '@/features/projects/types';
import { usersApi } from '@/features/users/api/users.api';
import type { UserRole } from '@/features/users/types';
import type { TransferableType, CreateTransferPayload, Transfer } from '../types';

const transferFormSchema = z.object({
  name: z.string().min(1, 'الرجاء إدخال البيان'),
  amount: z.number().positive('الرجاء إدخال مبلغ صحيح'),
  morph_from_type: z.enum([
    'App\\Models\\CompanyFundCurrency',
    'App\\Models\\CurrencyFund',
    'App\\Models\\ProjectFundCurrency',
  ]).optional(),
  morph_from_id: z.number({ message: 'الرجاء اختيار عملة المصدر' }),
  morph_to_type: z.enum([
    'App\\Models\\CompanyFundCurrency',
    'App\\Models\\CurrencyFund',
    'App\\Models\\ProjectFundCurrency',
  ]),
  morph_to_id: z.number({ message: 'الرجاء اختيار عملة الوجهة' }),
  company_fund_id: z.number().optional(),
  fund_user_role: z.string().optional(),
  fund_user_id: z.number().optional(),
  user_fund_id: z.number().optional(),
  project_fund_id: z.number().optional(),
  project_id: z.number().optional(),

  from_company_fund_id: z.number().optional(),
  from_user_role: z.string().optional(),
  from_user_id: z.number().optional(),
  from_user_fund_id: z.number().optional(),
  from_project_fund_id: z.number().optional(),
  from_project_id: z.number().optional(),
  isGeneral: z.boolean().optional(),
}).superRefine((values, ctx) => {
  if (values.isGeneral && values.morph_from_type) {
    if (values.morph_from_type === 'App\\Models\\CompanyFundCurrency') {
      if (!values.from_company_fund_id) {
        ctx.addIssue({
          code: 'custom',
          path: ['from_company_fund_id'],
          message: 'الرجاء اختيار صندوق الشركة للمصدر',
        });
      }
      if (!values.morph_from_id) {
        ctx.addIssue({
          code: 'custom',
          path: ['morph_from_id'],
          message: 'الرجاء اختيار عملة صندوق الشركة للمصدر',
        });
      }
    }
    if (values.morph_from_type === 'App\\Models\\ProjectFundCurrency') {
      if (!values.from_project_id) {
        ctx.addIssue({
          code: 'custom',
          path: ['from_project_id'],
          message: 'الرجاء اختيار المشروع للمصدر',
        });
      }
      if (!values.from_project_fund_id) {
        ctx.addIssue({
          code: 'custom',
          path: ['from_project_fund_id'],
          message: 'الرجاء اختيار صندوق المشروع للمصدر',
        });
      }
      if (!values.morph_from_id) {
        ctx.addIssue({
          code: 'custom',
          path: ['morph_from_id'],
          message: 'الرجاء اختيار عملة صندوق المشروع للمصدر',
        });
      }
    }
    if (values.morph_from_type === 'App\\Models\\CurrencyFund') {
      if (!values.from_user_role) {
        ctx.addIssue({
          code: 'custom',
          path: ['from_user_role'],
          message: 'الرجاء اختيار نوع المستخدم لصندوق المصدر',
        });
      }
      if (!values.from_user_id) {
        ctx.addIssue({
          code: 'custom',
          path: ['from_user_id'],
          message: 'الرجاء اختيار مستخدم لصندوق المصدر',
        });
      }
      if (!values.from_user_fund_id) {
        ctx.addIssue({
          code: 'custom',
          path: ['from_user_fund_id'],
          message: 'الرجاء اختيار صندوق المصدر',
        });
      }
      if (!values.morph_from_id) {
        ctx.addIssue({
          code: 'custom',
          path: ['morph_from_id'],
          message: 'الرجاء اختيار عملة صندوق المصدر',
        });
      }
    }
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
  morph_from_type?: TransferableType;
  fixedFromCurrencies?: {
    id: number;
    expenseable_id?: number;
    currency: string;
    symbol: string;
    balance: string;
  }[];
  onSubmit: (data: CreateTransferPayload) => Promise<void>;
  loading?: boolean;
  defaultValues?: Transfer | null;
  isGeneral?: boolean;
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
  trustee: 'الأمين',
};

function getCompanyFundLabel(item: CompanyFund) {
  return item.name;
}

function getCurrencyLabel(currency: { currency: string; balance: string }) {
  const balanceVal = Number(currency.balance) || 0;
  const colorClass = balanceVal > 0 ? 'text-success font-semibold' : 'text-destructive font-semibold';
  return (
    <span className="flex items-center justify-between gap-2 w-full">
      <span>{currency.currency}</span>
      <span className={colorClass}>({currency.balance})</span>
    </span>
  );
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

function getRoleDetailsId(user: any): number | undefined {
  if (!user) return undefined;
  if (user.role_details?.id) return Number(user.role_details.id);
  const roles = ['client', 'investor', 'employee', 'engineer', 'craftsmen', 'supplier', 'trustee', 'admin'];
  for (const r of roles) {
    if (user[r]?.id) return Number(user[r].id);
  }
  return undefined;
}

function normalizeRole(role: string | undefined): UserRole | '' {
  if (!role) return '';
  if (role === 'craftsmen') return 'craftsman';
  if (role === 'user') return 'admin';
  return role as UserRole;
}

function getSourceExpenseableId(
  pivotId: number,
  morphFromType: TransferableType | undefined,
  companyFunds: CompanyFund[],
  projects: Project[],
  allFunds: Fund[]
): number {
  if (morphFromType === 'App\\Models\\CompanyFundCurrency') {
    for (const fund of companyFunds) {
      const cur = fund.currencies?.find(c => c.id === pivotId);
      if (cur) return cur.expenseable_id ?? cur.id;
    }
  }
  if (morphFromType === 'App\\Models\\ProjectFundCurrency') {
    for (const proj of projects) {
      if (proj.funds) {
        for (const fund of proj.funds) {
          const cur = fund.currencies?.find(c => c.id === pivotId);
          if (cur) return cur.expenseable_id ?? cur.id;
        }
      }
    }
  }
  if (morphFromType === 'App\\Models\\CurrencyFund') {
    for (const fund of allFunds) {
      const cur = fund.currencies?.find(c => c.id === pivotId);
      if (cur) return cur.expenseable_id ?? cur.id;
    }
  }
  return pivotId;
}

function getPivotIdFromExpenseableId(
  expenseableId: number,
  morphFromType: TransferableType | undefined,
  companyFunds: CompanyFund[],
  projects: Project[],
  allFunds: Fund[]
): number | undefined {
  if (morphFromType === 'App\\Models\\CompanyFundCurrency') {
    for (const fund of companyFunds) {
      const cur = fund.currencies?.find(c => (c.expenseable_id ?? c.id) === expenseableId);
      if (cur) return cur.id;
    }
  }
  if (morphFromType === 'App\\Models\\ProjectFundCurrency') {
    for (const proj of projects) {
      if (proj.funds) {
        for (const fund of proj.funds) {
          const cur = fund.currencies?.find(c => (c.expenseable_id ?? c.id) === expenseableId);
          if (cur) return cur.id;
        }
      }
    }
  }
  if (morphFromType === 'App\\Models\\CurrencyFund') {
    for (const fund of allFunds) {
      const cur = fund.currencies?.find(c => (c.expenseable_id ?? c.id) === expenseableId);
      if (cur) return cur.id;
    }
  }
  return undefined;
}

function cleanBackslashes(str?: string): any {
  if (!str) return undefined;
  return str.replace(/\\+/g, '\\');
}

export function TransfersForm({
  morph_from_type,
  fixedFromCurrencies = [],
  onSubmit,
  loading,
  defaultValues,
  isGeneral = false,
}: TransferFormProps) {

  const initialFromType = cleanBackslashes(defaultValues?.morph_from_type ?? (isGeneral ? 'App\\Models\\CompanyFundCurrency' : morph_from_type));
  const initialToType = cleanBackslashes(defaultValues?.morph_to_type ?? 'App\\Models\\CompanyFundCurrency');

  const form = useForm<TransferFormValues>({
    resolver: zodResolver(transferFormSchema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      amount: defaultValues?.amount ? Number(defaultValues.amount) : 0,
      morph_from_type: initialFromType,
      morph_from_id: defaultValues?.morph_from_id ?? fixedFromCurrencies[0]?.id,
      morph_to_type: initialToType,
      morph_to_id: defaultValues?.morph_to_id ?? undefined,
      company_fund_id: initialToType === 'App\\Models\\CompanyFundCurrency'
        ? (defaultValues?.morph_to_info?.details?.company_fund_id ?? undefined)
        : undefined,
      fund_user_role: initialToType === 'App\\Models\\CurrencyFund'
        ? normalizeRole(defaultValues?.morph_to_info?.user_info?.role_type)
        : '',
      fund_user_id: initialToType === 'App\\Models\\CurrencyFund'
        ? (getRoleDetailsId(defaultValues?.morph_to_info?.user_info?.user) ?? getRoleDetailsId(defaultValues?.morph_to_info?.details?.fund?.user) ?? undefined)
        : undefined,
      user_fund_id: initialToType === 'App\\Models\\CurrencyFund'
        ? (defaultValues?.morph_to_info?.details?.fund_id ?? undefined)
        : undefined,
      project_fund_id: initialToType === 'App\\Models\\ProjectFundCurrency'
        ? (defaultValues?.morph_to_info?.details?.project_fund_id ?? undefined)
        : undefined,
      project_id: initialToType === 'App\\Models\\ProjectFundCurrency'
        ? (defaultValues?.morph_to_info?.details?.project_fund?.project_id ?? undefined)
        : undefined,

      from_company_fund_id: initialFromType === 'App\\Models\\CompanyFundCurrency'
        ? (defaultValues?.morph_from_info?.details?.company_fund_id ?? undefined)
        : undefined,
      from_user_role: initialFromType === 'App\\Models\\CurrencyFund'
        ? normalizeRole(defaultValues?.morph_from_info?.user_info?.role_type)
        : '',
      from_user_id: initialFromType === 'App\\Models\\CurrencyFund'
        ? (getRoleDetailsId(defaultValues?.morph_from_info?.user_info?.user) ?? getRoleDetailsId(defaultValues?.morph_from_info?.details?.fund?.user) ?? undefined)
        : undefined,
      from_user_fund_id: initialFromType === 'App\\Models\\CurrencyFund'
        ? (defaultValues?.morph_from_info?.details?.fund_id ?? undefined)
        : undefined,
      from_project_fund_id: initialFromType === 'App\\Models\\ProjectFundCurrency'
        ? (defaultValues?.morph_from_info?.details?.project_fund_id ?? undefined)
        : undefined,
      from_project_id: initialFromType === 'App\\Models\\ProjectFundCurrency'
        ? (defaultValues?.morph_from_info?.details?.project_fund?.project_id ?? undefined)
        : undefined,
      isGeneral: isGeneral,
    },
  });

  useEffect(() => {
    console.log('Validation Errors:', form.formState.errors);
  }, [form.formState.errors]);
  const morphFromType = form.watch('morph_from_type');
  const morphToType = form.watch('morph_to_type');
  const companyFundId = form.watch('company_fund_id');
  const selectedMorphToId = form.watch('morph_to_id');
  const selectedMorphFromId = form.watch('morph_from_id');
  const fundUserRole = form.watch('fund_user_role') as UserRole | '';
  const fundUserId = form.watch('fund_user_id');
  const userFundId = form.watch('user_fund_id');
  const projectFundId = form.watch('project_fund_id');
  const selectedProjectId = form.watch('project_id');

  const fromUserRole = form.watch('from_user_role') as UserRole | '';
  const fromUserId = form.watch('from_user_id');
  const fromUserFundId = form.watch('from_user_fund_id');
  const fromProjectFundId = form.watch('from_project_fund_id');
  const selectedFromProjectId = form.watch('from_project_id');
  const fromCompanyFundId = form.watch('from_company_fund_id');

  const { data: fromRoleUsers = [] } = useQuery<RoleUser[]>({
    queryKey: ['transfers', 'from-role-users', fromUserRole] as const,
    queryFn: async () => {
      if (!fromUserRole || !userRoles.includes(fromUserRole as UserRole)) return [];
      const res = await usersApi.getUsersByRole(fromUserRole as UserRole);
      const list = (res as any)?.data ?? res;
      return list as RoleUser[];
    },
    enabled: isGeneral && morphFromType === 'App\\Models\\CurrencyFund' && Boolean(fromUserRole) && userRoles.includes(fromUserRole as UserRole),
  });

  const companyFundsQuery = useQuery({
    queryKey: ['transfers', 'company-funds'] as const,
    queryFn: () => companyFundsApi.getCompanyFunds(),
    enabled: morphToType === 'App\\Models\\CompanyFundCurrency' || morphFromType === 'App\\Models\\CompanyFundCurrency',
  });
  const companyFunds = useMemo(() => {
    const list: CompanyFund[] = companyFundsQuery.data?.data ?? (Array.isArray(companyFundsQuery.data) ? companyFundsQuery.data : []);
    return [...list].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  }, [companyFundsQuery.data]);

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
    enabled: morphToType === 'App\\Models\\ProjectFundCurrency' || morphFromType === 'App\\Models\\ProjectFundCurrency',
  });
  const projects: Project[] = projectsQuery.data?.data ?? (Array.isArray(projectsQuery.data) ? projectsQuery.data : []);

  const allFundsQuery = useQuery({
    queryKey: ['transfers', 'all-funds-lookup'] as const,
    queryFn: async () => (await fundsApi.getFunds({ perPage: 1000 })).data,
    enabled: !isGeneral && morphFromType === 'App\\Models\\CurrencyFund',
  });
  const allFunds = allFundsQuery.data ?? [];

  useEffect(() => {
    if (!defaultValues?.id || isGeneral) return;
    const rawId = defaultValues?.morph_from_id;
    if (!rawId) return;

    const pivotId = getPivotIdFromExpenseableId(
      rawId,
      morphFromType,
      companyFunds,
      projects,
      allFunds
    );
    if (pivotId) {
      form.setValue('morph_from_id', pivotId);
    }
  }, [defaultValues, morphFromType, companyFunds, projects, allFunds, isGeneral, form]);

  const { data: selectedProjectDetails } = useQuery<Project | null>({
    queryKey: ['transfers', 'project-details', selectedProjectId] as const,
    queryFn: async () => {
      if (!selectedProjectId) return null;
      return projectsApi.getProjectById(selectedProjectId);
    },
    enabled: morphToType === 'App\\Models\\ProjectFundCurrency' && Boolean(selectedProjectId),
  });

  const { data: selectedFromProjectDetails } = useQuery<Project | null>({
    queryKey: ['transfers', 'from-project-details', selectedFromProjectId] as const,
    queryFn: async () => {
      if (!selectedFromProjectId) return null;
      return projectsApi.getProjectById(selectedFromProjectId);
    },
    enabled: isGeneral && morphFromType === 'App\\Models\\ProjectFundCurrency' && Boolean(selectedFromProjectId),
  });

  const { data: fundRoleUsers = [] } = useQuery<RoleUser[]>({
    queryKey: ['transfers', 'fund-role-users', fundUserRole] as const,
    queryFn: async () => {
      if (!fundUserRole || !userRoles.includes(fundUserRole as UserRole)) return [];
      const res = await usersApi.getUsersByRole(fundUserRole as UserRole);
      const list = (res as any)?.data ?? res;
      return list as RoleUser[];
    },
    enabled: morphToType === 'App\\Models\\CurrencyFund' && Boolean(fundUserRole) && userRoles.includes(fundUserRole as UserRole),
  });

  const { data: selectedFundUserRecord } = useQuery<FundUserRecord | null>({
    queryKey: ['transfers', 'fund-user-record', fundUserRole, fundUserId] as const,
    queryFn: async () => {
      if (!fundUserRole || !fundUserId || !userRoles.includes(fundUserRole as UserRole)) return null;
      const user = await usersApi.getUserByRole(fundUserRole as UserRole, fundUserId);
      return user as FundUserRecord;
    },
    enabled: morphToType === 'App\\Models\\CurrencyFund' && Boolean(fundUserRole) && Boolean(fundUserId) && userRoles.includes(fundUserRole as UserRole),
  });

  const { data: selectedFromUserRecord } = useQuery<FundUserRecord | null>({
    queryKey: ['transfers', 'from-user-record', fromUserRole, fromUserId] as const,
    queryFn: async () => {
      if (!fromUserRole || !fromUserId || !userRoles.includes(fromUserRole as UserRole)) return null;
      const user = await usersApi.getUserByRole(fromUserRole as UserRole, fromUserId);
      return user as FundUserRecord;
    },
    enabled: isGeneral && morphFromType === 'App\\Models\\CurrencyFund' && Boolean(fromUserRole) && Boolean(fromUserId) && userRoles.includes(fromUserRole as UserRole),
  });

  const projectFunds: ProjectFund[] = useMemo(() => {
    if (morphToType !== 'App\\Models\\ProjectFundCurrency' || !selectedProjectId) return [];
    const list = selectedProjectDetails?.funds ?? [];
    return [...list].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
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

  const fromProjectFunds = useMemo(() => {
    if (morphFromType !== 'App\\Models\\ProjectFundCurrency' || !selectedFromProjectId) return [];
    const list = selectedFromProjectDetails?.funds ?? [];
    return [...list].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  }, [selectedFromProjectDetails?.funds, selectedFromProjectId, morphFromType]);

  const selectedFromCompanyFund = useMemo(() => {
    if (!fromCompanyFundId) return undefined;
    return companyFunds.find((fund) => fund.id === fromCompanyFundId);
  }, [fromCompanyFundId, companyFunds]);

  const selectedFromProjectFund = useMemo(() => {
    if (!fromProjectFundId) return undefined;
    return fromProjectFunds.find((fund) => fund.id === fromProjectFundId);
  }, [fromProjectFundId, fromProjectFunds]);

  const selectedFromUserFund = useMemo(() => {
    if (!fromUserFundId) return undefined;
    return selectedFromUserRecord?.user.funds?.find((fund) => fund.id === fromUserFundId);
  }, [fromUserFundId, selectedFromUserRecord]);

  const derivedFromCompanyFundId = useMemo(() => {
    if (fromCompanyFundId) return fromCompanyFundId;
    if (!selectedMorphFromId) return undefined;
    return companyFunds.find((fund) =>
      fund.currencies?.some((currency) => currencyMatchesExpenseableId(currency, selectedMorphFromId)),
    )?.id;
  }, [fromCompanyFundId, companyFunds, selectedMorphFromId]);

  useEffect(() => {
    if (morphFromType !== 'App\\Models\\CompanyFundCurrency') return;
    if (fromCompanyFundId || !derivedFromCompanyFundId) return;
    form.setValue('from_company_fund_id', derivedFromCompanyFundId);
  }, [fromCompanyFundId, derivedFromCompanyFundId, form, morphFromType]);

  const derivedFromProjectFundId = useMemo(() => {
    if (fromProjectFundId) return fromProjectFundId;
    if (!selectedMorphFromId) return undefined;
    return fromProjectFunds.find((fund) =>
      fund.currencies?.some((currency) => currencyMatchesExpenseableId(currency, selectedMorphFromId)),
    )?.id;
  }, [fromProjectFundId, fromProjectFunds, selectedMorphFromId]);

  useEffect(() => {
    if (morphFromType !== 'App\\Models\\ProjectFundCurrency') return;
    if (fromProjectFundId || !derivedFromProjectFundId) return;
    form.setValue('from_project_fund_id', derivedFromProjectFundId);
  }, [derivedFromProjectFundId, form, fromProjectFundId, morphFromType]);

  const derivedFromUserFundId = useMemo(() => {
    if (fromUserFundId) return fromUserFundId;
    if (!selectedMorphFromId) return undefined;
    return selectedFromUserRecord?.user.funds?.find((fund) =>
      fund.currencies?.some((currency) => currencyMatchesExpenseableId(currency, selectedMorphFromId)),
    )?.id;
  }, [selectedMorphFromId, selectedFromUserRecord, fromUserFundId]);

  useEffect(() => {
    if (morphFromType !== 'App\\Models\\CurrencyFund') return;
    if (fromUserFundId || !derivedFromUserFundId) return;
    form.setValue('from_user_fund_id', derivedFromUserFundId);
  }, [derivedFromUserFundId, form, morphFromType, fromUserFundId]);

  useEffect(() => {
    if (morphFromType === 'App\\Models\\ProjectFundCurrency' && selectedFromProjectId && fromProjectFunds.length === 1 && !fromProjectFundId) {
      form.setValue('from_project_fund_id', fromProjectFunds[0].id);
    }
  }, [morphFromType, selectedFromProjectId, fromProjectFunds, fromProjectFundId, form]);

  useEffect(() => {
    if (morphFromType === 'App\\Models\\CompanyFundCurrency' && companyFunds.length === 1 && !fromCompanyFundId) {
      form.setValue('from_company_fund_id', companyFunds[0].id);
    }
  }, [morphFromType, companyFunds, fromCompanyFundId, form]);

  useEffect(() => {
    let currencies: any[] = [];
    if (morphFromType === 'App\\Models\\CompanyFundCurrency') {
      currencies = selectedFromCompanyFund?.currencies ?? [];
    } else if (morphFromType === 'App\\Models\\ProjectFundCurrency') {
      currencies = selectedFromProjectFund?.currencies ?? [];
    } else if (morphFromType === 'App\\Models\\CurrencyFund') {
      currencies = selectedFromUserFund?.currencies ?? [];
    }

    if (currencies.length === 1 && !selectedMorphFromId) {
      const val = getCurrencyExpenseableId(currencies[0]);
      if (val) form.setValue('morph_from_id', val);
    }
  }, [morphFromType, selectedFromCompanyFund, selectedFromProjectFund, selectedFromUserFund, selectedMorphFromId, form]);

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

  const selectedSourceCurrency = useMemo(() => {
    if (!selectedMorphFromId) return null;

    if (!isGeneral) {
      return fixedFromCurrencies.find((c) => c.id === selectedMorphFromId) || null;
    }

    let currencies: any[] = [];
    if (morphFromType === 'App\\Models\\CompanyFundCurrency') {
      currencies = selectedFromCompanyFund?.currencies ?? [];
    } else if (morphFromType === 'App\\Models\\ProjectFundCurrency') {
      currencies = selectedFromProjectFund?.currencies ?? [];
    } else if (morphFromType === 'App\\Models\\CurrencyFund') {
      currencies = selectedFromUserFund?.currencies ?? [];
    }

    return currencies.find((c) => getCurrencyExpenseableId(c) === selectedMorphFromId) || null;
  }, [isGeneral, selectedMorphFromId, fixedFromCurrencies, morphFromType, selectedFromCompanyFund, selectedFromProjectFund, selectedFromUserFund]);

  useEffect(() => {
    form.clearErrors('morph_from_id');
  }, [selectedMorphFromId, form]);

  return (
    <Form {...form}>
      <form
        className="space-y-2"
        onSubmit={form.handleSubmit(async (values) => {
          const bal = selectedSourceCurrency ? Number(selectedSourceCurrency.balance) || 0 : null;
          if (bal !== null && bal <= 0) {
            form.setError('morph_from_id', {
              type: 'custom',
              message: 'رصيد صندوق المصدر 0 أو أقل، غير مسموح بالتحويل',
            });
            return;
          }
          const selectedCur = fixedFromCurrencies.find((c) => c.id === values.morph_from_id);
          const finalMorphFromId = selectedCur?.expenseable_id ?? getSourceExpenseableId(values.morph_from_id, morphFromType, companyFunds, projects, allFunds);
          await onSubmit({
            morph_from_type: cleanBackslashes(isGeneral ? values.morph_from_type! : morph_from_type!),
            morph_from_id: isGeneral ? values.morph_from_id : finalMorphFromId,
            morph_to_type: cleanBackslashes(values.morph_to_type),
            morph_to_id: values.morph_to_id,
            name: values.name,
            amount: values.amount,
            created_by: (() => {
              if (!defaultValues?.created_by) return 1;
              const val = typeof defaultValues.created_by === 'object'
                ? (defaultValues.created_by as any).id
                : defaultValues.created_by;
              const num = Number(val);
              return Number.isNaN(num) ? 1 : num;
            })(),
          });
        })}
      >
        <div className={cn("grid gap-4", isGeneral ? "md:grid-cols-2" : "md:grid-cols-3")}>
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>البيان / البيان</FormLabel>
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

          {!isGeneral && (
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
                        {field.value ? (
                          (() => {
                            const selected = fixedFromCurrencies.find((c) => c.id === Number(field.value));
                            return selected ? getCurrencyLabel(selected) : 'اختر العملة للمصدر';
                          })()
                        ) : (
                          <SelectValue placeholder="اختر العملة للمصدر" />
                        )}
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {fixedFromCurrencies.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {getCurrencyLabel(c)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>



        {isGeneral && (
          <div className="space-y-4 rounded-lg border border-border bg-slate-50/40 p-4">
            <FormField
              control={form.control}
              name="morph_from_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-slate-800">نوع صندوق المصدر</FormLabel>
                  <FormControl>
                    <RadioGroup
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        form.setValue('morph_from_id', undefined as any);
                        form.setValue('from_company_fund_id', undefined);
                        form.setValue('from_user_role', '');
                        form.setValue('from_user_id', undefined);
                        form.setValue('from_user_fund_id', undefined);
                        form.setValue('from_project_fund_id', undefined);
                        form.setValue('from_project_id', undefined);
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

            {morphFromType === 'App\\Models\\CompanyFundCurrency' && (
              <div className="grid gap-4 md:grid-cols-2 pt-2">
                <FormField
                  control={form.control}
                  name="from_company_fund_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>صناديق الشركة</FormLabel>
                      <Select
                        value={field.value ? String(field.value) : ''}
                        onValueChange={(val) => {
                          field.onChange(Number(val));
                          form.setValue('morph_from_id', undefined as any);
                        }}
                      >
                        <FormControl>
                          <SelectTrigger>
                            {field.value
                              ? (selectedFromCompanyFund?.name || 'اختر صندوق الشركة')
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
                  name="morph_from_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>عملة الصندوق</FormLabel>
                      <Select
                        value={field.value ? String(field.value) : ''}
                        onValueChange={(val) => field.onChange(Number(val))}
                        disabled={!fromCompanyFundId}
                      >
                        <FormControl>
                          <SelectTrigger disabled={!fromCompanyFundId}>
                            {field.value
                              ? (() => {
                                const c = selectedFromCompanyFund?.currencies?.find(curr => currencyMatchesExpenseableId(curr, Number(field.value)));
                                return c ? getCurrencyLabel(c) : 'اختر العملة';
                              })()
                              : <SelectValue placeholder="اختر العملة" />}
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(selectedFromCompanyFund?.currencies ?? []).map((currency) => {
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

            {morphFromType === 'App\\Models\\ProjectFundCurrency' && (
              <div className="grid gap-4 md:grid-cols-3 pt-2 items-baseline">
                <FormField
                  control={form.control}
                  name="from_project_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>المشروع</FormLabel>
                      <Select
                        value={field.value ? String(field.value) : ''}
                        onValueChange={(val) => {
                          field.onChange(Number(val));
                          form.setValue('from_project_fund_id', undefined);
                          form.setValue('morph_from_id', undefined as any);
                        }}
                      >
                        <FormControl>
                          <SelectTrigger>
                            {field.value
                              ? (projects.find(p => p.id === field.value)?.name || 'اختر المشروع')
                              : <SelectValue placeholder="اختر المشروع" />}
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
                  name="from_project_fund_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>صندوق المشروع</FormLabel>
                      <Select
                        value={field.value ? String(field.value) : ''}
                        onValueChange={(val) => {
                          field.onChange(Number(val));
                          form.setValue('morph_from_id', undefined as any);
                        }}
                        disabled={!selectedFromProjectId}
                      >
                        <FormControl>
                          <SelectTrigger disabled={!selectedFromProjectId}>
                            {field.value
                              ? (fromProjectFunds.find(f => f.id === field.value)?.name || 'اختر صندوق المشروع')
                              : <SelectValue placeholder="اختر صندوق المشروع" />}
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {fromProjectFunds.map((fund) => (
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
                  name="morph_from_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>عملة الصندوق</FormLabel>
                      <Select
                        value={field.value ? String(field.value) : ''}
                        onValueChange={(val) => field.onChange(Number(val))}
                        disabled={!fromProjectFundId}
                      >
                        <FormControl>
                          <SelectTrigger disabled={!fromProjectFundId}>
                            {field.value
                              ? (() => {
                                const c = selectedFromProjectFund?.currencies?.find(curr => currencyMatchesExpenseableId(curr, Number(field.value)));
                                return c ? getCurrencyLabel(c) : 'اختر العملة';
                              })()
                              : <SelectValue placeholder="اختر العملة" />}
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(selectedFromProjectFund?.currencies ?? []).map((currency) => {
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

            {morphFromType === 'App\\Models\\CurrencyFund' && (
              <div className="grid gap-4 md:grid-cols-4 pt-2 items-baseline">
                <FormField
                  control={form.control}
                  name="from_user_role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نوع المستخدم</FormLabel>
                      <Select
                        value={field.value ?? ''}
                        onValueChange={(val) => {
                          field.onChange(val);
                          form.setValue('from_user_id', undefined);
                          form.setValue('from_user_fund_id', undefined);
                          form.setValue('morph_from_id', undefined as any);
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
                  name="from_user_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>المستخدم</FormLabel>
                      <FormControl>
                        <SearchableSelect
                          value={field.value}
                          onValueChange={(val) => {
                            field.onChange(Number(val));
                            form.setValue('from_user_fund_id', undefined);
                            form.setValue('morph_from_id', undefined as any);
                          }}
                          disabled={!fromUserRole}
                          placeholder="اختر المستخدم"
                          options={fromRoleUsers.map((item) => ({
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
                  name="from_user_fund_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>صندوق المستخدم</FormLabel>
                      <Select
                        value={field.value ? String(field.value) : ''}
                        onValueChange={(val) => {
                          field.onChange(Number(val));
                          form.setValue('morph_from_id', undefined as any);
                        }}
                        disabled={!fromUserId}
                      >
                        <FormControl>
                          <SelectTrigger disabled={!fromUserId}>
                            {field.value
                              ? (selectedFromUserFund ? getFundLabel(selectedFromUserFund) : 'اختر صندوق المستخدم')
                              : <SelectValue placeholder="اختر صندوق المستخدم" />}
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(() => {
                            const list = selectedFromUserRecord?.user.funds ?? [];
                            return [...list].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
                          })().map((fund) => (
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
                  name="morph_from_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>عملة الصندوق</FormLabel>
                      <Select
                        value={field.value ? String(field.value) : ''}
                        onValueChange={(val) => field.onChange(Number(val))}
                        disabled={!fromUserFundId}
                      >
                        <FormControl>
                          <SelectTrigger disabled={!fromUserFundId}>
                            {field.value
                              ? (() => {
                                const c = selectedFromUserFund?.currencies?.find(curr => currencyMatchesExpenseableId(curr, Number(field.value)));
                                return c ? getCurrencyLabel(c) : 'اختر العملة';
                              })()
                              : <SelectValue placeholder="اختر العملة" />}
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(selectedFromUserFund?.currencies ?? []).map((currency) => {
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
        )}

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
            <div className="grid gap-4 md:grid-cols-3 pt-2  items-baseline">
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
            <div className="grid gap-4 md:grid-cols-4 pt-2 items-baseline">
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
                        {(() => {
                          const list = selectedFundUserRecord?.user.funds ?? [];
                          return [...list].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
                        })().map((fund) => (
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

        <div className="flex justify-end mt-4">
          <Button type="submit" className="w-auto px-8" disabled={loading}>
            {loading ? (defaultValues ? 'جاري التعديل...' : 'جاري التحويل...') : (defaultValues ? 'حفظ التعديلات' : 'تأكيد التحويل')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
