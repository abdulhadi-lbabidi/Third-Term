import { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type SubmitHandler } from 'react-hook-form';
import * as z from 'zod';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { User, Wallet, BadgeDollarSign, Pencil, Mail, Phone, MapPin, Briefcase, DollarSign, Heart, Calendar, ShieldCheck, Cloud, UploadCloud, X, KeyRound } from 'lucide-react';
import dayjs from 'dayjs';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { PageHeader } from '@/features/components/page-header';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { toast } from 'sonner';
import { FundsPage } from '@/features/funds/funds.page';
import { EmployeePaymentsPage } from '@/features/employee-payments/employee-payments.page';
import { UserCloudStorageTab } from './components/user-cloud-storage-tab';
import { usersApi } from './api/users.api';
import { projectsApi } from '@/features/projects/projects.api';
import { ImageLightbox } from './components/image-lightbox';
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

function FilePreviewItem({ file, onRemove }: { file: File; onRemove: () => void }) {
  const [url, setUrl] = useState<string>('');
  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);
  if (!url) return null;
  return (
    <div className="group relative size-20 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
      <img src={url} alt={file.name} className="h-full w-full object-cover" />
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-1 top-1 rounded-full bg-destructive p-1 text-destructive-foreground transition-opacity hover:bg-destructive/95"
      >
        <X className="size-3" />
      </button>
    </div>
  );
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
    status: z.enum(['active', 'retired', 'resigned']).optional(),
    department_id: z.string().optional(),
    base_salary: z.string().optional(),
    kinship_relation: z.string().optional(),
    images: z.array(z.any()).optional(),
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
  status: 'active',
  department_id: '',
  base_salary: '',
  kinship_relation: '',
  images: [],
};

function buildPayload(values: NewUserFormValues): CreateUserPayload {
  const base = {
    name: values.name,
    email: values.email,
    password: values.password ?? '',
    phone_number: values.phone_number,
    address: values.address,
    role: values.role,
    images: values.images,
  } as const;

  switch (values.role) {
    case 'investor':
      return { ...base, role: 'investor', investment_ratio: values.investment_ratio ?? '' };
    case 'employee':
      return { ...base, role: 'employee', job_title: values.job_title ?? '', status: values.status ?? 'active', department_id: values.department_id ? Number(values.department_id) : undefined };
    case 'engineer':
      return { ...base, role: 'engineer', job_title: values.job_title ?? '', base_salary: values.base_salary ?? '', department_id: values.department_id ? Number(values.department_id) : undefined };
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
  if ('base_salary' in record) return { ...base, role: forcedRole, job_title: String(record.job_title ?? ''), base_salary: String(record.base_salary ?? ''), department_id: 'department_id' in record && record.department_id ? String(record.department_id) : ('department' in record && (record as any).department?.id ? String((record as any).department.id) : '') };
  if ('job_title' in record) return { ...base, role: forcedRole, job_title: String(record.job_title ?? ''), status: 'status' in record ? (record as EmployeeRecord).status || 'active' : 'active', department_id: 'department_id' in record && record.department_id ? String(record.department_id) : ('department' in record && (record as any).department?.id ? String((record as any).department.id) : '') };
  if ('kinship_relation' in record) return { ...base, role: forcedRole, kinship_relation: String(record.kinship_relation ?? '') };
  return { ...base, role: forcedRole };
}

const updatePasswordSchema = z.object({
  password: z.string().min(6, 'كلمة السر يجب أن تكون 6 أحرف على الأقل'),
  password_confirmation: z.string().min(6, 'تأكيد كلمة السر مطلوب'),
}).refine((data) => data.password === data.password_confirmation, {
  message: 'كلمة السر وتأكيدها غير متطابقين',
  path: ['password_confirmation'],
});

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
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [deletedImageIds, setDeletedImageIds] = useState<number[]>([]);

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
        const updatePayload = {
          ...payload,
          ...(payload.password === '' ? { password: undefined } : {}),
          deleted_media_ids: deletedImageIds,
        };
        await usersApi.updateUserByRole(role, id, updatePayload);
        return;
      }
      await usersApi.createUser(buildPayload(values));
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      setDeletedImageIds([]);
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

  const departmentsQuery = useQuery<{ id: number; name: string }[]>({
    queryKey: ['departments'] as const,
    queryFn: () => projectsApi.getDepartments(),
  });
  const departments = departmentsQuery.data ?? [];

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
              {roleFields.employee || roleFields.engineer ? (
                <FormField
                  control={form.control}
                  name="department_id"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel>القسم</FormLabel>
                      <Select value={field.value || ''} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="اختر القسم">
                              {departments.find((d) => String(d.id) === String(field.value))?.name}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept.id} value={String(dept.id)}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : null}
              {roleFields.engineer ? <FormField control={form.control} name="base_salary" render={({ field }) => (<FormItem className="space-y-1.5"><FormLabel>الراتب الأساسي</FormLabel><FormControl><Input {...field} className="h-10" /></FormControl><FormMessage /></FormItem>)} /> : null}
              <FormField
                control={form.control}
                name="images"
                render={({ field }) => (
                  <FormItem className="space-y-1.5 sm:col-span-2 lg:col-span-3">
                    <FormLabel>صور المستخدم</FormLabel>
                    <FormControl>
                      <div className="space-y-3">
                        <div className="relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 px-4 py-6 transition-colors hover:border-muted-foreground/30 bg-slate-50/50">
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            className="absolute inset-0 cursor-pointer opacity-0"
                            onChange={(e) => {
                              const newFiles = Array.from(e.target.files || []);
                              const currentFiles = field.value || [];
                              field.onChange([...currentFiles, ...newFiles]);
                            }}
                          />
                          <UploadCloud className="size-6 text-muted-foreground mb-1 shrink-0" />
                          <span className="text-sm text-muted-foreground">
                            اضغط هنا لاختيار الصور أو اسحبها وأفلتها
                          </span>
                        </div>
                        {field.value && field.value.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {(field.value as File[]).map((file, index) => (
                              <FilePreviewItem
                                key={index}
                                file={file}
                                onRemove={() => {
                                  const newFiles = (field.value as File[]).filter((_, i) => i !== index);
                                  field.onChange(newFiles);
                                }}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
  const employeeStatus = isEmployee && currentUserData && 'status' in currentUserData ? (currentUserData as any).status || 'active' : null;
  const lastPayment = isEmployee && currentUserData && 'last_payment' in currentUserData
    ? (currentUserData as EmployeeRecord).last_payment
    : null;
  const departmentName = (activeRole === 'employee' || activeRole === 'engineer') && currentUserData && 'department' in currentUserData && (currentUserData as any).department ? (currentUserData as any).department.name : null;
  const userName = currentUserData?.user.name || form.watch('name') || 'المستخدم';
  const userEmail = currentUserData?.user.email || form.watch('email');
  const userPhone = currentUserData?.user.phone_number || form.watch('phone_number');
  const userAddress = currentUserData?.user.address || form.watch('address');
  const createdAtFormatted = currentUserData?.created_at ? dayjs(currentUserData.created_at).format('YYYY-MM-DD') : undefined;

  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  const updatePasswordForm = useForm<z.infer<typeof updatePasswordSchema>>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      password: '',
      password_confirmation: '',
    },
  });

  const loggedInUserRole = (() => {
    try {
      const raw = localStorage.getItem('user_info');
      return raw ? JSON.parse(raw)?.role_type || null : null;
    } catch {
      return null;
    }
  })();

  const isAdmin = loggedInUserRole === 'admin';

  const updatePasswordMutation = useMutation({
    mutationFn: (values: z.infer<typeof updatePasswordSchema>) =>
      usersApi.updatePassword({
        email: userEmail,
        password: values.password,
        password_confirmation: values.password_confirmation,
      }),
    onSuccess: () => {
      toast.success('تم تعديل كلمة السر بنجاح');
      setPasswordDialogOpen(false);
      updatePasswordForm.reset();
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error?.message || 'حدث خطأ ما أثناء تعديل كلمة السر';
      toast.error(msg);
    },
  });

  useEffect(() => {
    if (!passwordDialogOpen) {
      updatePasswordForm.reset({
        password: '',
        password_confirmation: '',
      });
    }
  }, [passwordDialogOpen, updatePasswordForm]);

  const allExistingImages = useMemo(() => {
    if (!currentUserData) return [];
    const rawImages = (currentUserData as any).user?.all_images || (currentUserData as any).all_images || (currentUserData as any).user?.images || (currentUserData as any).images || (currentUserData as any).user?.image_url || (currentUserData as any).image_url || (currentUserData as any).user?.image || (currentUserData as any).image;
    if (!rawImages) return [];
    if (Array.isArray(rawImages)) {
      return rawImages.map((img: any, idx: number) => {
        if (typeof img === 'string') {
          return { id: idx, url: img };
        }
        return {
          id: img?.id ?? idx,
          url: img?.url || img?.path || ''
        };
      }).filter((img: any) => Boolean(img.url));
    }
    if (typeof rawImages === 'string') {
      return [{ id: 0, url: rawImages }];
    }
    return [];
  }, [currentUserData]);

  const existingImages = useMemo(() => {
    return allExistingImages.map((img) => img.url);
  }, [allExistingImages]);

  const profileImageUrl = useMemo(() => {
    const firstImage = (currentUserData as any)?.user?.first_image;
    if (typeof firstImage === 'string' && firstImage.trim()) return firstImage;
    return existingImages[0] ?? null;
  }, [currentUserData, existingImages]);

  const employeeJobTitle = isEmployee && currentUserData && 'job_title' in currentUserData
    ? String((currentUserData as EmployeeRecord).job_title || '')
    : null;

  const employeeStatusLabel = employeeStatus === 'active'
    ? 'على رأس عمله'
    : employeeStatus === 'retired'
      ? 'متقاعد'
      : employeeStatus === 'resigned'
        ? 'مستقيل'
        : null;

  const visibleExistingImages = useMemo(() => {
    return allExistingImages.filter((img) => !deletedImageIds.includes(img.id));
  }, [allExistingImages, deletedImageIds]);

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
              <div className="space-y-5">
                <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{userName}</h3>
                    <p className="text-xs text-muted-foreground">{userRoleLabels[activeRole]}</p>
                  </div>
                  <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                    <Button type="button" onClick={() => setIsEditingMode(true)} className="w-full gap-2 sm:w-auto">
                      <Pencil className="size-4" />
                      تعديل البيانات
                    </Button>
                    {isAdmin && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setPasswordDialogOpen(true)}
                        className="w-full gap-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-primary sm:w-auto"
                      >
                        <KeyRound className="size-4" />
                        تعديل كلمة السر
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid gap-5 lg:grid-cols-2">
                  <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm">
                    <div className="border-b border-border/70 bg-muted/30 px-5 py-4">
                      <h4 className="text-sm font-semibold text-foreground">المعلومات الشخصية</h4>
                    </div>
                    <div className="flex flex-col items-center px-5 pb-5 pt-6">
                      <div className="size-28 overflow-hidden rounded-full border-4 border-background bg-muted shadow-md ring-2 ring-primary/10">
                        {profileImageUrl ? (
                          <img src={profileImageUrl} alt={userName} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary">
                            <User className="size-12" />
                          </div>
                        )}
                      </div>
                      <h3 className="mt-4 text-center text-lg font-semibold text-foreground">{userName}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{userRoleLabels[activeRole] || 'مستخدم'}</p>
                    </div>
                    <div className="space-y-0 border-t border-border/70">
                      <div className="flex items-start gap-4 border-b border-border/50 px-5 py-3.5">
                        <span className="w-[110px] shrink-0 text-xs font-medium text-muted-foreground">البريد الإلكتروني</span>
                        <span dir="ltr" className="min-w-0 flex-1 break-all text-left text-sm font-medium text-foreground">{userEmail || '-'}</span>
                      </div>
                      <div className="flex items-start gap-4 px-5 py-3.5">
                        <span className="w-[110px] shrink-0 text-xs font-medium text-muted-foreground">رقم الهاتف</span>
                        <span dir="ltr" className="min-w-0 flex-1 break-all text-left text-sm font-medium text-foreground">{userPhone || '-'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm">
                    <div className="border-b border-border/70 bg-muted/30 px-5 py-4">
                      <h4 className="text-sm font-semibold text-foreground">
                        {isEmployee ? 'المعلومات الوظيفية' : 'معلومات الحساب'}
                      </h4>
                    </div>
                    <div className="space-y-0">
                      <div className="flex items-start gap-4 border-b border-border/50 px-5 py-3.5">
                        <span className="w-[110px] shrink-0 text-xs font-medium text-muted-foreground">نوع المستخدم</span>
                        <span className="min-w-0 flex-1 text-left text-sm font-medium text-foreground">{userRoleLabels[activeRole]}</span>
                      </div>
                      <div className="flex items-start gap-4 border-b border-border/50 px-5 py-3.5">
                        <span className="w-[110px] shrink-0 text-xs font-medium text-muted-foreground">العنوان</span>
                        <span className="min-w-0 flex-1 break-words text-left text-sm font-medium text-foreground">{userAddress || '-'}</span>
                      </div>
                      {createdAtFormatted ? (
                        <div className="flex items-start gap-4 border-b border-border/50 px-5 py-3.5">
                          <span className="w-[110px] shrink-0 text-xs font-medium text-muted-foreground">تاريخ الإنشاء</span>
                          <span dir="ltr" className="min-w-0 flex-1 text-left text-sm font-medium text-foreground">{createdAtFormatted}</span>
                        </div>
                      ) : null}
                      {employeeJobTitle ? (
                        <div className="flex items-start gap-4 border-b border-border/50 px-5 py-3.5">
                          <span className="w-[110px] shrink-0 text-xs font-medium text-muted-foreground">المسمى الوظيفي</span>
                          <span className="min-w-0 flex-1 text-left text-sm font-medium text-foreground">{employeeJobTitle}</span>
                        </div>
                      ) : null}
                      {employeeStatus ? (
                        <div className="flex items-start gap-4 border-b border-border/50 px-5 py-3.5">
                          <span className="w-[110px] shrink-0 text-xs font-medium text-muted-foreground">حالة الموظف</span>
                          <span className="min-w-0 flex-1 text-left">
                            <span className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold ${
                              employeeStatus === 'active'
                                ? 'border-emerald-200/60 bg-emerald-50 text-emerald-700'
                                : employeeStatus === 'retired'
                                  ? 'border-amber-200/60 bg-amber-50 text-amber-700'
                                  : 'border-rose-200/60 bg-rose-50 text-rose-700'
                            }`}>
                              {employeeStatusLabel}
                            </span>
                          </span>
                        </div>
                      ) : null}
                      {departmentName ? (
                        <div className="flex items-start gap-4 border-b border-border/50 px-5 py-3.5">
                          <span className="w-[110px] shrink-0 text-xs font-medium text-muted-foreground">القسم</span>
                          <span className="min-w-0 flex-1 break-words text-left text-sm font-medium text-foreground">{departmentName}</span>
                        </div>
                      ) : null}
                      {extraFieldLabel ? (
                        <div className="flex items-start gap-4 border-b border-border/50 px-5 py-3.5">
                          <span className="w-[110px] shrink-0 text-xs font-medium text-muted-foreground">{extraFieldLabel}</span>
                          <span className="min-w-0 flex-1 break-words text-left text-sm font-medium text-foreground">{extraFieldValue}</span>
                        </div>
                      ) : null}
                    </div>

                    {isEmployee ? (
                      lastPayment ? (
                        <div className="border-t border-border/70 bg-muted/15 p-5">
                          <div className="mb-4 flex items-center gap-2">
                            <BadgeDollarSign className="size-4 text-primary" />
                            <h5 className="text-sm font-semibold text-foreground">آخر راتب</h5>
                          </div>
                          <div className="overflow-hidden rounded-xl border border-border/70 bg-background">
                            <div className="grid grid-cols-2 divide-x divide-border/60 border-b border-border/60">
                              <div className="px-4 py-3 text-center">
                                <p className="text-[11px] text-muted-foreground">المبلغ</p>
                                <p className="mt-1 text-lg font-semibold text-foreground">{lastPayment.amount}</p>
                              </div>
                              <div className="px-4 py-3 text-center">
                                <p className="text-[11px] text-muted-foreground">تاريخ الدفع</p>
                                <p className="mt-1 text-sm font-semibold text-foreground">
                                  {lastPayment.payment_date ? dayjs(lastPayment.payment_date).format('YYYY-MM-DD') : '-'}
                                </p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 divide-x divide-border/60">
                              <div className="px-4 py-3 text-center">
                                <p className="text-[11px] text-muted-foreground">الزيادات</p>
                                <p className="mt-1 text-sm font-medium text-emerald-700">{lastPayment.bonuses}</p>
                              </div>
                              <div className="px-4 py-3 text-center">
                                <p className="text-[11px] text-muted-foreground">الاستقطاعات</p>
                                <p className="mt-1 text-sm font-medium text-rose-700">{lastPayment.deductions}</p>
                              </div>
                            </div>
                            {lastPayment.created_at ? (
                              <div className="border-t border-border/60 px-4 py-2.5 text-center">
                                <p className="text-[11px] text-muted-foreground">
                                  تاريخ الإنشاء: {dayjs(lastPayment.created_at).format('YYYY-MM-DD')}
                                </p>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      ) : (
                        <div className="border-t border-border/70 px-5 py-4">
                          <p className="text-sm text-muted-foreground">لا يوجد راتب مسجّل بعد.</p>
                        </div>
                      )
                    ) : null}
                  </div>
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
                  {roleFields.employee || roleFields.engineer ? (
                    <FormField
                      control={form.control}
                      name="department_id"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <FormLabel>القسم</FormLabel>
                          <Select value={field.value || ''} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger className="h-10">
                                <SelectValue placeholder="اختر القسم">
                                  {departments.find((d) => String(d.id) === String(field.value))?.name}
                                </SelectValue>
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {departments.map((dept) => (
                                <SelectItem key={dept.id} value={String(dept.id)}>
                                  {dept.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : null}
                  {roleFields.employee ? (
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <FormLabel>حالة الموظف</FormLabel>
                          <Select value={field.value || 'active'} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger className="h-10">
                                <SelectValue placeholder="اختر حالة الموظف">
                                  {field.value === 'retired'
                                    ? 'متقاعد'
                                    : field.value === 'resigned'
                                    ? 'مستقيل'
                                    : 'على رأس عمله'}
                                </SelectValue>
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="active">على رأس عمله</SelectItem>
                              <SelectItem value="retired">متقاعد</SelectItem>
                              <SelectItem value="resigned">مستقيل</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : null}
                  {roleFields.engineer ? <FormField control={form.control} name="base_salary" render={({ field }) => (<FormItem className="space-y-1.5"><FormLabel>الراتب الأساسي</FormLabel><FormControl><Input {...field} className="h-10" /></FormControl><FormMessage /></FormItem>)} /> : null}
                  <FormField
                    control={form.control}
                    name="images"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5 sm:col-span-2 lg:col-span-3">
                        <FormLabel>صور المستخدم</FormLabel>
                        <FormControl>
                          <div className="space-y-3">
                            <div className="relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 px-4 py-6 transition-colors hover:border-muted-foreground/30 bg-slate-50/50">
                              <input
                                type="file"
                                multiple
                                accept="image/*"
                                className="absolute inset-0 cursor-pointer opacity-0"
                                onChange={(e) => {
                                  const newFiles = Array.from(e.target.files || []);
                                  const currentFiles = field.value || [];
                                  field.onChange([...currentFiles, ...newFiles]);
                                }}
                              />
                              <UploadCloud className="size-6 text-muted-foreground mb-1 shrink-0" />
                              <span className="text-sm text-muted-foreground">
                                اضغط هنا لاختيار الصور أو اسحبها وأفلتها
                              </span>
                            </div>
                            {field.value && field.value.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {(field.value as File[]).map((file, index) => (
                                  <FilePreviewItem
                                    key={index}
                                    file={file}
                                    onRemove={() => {
                                      const newFiles = (field.value as File[]).filter((_, i) => i !== index);
                                      field.onChange(newFiles);
                                    }}
                                  />
                                ))}
                              </div>
                            )}
                            {visibleExistingImages.length > 0 && (
                              <div className="space-y-1.5 pt-1">
                                <span className="text-xs font-medium text-muted-foreground">الصور الحالية:</span>
                                <div className="flex flex-wrap gap-2">
                                  {visibleExistingImages.map((img, idx) => (
                                    <div
                                      key={img.id}
                                      onClick={() => {
                                        setLightboxImages(visibleExistingImages.map((i) => i.url));
                                        setLightboxIndex(idx);
                                        setLightboxOpen(true);
                                      }}
                                      className="group relative size-20 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-border bg-muted transition-transform hover:scale-105"
                                    >
                                      <img src={img.url} alt="" className="h-full w-full object-cover" />
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setDeletedImageIds((prev) => [...prev, img.id]);
                                        }}
                                        className="absolute right-1 top-1 rounded-full bg-destructive p-1 text-destructive-foreground transition-opacity hover:bg-destructive/95"
                                      >
                                        <X className="size-3" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex flex-col-reverse gap-2 pt-2 sm:col-span-2 sm:flex-row sm:justify-end lg:col-span-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full sm:w-auto"
                      onClick={() => {
                        setIsEditingMode(false);
                        setDeletedImageIds([]);
                      }}
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
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>تعديل كلمة السر</DialogTitle>
          </DialogHeader>

          <Form {...updatePasswordForm}>
            <form
              onSubmit={updatePasswordForm.handleSubmit((values) =>
                updatePasswordMutation.mutate(values)
              )}
              className="space-y-4"
            >
              <FormField
                control={updatePasswordForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel>كلمة السر الجديدة</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} className="h-10" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={updatePasswordForm.control}
                name="password_confirmation"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel>تأكيد كلمة السر الجديدة</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} className="h-10" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full h-11"
                disabled={updatePasswordMutation.isPending}
              >
                {updatePasswordMutation.isPending ? 'جاري تعديل كلمة السر...' : 'حفظ كلمة السر'}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ImageLightbox
        images={lightboxImages}
        initialIndex={lightboxIndex}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
      />
    </div>
  );
}
