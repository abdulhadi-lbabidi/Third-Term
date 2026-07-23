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
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { useTranslation } from 'react-i18next';

const AUTH_TOKEN_KEY = 'token_finance_nouh';

type LoginFormValues = {
  email: string;
  password: string;
  remember: boolean;
};

export function LoginPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginFormValues>({
    defaultValues: {
      email: '',
      password: '',
      remember: true,
    },
  });

  const onSubmit: SubmitHandler<LoginFormValues> = () => {
    localStorage.setItem(AUTH_TOKEN_KEY, 'demo-token');
    navigate('/', { replace: true });
  };

  return (
    <main dir="rtl" className="min-h-screen bg-white px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] items-center justify-center">
        <Card className="w-full max-w-[360px] rounded-[28px] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(61,77,136,0.14)]">
          <div className="h-1.5 w-full rounded-t-[28px] bg-[#D4A22D]" />

          <CardHeader className="px-6 pb-3 pt-7 text-center">
            <p className="mb-2 text-xs font-semibold tracking-[0.22em] text-[#D4A22D]">
              {t('login.brand')}
            </p>

            <CardTitle className="text-2xl font-bold text-[#3D4D88]">
              {t('login.title')}
            </CardTitle>

            <p className="mt-2 text-xs leading-6 text-slate-500">
              {t('login.description')}
            </p>
          </CardHeader>

          <CardContent className="px-6 pb-6 pt-2">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                        <FormLabel className="text-xs font-semibold text-[#3D4D88]">
                          {t('login.email')}
                        </FormLabel>
                      <FormControl>
                          <Input
                            {...field}
                            type="email"
                            placeholder={t('login.emailPlaceholder')}
                            dir="ltr"
                          className="h-10 rounded-2xl border-slate-200 bg-white px-4 text-sm shadow-none placeholder:text-slate-400 focus-visible:border-[#3D4D88] focus-visible:ring-2 focus-visible:ring-[#3D4D88]/15"
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
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-xs font-semibold text-[#3D4D88]">
                          {t('login.password')}
                        </FormLabel>

                        <button
                          type="button"
                          className="text-xs font-medium text-[#D4A22D] transition-colors hover:text-[#b8881f]"
                        >
                          {t('login.forgotPassword')}
                        </button>
                      </div>

                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showPassword ? 'text' : 'password'}
                            placeholder={t('login.passwordPlaceholder')}
                            className="h-10 rounded-2xl border-slate-200 bg-white pl-10 pr-10 text-sm shadow-none placeholder:text-slate-400 focus-visible:border-[#3D4D88] focus-visible:ring-2 focus-visible:ring-[#3D4D88]/15"
                          />

                          <button
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#3D4D88]/60 transition-colors hover:text-[#3D4D88]"
                            aria-label={showPassword ? t('login.hidePassword') : t('login.showPassword')}
                          >
                            {showPassword ? (
                              <EyeOff className="size-4" />
                            ) : (
                              <Eye className="size-4" />
                            )}
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
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="size-4 rounded border-slate-300 accent-[#D4A22D]"
                        />
                      </FormControl>
                      <FormLabel className="cursor-pointer text-sm font-normal text-slate-600">
                        {t('login.rememberMe')}
                      </FormLabel>
                    </FormItem>
                  )}
                />

              <Button
                type="submit"
                className="h-10 w-full rounded-2xl bg-[#3D4D88] text-sm font-semibold text-white shadow-md transition-all hover:bg-[#334174]"
              >
                {t('login.submit')}
              </Button>
            </form>
          </Form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
