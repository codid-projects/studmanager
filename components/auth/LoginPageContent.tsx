'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
  UserRound,
} from 'lucide-react';

import { loginClient } from '@/lib/api/client';
import { useLocale, useTranslation } from '@/lib/locale-context';

interface LoginPageContentProps {
  sessionExpired?: boolean;
}

export function LoginPageContent({ sessionExpired = false }: LoginPageContentProps) {
  const router = useRouter();
  const { locale, direction } = useLocale();
  const { t } = useTranslation();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!identifier.trim() || !password.trim()) {
      setError(t('login.validation'));
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await loginClient({
        username: identifier.trim(),
        password,
        rememberMe,
        locale,
      });

      router.replace(`/${locale}/dashboard`);
      router.refresh();
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : '';
      setError(message.toLowerCase().includes('invalid') ? t('login.invalidCredentials') : t('login.networkError'));
    } finally {
      setSubmitting(false);
    }
  };

  const InputArrow = direction === 'rtl' ? ArrowLeft : ArrowRight;
  const isRTL = direction === 'rtl';

  return (
    <div className="min-h-screen bg-[#f6eee7] px-4 py-5 lg:px-8 lg:py-6" dir={direction}>
      <div className="mx-auto flex min-h-screen max-w-[1240px] items-center lg:min-h-[calc(100vh-3rem)]">
        <div className="grid w-full bg-transparent lg:overflow-hidden lg:rounded-[34px] lg:bg-white lg:shadow-[0_30px_80px_rgba(61,37,24,0.14)] lg:grid-cols-[1.08fr_0.92fr]">
          <section className="relative hidden overflow-hidden bg-[linear-gradient(135deg,#3a2317_0%,#71482f_55%,#b88961_100%)] px-6 py-8 text-white sm:px-10 sm:py-10 lg:flex lg:px-12 lg:py-12">
            <div
              className="absolute right-0 top-0 h-44 w-full bg-white/10"
              style={{ clipPath: 'polygon(36% 0,100% 0,100% 100%,68% 68%)' }}
            />

            <div className="relative flex h-full flex-col justify-between gap-10">
              <div className="flex items-center justify-start">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white/90">
                  <ShieldCheck className="h-4 w-4" />
                  <span>{t('login.panelBadge')}</span>
                </div>
              </div>

              <div className={`max-w-[34rem] space-y-5 ${isRTL ? 'text-right' : 'text-left'}`}>
                <img
                  src="/brand/logo.png"
                  alt="StudManager"
                  className="h-14 w-auto rounded-2xl bg-white/95 px-3 py-2 shadow-[0_10px_24px_rgba(0,0,0,0.14)]"
                />

                <h1 className="max-w-[13ch] text-4xl font-bold leading-[1.15] sm:text-5xl">
                  {t('login.title')}
                </h1>

                <p className="max-w-[30rem] text-base leading-8 text-white/82 sm:text-lg">
                  {t('login.subtitle')}
                </p>
              </div>
            </div>
          </section>

          <section className="flex min-h-screen items-center justify-center bg-transparent py-6 lg:min-h-0 lg:bg-[#fffaf6] lg:px-12 lg:py-12">
            <div
              className={`w-full max-w-[430px] rounded-[28px] bg-white p-5 shadow-[0_18px_50px_rgba(61,37,24,0.10)] sm:p-7 lg:max-w-none lg:rounded-none lg:bg-transparent lg:p-0 lg:shadow-none ${isRTL ? 'text-right' : 'text-left'}`}
            >
              <div className="mb-8 flex justify-center lg:hidden">
                <img
                  src="/brand/logo.png"
                  alt="StudManager"
                  className="h-14 w-auto rounded-2xl bg-[#fffaf6] px-3 py-2 shadow-[0_10px_24px_rgba(0,0,0,0.08)]"
                />
              </div>

              <div className="mb-8 hidden space-y-3 lg:block">
                <h2 className="text-[2.2rem] font-bold leading-tight text-[#2c1d16] sm:text-[2.8rem]">
                  {t('login.formTitle')}
                </h2>

                <p className="text-sm leading-7 text-[#826e60] sm:text-base">
                  {t('login.helper')}
                </p>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                {sessionExpired ? (
                  <div className="rounded-2xl border border-[#efd3a3] bg-[#fff8e8] px-4 py-3 text-sm font-medium text-[#8a5a16]">
                    {t('login.sessionExpired')}
                  </div>
                ) : null}

                <div className="relative">
                  <label htmlFor="identifier" className="sr-only">
                    {t('login.identifierLabel')}
                  </label>

                  <UserRound
                    className={`pointer-events-none absolute top-1/2 h-5 w-5 -translate-y-1/2 text-[#9a8779] ${
                      isRTL ? 'right-5' : 'left-5'
                    }`}
                  />

                  <input
                    id="identifier"
                    type="text"
                    value={identifier}
                    onChange={(event) => {
                      setIdentifier(event.target.value);
                      if (error) setError('');
                    }}
                    placeholder={t('login.identifierPlaceholder')}
                    className={`h-14 w-full rounded-full border border-[#e6d9ce] bg-transparent text-[1rem] text-[#241815] outline-none transition placeholder:text-[#b8a79b] focus:border-[#8a5f42] focus:bg-white ${
                      isRTL ? 'pr-14 pl-5 text-right' : 'pl-14 pr-5 text-left'
                    }`}
                  />
                </div>

                <div className="relative">
                  <label htmlFor="password" className="sr-only">
                    {t('login.passwordLabel')}
                  </label>

                  <LockKeyhole
                    className={`pointer-events-none absolute top-1/2 h-5 w-5 -translate-y-1/2 text-[#9a8779] ${
                      isRTL ? 'right-5' : 'left-5'
                    }`}
                  />

                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      if (error) setError('');
                    }}
                    placeholder={t('login.passwordPlaceholder')}
                    className={`h-14 w-full rounded-full border border-[#e6d9ce] bg-transparent text-[1rem] text-[#241815] outline-none transition placeholder:text-[#b8a79b] focus:border-[#8a5f42] focus:bg-white ${
                      isRTL ? 'pr-14 pl-14 text-right' : 'pl-14 pr-14 text-left'
                    }`}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className={`absolute top-1/2 -translate-y-1/2 text-[#8c7769] transition hover:text-[#5a3625] ${
                      isRTL ? 'left-5' : 'right-5'
                    }`}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                  <label className="flex items-center gap-2 text-[#705d50]">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(event) => setRememberMe(event.target.checked)}
                      className="h-4 w-4 rounded border-[#cfbaa8] text-[#6d4630] focus:ring-[#6d4630]"
                    />
                    <span>{t('login.rememberMe')}</span>
                  </label>

                  <button
                    type="button"
                    className="font-semibold text-[#8b5a38] transition hover:text-[#5a3625]"
                  >
                    {t('login.forgotPassword')}
                  </button>
                </div>

                {error ? (
                  <div className="rounded-2xl border border-[#f2c7c7] bg-[#fff3f3] px-4 py-3 text-sm text-[#b04444]">
                    {error}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex h-14 w-full items-center justify-center gap-3 rounded-full bg-[linear-gradient(135deg,#3a2216_0%,#71462d_55%,#b7865c_100%)] px-5 text-base font-bold text-white shadow-[0_18px_30px_rgba(84,50,28,0.16)] transition hover:translate-y-[-1px] hover:shadow-[0_22px_34px_rgba(84,50,28,0.2)] disabled:cursor-not-allowed disabled:opacity-80"
                >
                  <span>{submitting ? t('login.signingIn') : t('login.loginButton')}</span>
                  <InputArrow className="h-5 w-5" />
                </button>
              </form>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
