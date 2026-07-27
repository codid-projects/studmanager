'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AUTH_USER_COOKIE } from '@/lib/auth';
import { clientApiFetch } from '@/lib/api/client';
import { DEFAULT_HORSE_IMAGE, horseDisplayName, localizeGender, mediaUrl } from '@/lib/api/horse-formatters';
import type { ApiResult, HorseListItemDto, LocaleCode, PagedResponse } from '@/lib/api/types';
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
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement | null>(null);
  const [authUserName, setAuthUserName] = useState('');
  const [search, setSearch] = useState('');
  const [focused, setFocused] = useState(false);
  const [results, setResults] = useState<HorseListItemDto[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const localeCode = locale as LocaleCode;
  const isRTL = direction === 'rtl';
  const trimmedSearch = search.trim();
  const showSearchPanel = focused && (trimmedSearch.length > 0 || results.length > 0 || searching || Boolean(searchError));

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

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!searchRef.current?.contains(event.target as Node)) {
        setFocused(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  useEffect(() => {
    if (trimmedSearch.length < 2) {
      setResults([]);
      setSearching(false);
      setSearchError('');
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setSearching(true);
      setSearchError('');

      try {
        const payload = await clientApiFetch<ApiResult<PagedResponse<HorseListItemDto>> | PagedResponse<HorseListItemDto>>({
          backendPath: '/api/Horses',
          nextPath: '/api/horses',
          backendQuery: { pageNumber: 1, pageSize: 8, search: trimmedSearch, isActive: true },
          nextQuery: { pageNumber: 1, pageSize: 8, search: trimmedSearch, isActive: true, locale },
          locale: localeCode,
        });
        const page = payload && typeof payload === 'object' && 'data' in payload && !('currentPage' in payload)
          ? (payload as ApiResult<PagedResponse<HorseListItemDto>>).data
          : (payload as PagedResponse<HorseListItemDto>);

        if (!controller.signal.aborted) setResults(page?.data ?? []);
      } catch (error) {
        if (!controller.signal.aborted) {
          setResults([]);
          setSearchError(error instanceof Error ? error.message : t('common.error'));
        }
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 240);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [locale, localeCode, t, trimmedSearch]);

  const displayName = authUserName || (locale === 'ar' ? 'المستخدم' : 'User');
  const avatarLetter = useMemo(() => displayName.trim().charAt(0).toUpperCase() || 'U', [displayName]);
  const searchPlaceholder = locale === 'ar' ? 'ابحث عن الخيل' : 'Search horses';

  const openHorse = (horse: HorseListItemDto) => {
    const id = horse.localId ?? horse.id;
    setFocused(false);
    setSearch('');
    setResults([]);
    router.push(`/${locale}/horses/${id}`);
  };

  const submitSearch = () => {
    if (results[0]) {
      openHorse(results[0]);
      return;
    }

    if (trimmedSearch) {
      setFocused(false);
      router.push(`/${locale}/horses?search=${encodeURIComponent(trimmedSearch)}`);
    }
  };

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
      <div
        ref={searchRef}
        className={`relative hidden sm:flex ${showSearchPanel ? 'z-50 sm:w-[32rem] md:w-[38rem]' : searchWidthClass} transition-[width] duration-300 ease-out`}
      >
        <SearchIcon
          className={`absolute top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-[#5a473d] ${isRTL ? 'right-4' : 'left-4'
            }`}
        />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onFocus={() => setFocused(true)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') submitSearch();
            if (event.key === 'Escape') setFocused(false);
          }}
          placeholder={searchPlaceholder}
          className={`h-11 w-full rounded-2xl border border-[#ece2da] bg-white text-sm text-[#2c2330] outline-none transition placeholder:text-[#d9cfc5] focus:border-[#5a3b25] focus:ring-2 focus:ring-[#5a3b25]/10 ${isRTL ? 'pr-12 text-right' : 'pl-12 text-left'
            }`}
        />
        <div
          className={`absolute top-[calc(100%+0.65rem)] w-full origin-top overflow-hidden rounded-2xl border border-[#eadfd6] bg-white shadow-[0_20px_45px_rgba(49,28,17,0.16)] transition-all duration-300 ease-out ${
            showSearchPanel
              ? 'translate-y-0 scale-100 opacity-100'
              : 'pointer-events-none -translate-y-2 scale-95 opacity-0'
          } ${isRTL ? 'right-0 text-right' : 'left-0 text-left'}`}
        >
          <div className="max-h-[25rem] overflow-y-auto p-2">
            {trimmedSearch.length < 2 && (
              <div className="px-4 py-5 text-sm text-[#8a7a6d]">
                {locale === 'ar' ? 'اكتب حرفين على الأقل للبحث في الخيل.' : 'Type at least two letters to search horses.'}
              </div>
            )}

            {trimmedSearch.length >= 2 && searching && (
              <div className="px-4 py-5 text-sm text-[#8a7a6d]">{t('common.loading')}</div>
            )}

            {searchError && !searching && (
              <div className="px-4 py-5 text-sm text-red-600">{searchError}</div>
            )}

            {trimmedSearch.length >= 2 && !searching && !searchError && !results.length && (
              <div className="px-4 py-5 text-sm text-[#8a7a6d]">{t('common.noRecordsFound')}</div>
            )}

            {results.map((horse) => {
              const name = horseDisplayName(horse, localeCode);
              const image = horse.horseProfileImage || mediaUrl(horse.images?.[0]) || DEFAULT_HORSE_IMAGE;
              const secondary = [
                localizeGender(horse.gender, localeCode),
                locale === 'ar' ? horse.strainAr || horse.strainEn : horse.strainEn || horse.strainAr,
              ].filter((item) => item && item !== '-').join(' · ');

              return (
                <button
                  key={horse.localId ?? horse.id}
                  type="button"
                  onClick={() => openHorse(horse)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start transition hover:bg-[#f7f1ea] ${
                    isRTL ? 'flex-row-reverse' : ''
                  }`}
                >
                  <img
                    src={image}
                    alt=""
                    className="h-11 w-11 shrink-0 rounded-xl object-cover"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-[#2c2330]">{name}</span>
                    <span className="mt-0.5 block truncate text-xs text-[#8a7a6d]">{secondary || (locale === 'ar' ? 'خيل' : 'Horse')}</span>
                  </span>
                </button>
              );
            })}

            {trimmedSearch.length >= 2 && results.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setFocused(false);
                  router.push(`/${locale}/horses?search=${encodeURIComponent(trimmedSearch)}`);
                }}
                className="mt-1 w-full rounded-xl px-3 py-3 text-sm font-semibold text-[#4b2f1a] transition hover:bg-[#f7f1ea]"
              >
                {locale === 'ar' ? 'عرض كل النتائج' : 'View all results'}
              </button>
            )}
          </div>
        </div>
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
