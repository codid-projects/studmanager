'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AUTH_USER_COOKIE } from '@/lib/auth';
import { useLocale, useTranslation } from '@/lib/locale-context';
import { BellIcon, SearchIcon, MenuIcon, CloseIcon } from './AppIcons';
import { LocaleMenu } from '@/components/common/LocaleMenu';

interface TopBarProps {
  searchWidthClass?: string;
  onMenuToggle?: () => void;
  sidebarOpen?: boolean;
}

export function TopBar({
  searchWidthClass = 'sm:w-[25rem] md:w-[28rem]',
  onMenuToggle,
  sidebarOpen,
}: TopBarProps) {
  const { t } = useTranslation();
  const { locale, direction } = useLocale();
  const [authUserName, setAuthUserName] = useState('');

  useEffect(() => {
    const rawCookie = document.cookie
      .split('; ')
      .find((cookie) => cookie.startsWith(`${AUTH_USER_COOKIE}=`))
      ?.slice(AUTH_USER_COOKIE.length + 1);

    if (!rawCookie) return;

    try {
      const user = JSON.parse(decodeURIComponent(rawCookie)) as {
        fullName?: string | null;
        username?: string | null;
      };
      setAuthUserName(user.fullName || user.username || '');
    } catch {
      setAuthUserName('');
    }
  }, []);

  const displayName = authUserName || (locale === 'ar' ? 'المستخدم' : 'User');
  const avatarLetter = useMemo(() => displayName.trim().charAt(0).toUpperCase() || 'U', [displayName]);

  return (
    <div className="fixed top-2 left-2 right-2 z-30 flex items-center justify-between rounded-[20px] bg-white px-4 py-3 shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-gray-100 sm:relative sm:top-0 sm:left-0 sm:right-0 sm:z-30 sm:rounded-[26px] sm:px-6 sm:py-4 lg:px-8 sm:border-none sm:shadow-[0_10px_35px_rgba(94,56,23,0.06)]">

      {/* Notifications - Mobile left */}
      <div className="flex items-center md:hidden">
        <Link
          href={`/${locale}/notifications`}
          className="relative text-[#2f2220] transition hover:text-[#5a3b25]"
          aria-label="Notifications"
        >
          <BellIcon className="h-6 w-6" />
        </Link>
      </div>

      {/* Brand logo - Center on mobile */}
      <div className="flex flex-1 justify-center sm:hidden">
        <Link href={`/${locale}/dashboard`}>
          <img
            src="/brand/logo.png"
            alt="StudManager"
            className="h-8 w-auto object-contain pr-5"
          />
        </Link>
      </div>

      {/* Burger - Mobile right */}
      <button
        onClick={onMenuToggle}
        className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Toggle menu"
      >
        {sidebarOpen ? (
          <CloseIcon className="h-6 w-6" />
        ) : (
          <MenuIcon className="h-6 w-6" />
        )}
      </button>

      {/* Search - Desktop */}
      <div className={`relative hidden sm:flex ${searchWidthClass}`}>
        <SearchIcon
          className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 text-[#5a473d] ${direction === 'rtl' ? 'right-4' : 'left-4'
            }`}
        />
        <input
          type="search"
          placeholder={t('common.search')}
          className={`h-11 w-full rounded-2xl border border-[#ece2da] bg-white text-sm text-[#2c2330] outline-none transition placeholder:text-[#d9cfc5] focus:border-[#5a3b25] focus:ring-2 focus:ring-[#5a3b25]/10 ${direction === 'rtl' ? 'pr-12 text-right' : 'pl-12 text-left'
            }`}
        />
      </div>

      {/* Right side desktop */}
      <div className="hidden md:flex items-center gap-5">
        <Link
          href={`/${locale}/notifications`}
          className="relative text-[#2f2220] transition hover:text-[#5a3b25]"
          aria-label="Notifications"
        >
          <BellIcon className="h-6 w-6" />
        </Link>

        <LocaleMenu />

        <div className="flex items-center gap-2 text-[#2f2220]">
          <span className="font-semibold text-sm">
            {displayName}
          </span>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[radial-gradient(circle_at_35%_35%,#d9b898,#6b4d39)] text-sm font-semibold text-white shadow-inner">
            {avatarLetter}
          </div>
        </div>
      </div>
    </div>
  );
}
