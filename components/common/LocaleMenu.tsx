'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname, useRouter } from 'next/navigation';
import { getOppositeLocale, locales, type Locale } from '@/lib/i18n';
import { useLocale, useTranslation } from '@/lib/locale-context';

import { GlobalsIcon } from '../layout/AppIcons';

function switchPathLocale(pathname: string, currentLocale: Locale, nextLocale: Locale) {
  const exactPrefix = `/${currentLocale}`;
  if (pathname === exactPrefix) return `/${nextLocale}`;
  if (pathname.startsWith(`${exactPrefix}/`)) {
    return pathname.replace(`${exactPrefix}/`, `/${nextLocale}/`);
  }
  return `/${nextLocale}${pathname === '/' ? '' : pathname}`;
}

interface LocaleMenuProps {
  variant?: 'desktop' | 'mobile';
}

export function LocaleMenu({ variant = 'desktop' }: LocaleMenuProps) {
  const { locale, direction } = useLocale();
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  if (variant === 'mobile') {
    return (
      <div className="w-full">
        <button
          onClick={() => setOpen(true)}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-300 hover:bg-[#f8efe7] text-[#2b2330] ${
            direction === 'rtl' ? 'flex-row-reverse justify-end text-right' : 'flex-row justify-start text-left'
          }`}
        >
          <GlobalsIcon className="h-5 w-5 flex-shrink-0 text-[#2b2330]" />
          <span className="text-[0.82rem] font-semibold leading-tight">
            {locale === 'ar' ? 'اللغة' : 'Language'}
          </span>
        </button>

        {open && createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6 md:hidden"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setOpen(false);
            }}
          >
            <div 
              ref={containerRef}
              className="w-full max-w-[20rem] overflow-hidden rounded-[30px] bg-white p-2 shadow-2xl animate-in fade-in zoom-in duration-200"
            >
              <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                <span className="font-bold text-[#2b2330]">
                  {t('common.select_language')}
                </span>
                <button 
                  onClick={() => setOpen(false)}
                  className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-1 p-1">
                {locales.map((targetLocale) => {
                  const label = targetLocale === 'ar' ? 'العربية' : 'English';
                  const active = targetLocale === locale;

                  return (
                    <button
                      key={targetLocale}
                      onClick={() => {
                        router.push(switchPathLocale(pathname, locale, targetLocale));
                        setOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-2xl px-5 py-4 text-[1.05rem] font-bold transition-all ${
                        active 
                          ? 'bg-[#f5efbb] text-[#4b2f1a]' 
                          : 'text-[#2b2330] hover:bg-[#f8efe7]'
                      }`}
                    >
                      <span>{label}</span>
                      {active && (
                        <div className="h-4 w-4 rounded-full border-4 border-[#4b2f1a] bg-white" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((current) => !current)}
        className="h-5 w-8 overflow-hidden rounded-sm shadow-[0_0_0_1px_rgba(0,0,0,0.06)]"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Change language"
        title={getOppositeLocale(locale) === 'ar' ? 'العربية' : 'English'}
      >
        <span className="block h-1/3 bg-[#d9252a]" />
        <span className="block h-1/3 bg-white" />
        <span className="block h-1/3 bg-[#1b2248]" />
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-40 min-w-[10rem] rounded-[20px] bg-white p-2 shadow-[0_16px_32px_rgba(91,53,24,0.14)]">
          {locales.map((targetLocale) => {
            const label = targetLocale === 'ar' ? 'العربية' : 'English';
            const active = targetLocale === locale;

            return (
              <button
                key={targetLocale}
                onClick={() => {
                  router.push(switchPathLocale(pathname, locale, targetLocale));
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  active ? 'bg-[#f5efbb] text-[#2b2330]' : 'text-[#2b2330] hover:bg-[#f8efe7]'
                }`}
                role="menuitem"
              >
                <span>{label}</span>
                {active && <span className="h-2.5 w-2.5 rounded-full bg-[#4b2f1a]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
