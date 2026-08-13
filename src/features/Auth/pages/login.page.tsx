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
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { apiClient } from '@/shared/api/axios.instance';
import { useQueryClient } from '@tanstack/react-query';

const AUTH_TOKEN_KEY = 'token_finance_nouh';

type LoginFormValues = {
  email: string;
  password: string;
  remember: boolean;
};

export function LoginPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    defaultValues: {
      email: '',
      password: '',
      remember: true,
    },
  });

  const onSubmit: SubmitHandler<LoginFormValues> = async (values) => {
    try {
      setLoading(true);
      const response = await apiClient.post('/login', {
        email: values.email,
        password: values.password,
      });

      const token = response.data?.token;
      if (token) {
        localStorage.setItem(AUTH_TOKEN_KEY, token);
        let user = response.data?.user;
        try {
          const meResponse = await apiClient.get('/me');
          user = meResponse.data?.data ?? meResponse.data ?? user;
        } catch {
        }
        if (user) {
          localStorage.setItem('user_info', JSON.stringify(user));
          queryClient.setQueryData(['me'], user);
        }
        await queryClient.invalidateQueries({ queryKey: ['me'] });
        toast.success('تم تسجيل الدخول بنجاح');

        if (user?.role_type && ['client', 'engineer', 'employee'].includes(user.role_type)) {
          navigate('/public/projects', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      } else {
        toast.error('حدث خطأ أثناء تسجيل الدخول');
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'فشل تسجيل الدخول، يرجى التأكد من البيانات');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main dir="rtl" className="login-pattern min-h-screen px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] items-center justify-center">
        <Card className="w-full max-w-[400px] gap-0 overflow-hidden py-0 shadow-[var(--shadow-finance-md)]">
          <div className="h-1 w-full bg-primary" />
          <div className="h-0.5 w-full bg-[var(--accent-gold)]/70" />

          <CardHeader className="px-6 pb-2 pt-7 text-center">
            <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-md border border-border bg-muted text-lg font-bold text-primary">
              ن
            </div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              نوح المالية
            </p>
            <CardTitle className="text-2xl font-semibold text-foreground">تسجيل الدخول</CardTitle>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              أدخل بيانات حسابك للوصول إلى نظام المحاسبة والإدارة المالية
            </p>
          </CardHeader>

          <CardContent className="px-6 pb-7 pt-3">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>البريد الإلكتروني</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="name@company.com"
                          dir="ltr"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <FormLabel>كلمة المرور</FormLabel>
                        <button
                          type="button"
                          className="text-xs font-medium text-primary transition-colors hover:text-primary/80"
                        >
                          نسيت كلمة المرور؟
                        </button>
                      </div>

                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showPassword ? 'text' : 'password'}
                            placeholder="أدخل كلمة المرور"
                            className="pe-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
                            className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                            aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                          >
                            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="remember"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center gap-2 space-y-0">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel className="cursor-pointer text-sm font-normal text-muted-foreground">
                        تذكر بيانات تسجيل الدخول
                      </FormLabel>
                    </FormItem>
                  )}
                />

                <Button type="submit" className="h-10 w-full" disabled={loading}>
                  {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
