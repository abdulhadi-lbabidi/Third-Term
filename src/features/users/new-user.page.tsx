import { useEffect, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type SubmitHandler } from 'react-hook-form';
import * as z from 'zod';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/shared/components/ui/radio-group';
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
  trustee: 'الوصي',
};

function isUserRole(value: string | null): value is UserRole {
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

    if (values.role === 'trustee' && !values.kinship_relation?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['kinship_relation'],
        message: 'صلة القرابة مطلوبة',
      });
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

export function NewUserPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const editMode = Boolean(params.id && params.role);
  const role = params.role as UserRole | undefined;
  const id = params.id ? Number(params.id) : undefined;
  const returnRole = searchParams.get('tab');
  const initialRole = isUserRole(returnRole) ? returnRole : 'admin';

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

  useEffect(() => {
    if (!editMode && isUserRole(returnRole) && form.getValues('role') !== returnRole) {
      form.setValue('role', returnRole, {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: true,
      });
    }
  }, [editMode, form, returnRole]);

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
      navigate(`/users${returnRole ? `?tab=${returnRole}` : ''}`, { replace: true });
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

  return (
    <Card className="overflow-hidden">
      <CardHeader className="px-6">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-2xl font-semibold tracking-tight text-foreground">
              {editMode ? 'تعديل مستخدم' : 'إضافة مستخدم'}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{editMode ? 'تحديث بيانات المستخدم الحالية' : 'إنشاء مستخدم جديد مع الحقول المرتبطة بنوعه'}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/users${returnRole ? `?tab=${returnRole}` : ''}`)}
          >
            رجوع
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-3 pt-1">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-3">
            <FormField control={form.control} name="name" render={({ field }) => (<FormItem className="space-y-1.5"><FormLabel>الاسم</FormLabel><FormControl><Input {...field} className="h-10" /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="email" render={({ field }) => (<FormItem className="space-y-1.5"><FormLabel>البريد الإلكتروني</FormLabel><FormControl><Input {...field} className="h-10" /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="phone_number" render={({ field }) => (<FormItem className="space-y-1.5"><FormLabel>رقم الهاتف</FormLabel><FormControl><Input {...field} className="h-10" /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="password" render={({ field }) => (<FormItem className="space-y-1.5"><FormLabel>كلمة المرور</FormLabel><FormControl><Input {...field} type="password" disabled={editMode} placeholder={editMode ? 'اتركه فارغًا للاحتفاظ بكلمة المرور الحالية' : ''} className="h-10" /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="address" render={({ field }) => (<FormItem className="space-y-1.5 col-span-2"><FormLabel>العنوان</FormLabel><FormControl><Input {...field} className="h-10" /></FormControl><FormMessage /></FormItem>)} />

            <FormField control={form.control} name="role" render={({ field }) => (
              <FormItem className="md:col-span-3 rounded-lg border border-border bg-muted/40 p-3.5">
                <FormLabel className="mb-3 block">نوع المستخدم</FormLabel>
                <FormControl>
                  <RadioGroup value={field.value} onValueChange={field.onChange} className="grid grid-cols-8">
                    {userRoles.map((item) => (
                      <RadioGroupItem key={item} value={item} disabled={editMode}>
                        {userRoleLabels[item]}
                      </RadioGroupItem>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            {roleFields.investor ? <FormField control={form.control} name="investment_ratio" render={({ field }) => (<FormItem className="md:col-span-1"><FormLabel>نسبة الاستثمار</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} /> : null}
            {roleFields.employee || roleFields.engineer ? <FormField control={form.control} name="job_title" render={({ field }) => (<FormItem className="md:col-span-1"><FormLabel>المسمى الوظيفي</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} /> : null}
            {roleFields.engineer ? <FormField control={form.control} name="base_salary" render={({ field }) => (<FormItem className="md:col-span-1"><FormLabel>الراتب الأساسي</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} /> : null}
            {roleFields.trustee ? <FormField control={form.control} name="kinship_relation" render={({ field }) => (<FormItem className="md:col-span-1"><FormLabel>صلة القرابة</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} /> : null}
            <div className="md:col-span-3 flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/users${returnRole ? `?tab=${returnRole}` : ''}`)}
              >
                إلغاء
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>{saveMutation.isPending ? 'جاري الحفظ...' : editMode ? 'حفظ التعديلات' : 'حفظ المستخدم'}</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
