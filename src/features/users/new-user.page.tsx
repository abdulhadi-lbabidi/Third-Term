import { useEffect, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type SubmitHandler } from 'react-hook-form';
import * as z from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import { useTranslation } from 'react-i18next';
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

const baseSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().optional(),
  phone_number: z.string().min(6, 'Phone number is required'),
  address: z.string().min(1, 'Address is required'),
  role: z.enum(['admin', 'client', 'investor', 'craftsman', 'employee', 'engineer', 'supplier', 'trustee']),
  investment_ratio: z.string().optional(),
  job_title: z.string().optional(),
  base_salary: z.string().optional(),
  kinship_relation: z.string().optional(),
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
  const base = {
    ...defaultValues,
    name: record.user.name,
    email: record.user.email,
    phone_number: record.user.phone_number,
    address: record.user.address,
  };

  if ('investment_ratio' in record) {
    return { ...base, role: forcedRole, investment_ratio: String(record.investment_ratio ?? '') };
  }
  if ('base_salary' in record) {
    return {
      ...base,
      role: forcedRole,
      job_title: String(record.job_title ?? ''),
      base_salary: String(record.base_salary ?? ''),
    };
  }
  if ('job_title' in record) {
    return { ...base, role: forcedRole, job_title: String(record.job_title ?? '') };
  }
  if ('kinship_relation' in record) {
    return { ...base, role: forcedRole, kinship_relation: String(record.kinship_relation ?? '') };
  }

  return { ...base, role: forcedRole };
}

export function NewUserPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const params = useParams();
  const editMode = Boolean(params.id && params.role);
  const role = params.role as UserRole | undefined;
  const id = params.id ? Number(params.id) : undefined;

  const form = useForm<NewUserFormValues>({
    resolver: zodResolver(baseSchema),
    defaultValues,
  });

  const watchedRole = form.watch('role');

  useEffect(() => {
    async function loadUser() {
      if (!editMode || !role || !id) return;
      const response = await usersApi.getUserByRole(role, id);
      form.reset(mapRecordToFormValues(response, role));
    }

    void loadUser();
  }, [editMode, role, id, form]);

  const roleFields = useMemo(
    () => ({
      investor: watchedRole === 'investor',
      employee: watchedRole === 'employee',
      engineer: watchedRole === 'engineer',
      trustee: watchedRole === 'trustee',
    }),
    [watchedRole]
  );

  const onSubmit: SubmitHandler<NewUserFormValues> = async (values) => {
    if (editMode && role && id) {
      const payload = buildPayload(values);
      const updatePayload = {
        ...payload,
        ...(payload.password === '' ? { password: undefined } : {}),
      };
      await usersApi.updateUserByRole(role, id, updatePayload);
    } else {
      await usersApi.createUser(buildPayload(values));
    }
    navigate('/users', { replace: true });
  };

  return (
    <Card className="overflow-hidden rounded-lg border border-slate-200/80 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
      <CardHeader className="px-6">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
           
            <CardTitle className="text-3xl font-semibold tracking-tight text-slate-950">
              {editMode ? t('users.form.editTitle') : t('users.form.addTitle')}
            </CardTitle>
            <p className="text-sm text-slate-500">
              {editMode ? t('users.form.editDescription') : t('users.form.addDescription')}
            </p>
          </div>
          <Button type="button" variant="outline" className="h-11 rounded-lg border-slate-200 bg-white px-5 text-sm font-semibold text-slate-900 hover:bg-slate-50" onClick={() => navigate('/users')}>
            {t('users.form.back')}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-3 pt-1">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-2">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="text-sm font-semibold text-slate-900">{t('users.form.name')}</FormLabel>
                <FormControl><Input {...field} className="h-11 rounded-lg border-slate-200 bg-white shadow-none focus-visible:border-slate-400 focus-visible:ring-2 focus-visible:ring-slate-200" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="text-sm font-semibold text-slate-900">{t('users.form.email')}</FormLabel>
                <FormControl><Input {...field} className="h-11 rounded-lg border-slate-200 bg-white shadow-none focus-visible:border-slate-400 focus-visible:ring-2 focus-visible:ring-slate-200" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="password" render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="text-sm font-semibold text-slate-900">{t('users.form.password')}</FormLabel>
                <FormControl><Input {...field} type="password" disabled={editMode} placeholder={editMode ? t('users.form.keepPassword') : ''} className="h-11 rounded-lg border-slate-200 bg-white shadow-none focus-visible:border-slate-400 focus-visible:ring-2 focus-visible:ring-slate-200" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="phone_number" render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="text-sm font-semibold text-slate-900">{t('users.form.phoneNumber')}</FormLabel>
                <FormControl><Input {...field} className="h-11 rounded-lg border-slate-200 bg-white shadow-none focus-visible:border-slate-400 focus-visible:ring-2 focus-visible:ring-slate-200" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="address" render={({ field }) => (
              <FormItem className="md:col-span-2 space-y-1.5">
                <FormLabel className="text-sm font-semibold text-slate-900">{t('users.form.address')}</FormLabel>
                <FormControl><Input {...field} className="h-11 rounded-lg border-slate-200 bg-white shadow-none focus-visible:border-slate-400 focus-visible:ring-2 focus-visible:ring-slate-200" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem className="md:col-span-2 rounded-[24px] border border-slate-200 bg-slate-50/70 p-3.5">
                  <FormLabel className="mb-3 block text-sm font-semibold text-slate-900">
                    {t('users.form.userType')}
                  </FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                      {userRoles.map((item) => (
                        <label
                          key={item}
                          className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm capitalize text-slate-700 transition-colors hover:border-slate-300"
                        >
                          <input
                            type="radio"
                            value={item}
                            checked={field.value === item}
                            onChange={field.onChange}
                            disabled={editMode}
                            className="accent-slate-950"
                          />
                          <span>{t(`users.tabs.${item}`)}</span>
                        </label>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {roleFields.investor ? (
              <FormField control={form.control} name="investment_ratio" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('users.form.investmentRatio')}</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            ) : null}

            {roleFields.employee || roleFields.engineer ? (
              <FormField control={form.control} name="job_title" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('users.form.jobTitle')}</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            ) : null}

            {roleFields.engineer ? (
              <FormField control={form.control} name="base_salary" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('users.form.baseSalary')}</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            ) : null}

            {roleFields.trustee ? (
              <FormField control={form.control} name="kinship_relation" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('users.form.kinshipRelation')}</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            ) : null}

            <div className="md:col-span-2 flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" className="h-11 rounded-lg border-slate-200 bg-white px-5 text-sm font-semibold text-slate-900 hover:bg-slate-50" onClick={() => navigate('/users')}>{t('users.form.cancel')}</Button>
              <Button type="submit" className="h-11 rounded-lg bg-slate-950 px-5 text-sm font-semibold text-white hover:bg-slate-800">{editMode ? t('users.form.saveChanges') : t('users.form.save')}</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
