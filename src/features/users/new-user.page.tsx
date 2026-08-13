import { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type SubmitHandler } from 'react-hook-form';
import * as z from 'zod';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { User, Wallet, BadgeDollarSign, Pencil, Mail, Phone, MapPin, Briefcase, DollarSign, Heart, Calendar, ShieldCheck, Cloud } from 'lucide-react';
import dayjs from 'dayjs';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { PageHeader } from '@/features/components/page-header';
import { FundsPage } from '@/features/funds/funds.page';
import { EmployeePaymentsPage } from '@/features/employee-payments/employee-payments.page';
import { UserCloudStorageTab } from './components/user-cloud-storage-tab';
import { usersApi } from './api/users.api';
import type {
  CreateUserPayload,
  UserRole,
  AdminRecord,
  ClientRecord,
  InvestorRecord,
  CraftsmanRecord,
  EmployeeRecord,
  EngineerRecord,
  SupplierRecord,
  TrusteeRecord,
} from './types';

const userRoles: UserRole[] = ['admin', 'client', 'investor', 'craftsman', 'employee', 'engineer', 'supplier', 'trustee'];

const userRoleLabels: Record<UserRole, string> = {
  admin: 'المدير',
  client: 'العميل',
  investor: 'المستثمر',
  craftsman: 'الحرفي',
  employee: 'الموظف',
  engineer: 'المهندس',
  supplier: 'المورد',
  trustee: 'الأمين',
};

function isUserRole(value: string | null | undefined): value is UserRole {
  return Boolean(value && userRoles.includes(value as UserRole));
}

const baseSchema = z
  .object({
    name: z.string().min(1, 'الاسم مطلوب'),
    email: z.string().email('البريد الإلكتروني غير صحيح'),
    password: z.string().optional(),
    phone_number: z.string().min(6, 'رقم الهاتف مطلوب'),
    address: z.string().min(1, 'العنوان مطلوب'),
    role: z.enum(['admin', 'client', 'investor', 'craftsman', 'employee', 'engineer', 'supplier', 'trustee']),
    investment_ratio: z.string().optional(),
    job_title: z.string().optional(),
    base_salary: z.string().optional(),
    kinship_relation: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    if (values.role === 'investor' && !values.investment_ratio?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['investment_ratio'],
        message: 'نسبة الاستثمار مطلوبة',
      });
    }

    if ((values.role === 'employee' || values.role === 'engineer') && !values.job_title?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['job_title'],
        message: 'المسمى الوظيفي مطلوب',
      });
    }

    if (values.role === 'engineer') {
      if (!values.base_salary?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['base_salary'],
          message: 'الراتب الأساسي مطلوب',
        });
      }
    }
  });

type NewUserFormValues = z.infer<typeof baseSchema>;

const defaultValues: NewUserFormValues = {
  name: '',
  email: '',
  password: '',
  phone_number: '',
  address: '',
  role: 'admin',
  investment_ratio: '',
  job_title: '',
  base_salary: '',
  kinship_relation: '',
};

function buildPayload(values: NewUserFormValues): CreateUserPayload {
  const base = {
    name: values.name,
    email: values.email,
    password: values.password ?? '',
    phone_number: values.phone_number,
    address: values.address,
    role: values.role,
  } as const;

  switch (values.role) {
    case 'investor':
      return { ...base, role: 'investor', investment_ratio: values.investment_ratio ?? '' };
    case 'employee':
      return { ...base, role: 'employee', job_title: values.job_title ?? '' };
    case 'engineer':
      return { ...base, role: 'engineer', job_title: values.job_title ?? '', base_salary: values.base_salary ?? '' };
    case 'trustee':
      return { ...base, role: 'trustee', kinship_relation: values.kinship_relation ?? '' };
    default:
      return base;
  }
}

function mapRecordToFormValues(
  record:
    | AdminRecord
    | ClientRecord
    | InvestorRecord
    | CraftsmanRecord
    | EmployeeRecord
    | EngineerRecord
    | SupplierRecord
    | TrusteeRecord,
  forcedRole: UserRole
): NewUserFormValues {
  const base = { ...defaultValues, name: record.user.name, email: record.user.email, phone_number: record.user.phone_number, address: record.user.address };
  if ('investment_ratio' in record) return { ...base, role: forcedRole, investment_ratio: String(record.investment_ratio ?? '') };
  if ('base_salary' in record) return { ...base, role: forcedRole, job_title: String(record.job_title ?? ''), base_salary: String(record.base_salary ?? '') };
  if ('job_title' in record) return { ...base, role: forcedRole, job_title: String(record.job_title ?? '') };
  if ('kinship_relation' in record) return { ...base, role: forcedRole, kinship_relation: String(record.kinship_relation ?? '') };
  return { ...base, role: forcedRole };
}

type NewUserPageProps = {
  embedded?: boolean;
  createRole?: UserRole;
  onClose?: () => void;
  onCreated?: () => void;
};

export function NewUserPage({ embedded = false, createRole, onClose, onCreated }: NewUserPageProps = {}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const editMode = Boolean(params.id && params.role);
  const role = params.role as UserRole | undefined;
  const id = params.id ? Number(params.id) : undefined;
  const returnRole = searchParams.get('returnRole') || (role ? role : undefined);
  const initialRole = isUserRole(role) ? role : createRole ?? 'admin';

  const [isEditingMode, setIsEditingMode] = useState(false);

  const form = useForm<NewUserFormValues>({
    resolver: zodResolver(baseSchema),
    defaultValues: {
      ...defaultValues,
      role: initialRole,
    },
  });
  const watchedRole = form.watch('role');

  const userQuery = useQuery({
    queryKey: ['users', 'detail', role, id] as const,
    queryFn: async () => {
      if (!role || !id) throw new Error('Missing user identifier');
      return usersApi.getUserByRole(role, id);
    },
    enabled: editMode && Boolean(role) && Boolean(id),
  });

  useEffect(() => {
    if (userQuery.data && role) {
      form.reset(mapRecordToFormValues(userQuery.data, role));
    }
  }, [form, role, userQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async (values: NewUserFormValues) => {
      if (editMode && role && id) {
        const payload = buildPayload(values);
        const updatePayload = { ...payload, ...(payload.password === '' ? { password: undefined } : {}) };
        await usersApi.updateUserByRole(role, id, updatePayload);
        return;
      }
      await usersApi.createUser(buildPayload(values));
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      if (editMode) {
        setIsEditingMode(false);
      } else if (embedded) {
        onCreated?.();
        onClose?.();
      } else {
        navigate(`/users${returnRole ? `?tab=${returnRole}` : ''}`, { replace: true });
      }
    },
  });

  const onSubmit: SubmitHandler<NewUserFormValues> = async (values) => {
    await saveMutation.mutateAsync(values);
  };

  const roleFields = useMemo(
    () => ({
      investor: watchedRole === 'investor',
      employee: watchedRole === 'employee',
      engineer: watchedRole === 'engineer',
      trustee: watchedRole === 'trustee',
    }),
    [watchedRole]
  );

  const activeRole = role || watchedRole;
  const isEmployee = activeRole === 'employee';

  const USER_TABS = useMemo(() => {
    const tabs = [
      { value: 'details', label: 'التفاصيل', icon: <User className="size-4" /> },
      { value: 'funds', label: 'الصناديق', icon: <Wallet className="size-4" /> },
      { value: 'cloud', label: 'التخزين السحابي', icon: <Cloud className="size-4" /> },
    ];
    if (isEmployee) {
      tabs.push({ value: 'payments', label: 'الرواتب', icon: <BadgeDollarSign className="size-4" /> });
    }
    return tabs;
  }, [isEmployee]);

  const rawTab = searchParams.get('tab');
  const activeTab = rawTab === 'funds' || rawTab === 'payments' || rawTab === 'cloud' ? rawTab : 'details';

  if (!editMode) {
    return (
      <Card className={embedded ? 'min-w-0 border-0 shadow-none' : 'min-w-0 overflow-hidden'}>
        <CardHeader className="px-4 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl font-semibold tracking-tight text-foreground">
                إضافة مستخدم
              </CardTitle>
              <p className="text-sm text-muted-foreground">إنشاء مستخدم جديد مع الحقول المرتبطة بنوعه</p>
            </div>

          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-1 sm:px-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <FormField control={form.control} name="name" render={({ field }) => (<FormItem className="space-y-1.5"><FormLabel>الاسم</FormLabel><FormControl><Input {...field} className="h-10" /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="email" render={({ field }) => (<FormItem className="space-y-1.5"><FormLabel>البريد الإلكتروني</FormLabel><FormControl><Input {...field} className="h-10" /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="phone_number" render={({ field }) => (<FormItem className="space-y-1.5"><FormLabel>رقم الهاتف</FormLabel><FormControl><Input {...field} className="h-10" /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="password" render={({ field }) => (<FormItem className="space-y-1.5"><FormLabel>كلمة المرور</FormLabel><FormControl><Input {...field} type="password" className="h-10" /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="role" render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel>نوع المستخدم</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="اختر نوع المستخدم">
                          {field.value ? userRoleLabels[field.value] : null}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {userRoles.map((item) => (
                        <SelectItem key={item} value={item}>
                          {userRoleLabels[item]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="address" render={({ field }) => (<FormItem className="space-y-1.5"><FormLabel>العنوان</FormLabel><FormControl><Input {...field} className="h-10" /></FormControl><FormMessage /></FormItem>)} />

              {roleFields.investor ? <FormField control={form.control} name="investment_ratio" render={({ field }) => (<FormItem className="space-y-1.5"><FormLabel>نسبة الاستثمار</FormLabel><FormControl><Input {...field} className="h-10" /></FormControl><FormMessage /></FormItem>)} /> : null}
              {roleFields.employee || roleFields.engineer ? <FormField control={form.control} name="job_title" render={({ field }) => (<FormItem className="space-y-1.5"><FormLabel>المسمى الوظيفي</FormLabel><FormControl><Input {...field} className="h-10" /></FormControl><FormMessage /></FormItem>)} /> : null}
              {roleFields.engineer ? <FormField control={form.control} name="base_salary" render={({ field }) => (<FormItem className="space-y-1.5"><FormLabel>الراتب الأساسي</FormLabel><FormControl><Input {...field} className="h-10" /></FormControl><FormMessage /></FormItem>)} /> : null}
              <div className="flex flex-col-reverse gap-2 pt-2 sm:col-span-2 sm:flex-row sm:justify-end lg:col-span-3">
                <Button type="submit" className="w-full sm:w-auto" disabled={saveMutation.isPending}>{saveMutation.isPending ? 'جاري الحفظ...' : 'حفظ المستخدم'}</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    );
  }

  const currentUserData = userQuery.data;
  const userName = currentUserData?.user.name || form.watch('name') || 'المستخدم';
  const userEmail = currentUserData?.user.email || form.watch('email');
  const userPhone = currentUserData?.user.phone_number || form.watch('phone_number');
  const userAddress = currentUserData?.user.address || form.watch('address');
  const createdAtFormatted = currentUserData?.created_at ? dayjs(currentUserData.created_at).format('YYYY-MM-DD') : undefined;

  let extraFieldLabel = '';
  let extraFieldValue = '';
  if (currentUserData) {
    if ('investment_ratio' in currentUserData && currentUserData.investment_ratio) {
      extraFieldLabel = 'نسبة الاستثمار';
      extraFieldValue = String(currentUserData.investment_ratio);
    } else if ('base_salary' in currentUserData && currentUserData.base_salary) {
      extraFieldLabel = 'الراتب الأساسي';
      extraFieldValue = String(currentUserData.base_salary);
    } else if ('job_title' in currentUserData && currentUserData.job_title) {
      extraFieldLabel = 'المسمى الوظيفي';
      extraFieldValue = String(currentUserData.job_title);
    }
  }

  return (
    <div className="min-w-0 space-y-4 sm:space-y-5">
      <PageHeader
        badge={userRoleLabels[activeRole] || 'المستخدم'}
        icon={User}
        title={userName}
        tabs={USER_TABS}
        defaultTab="details"

      />

      <div className="surface-panel min-w-0 overflow-hidden p-3 sm:p-5">
        {activeTab === 'details' && (
          <div>
            {!isEditingMode ? (
              <div className="space-y-3">
                <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <User className="size-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{userName}</h3>
                      <p className="text-xs text-muted-foreground">{userRoleLabels[activeRole]}</p>
                    </div>
                  </div>
                  <Button type="button" onClick={() => setIsEditingMode(true)} className="w-full gap-2 sm:w-auto">
                    <Pencil className="size-4" />
                    تعديل البيانات
                  </Button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <div className="flex items-start gap-3 rounded-lg border border-border/70 bg-card p-3.5">
                    <Mail className="mt-0.5 size-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">البريد الإلكتروني</p>
                      <p dir="ltr" className="mt-0.5 break-all text-start text-sm font-medium text-foreground">{userEmail || '-'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-lg border border-border/70 bg-card p-3.5">
                    <Phone className="mt-0.5 size-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">رقم الهاتف</p>
                      <p dir="ltr" className="mt-0.5 break-all text-start text-sm font-medium text-foreground">{userPhone || '-'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-lg border border-border/70 bg-card p-3.5">
                    <MapPin className="mt-0.5 size-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">العنوان</p>
                      <p className="mt-0.5 break-words text-sm font-medium text-foreground">{userAddress || '-'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-lg border border-border/70 bg-card p-3.5">
                    <ShieldCheck className="mt-0.5 size-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">نوع المستخدم</p>
                      <p className="mt-0.5 truncate text-sm font-medium text-foreground">{userRoleLabels[activeRole]}</p>
                    </div>
                  </div>

                  {extraFieldLabel ? (
                    <div className="flex items-start gap-3 rounded-lg border border-border/70 bg-card p-3.5">
                      {extraFieldLabel.includes('المسمى') ? (
                        <Briefcase className="mt-0.5 size-4 text-muted-foreground shrink-0" />
                      ) : extraFieldLabel.includes('الراتب') || extraFieldLabel.includes('استثمار') ? (
                        <DollarSign className="mt-0.5 size-4 text-muted-foreground shrink-0" />
                      ) : (
                        <Heart className="mt-0.5 size-4 text-muted-foreground shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground">{extraFieldLabel}</p>
                        <p className="mt-0.5 truncate text-sm font-medium text-foreground">{extraFieldValue}</p>
                      </div>
                    </div>
                  ) : null}

                  {createdAtFormatted ? (
                    <div className="flex items-start gap-3 rounded-lg border border-border/70 bg-card p-3.5">
                      <Calendar className="mt-0.5 size-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground">تاريخ الإنشاء</p>
                        <p className="mt-0.5 truncate text-sm font-medium text-foreground">{createdAtFormatted}</p>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <FormField control={form.control} name="name" render={({ field }) => (<FormItem className="space-y-1.5"><FormLabel>الاسم</FormLabel><FormControl><Input {...field} className="h-10" /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="email" render={({ field }) => (<FormItem className="space-y-1.5"><FormLabel>البريد الإلكتروني</FormLabel><FormControl><Input {...field} className="h-10" /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="phone_number" render={({ field }) => (<FormItem className="space-y-1.5"><FormLabel>رقم الهاتف</FormLabel><FormControl><Input {...field} className="h-10" /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="address" render={({ field }) => (<FormItem className="space-y-1.5 sm:col-span-2 lg:col-span-3"><FormLabel>العنوان</FormLabel><FormControl><Input {...field} className="h-10" /></FormControl><FormMessage /></FormItem>)} />
                  {roleFields.investor ? <FormField control={form.control} name="investment_ratio" render={({ field }) => (<FormItem className="space-y-1.5"><FormLabel>نسبة الاستثمار</FormLabel><FormControl><Input {...field} className="h-10" /></FormControl><FormMessage /></FormItem>)} /> : null}
                  {roleFields.employee || roleFields.engineer ? <FormField control={form.control} name="job_title" render={({ field }) => (<FormItem className="space-y-1.5"><FormLabel>المسمى الوظيفي</FormLabel><FormControl><Input {...field} className="h-10" /></FormControl><FormMessage /></FormItem>)} /> : null}
                  {roleFields.engineer ? <FormField control={form.control} name="base_salary" render={({ field }) => (<FormItem className="space-y-1.5"><FormLabel>الراتب الأساسي</FormLabel><FormControl><Input {...field} className="h-10" /></FormControl><FormMessage /></FormItem>)} /> : null}
                  <div className="flex flex-col-reverse gap-2 pt-2 sm:col-span-2 sm:flex-row sm:justify-end lg:col-span-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full sm:w-auto"
                      onClick={() => setIsEditingMode(false)}
                    >
                      إلغاء التعديل
                    </Button>
                    <Button type="submit" className="w-full sm:w-auto" disabled={saveMutation.isPending}>{saveMutation.isPending ? 'جاري الحفظ...' : 'حفظ التعديلات'}</Button>
                  </div>
                </form>
              </Form>
            )}
          </div>
        )}

        {activeTab === 'funds' && <FundsPage />}

        {activeTab === 'cloud' && currentUserData?.user.id && (
          <UserCloudStorageTab userId={currentUserData.user.id} />
        )}

        {activeTab === 'payments' && isEmployee && <EmployeePaymentsPage />}
      </div>
    </div>
  );
}
