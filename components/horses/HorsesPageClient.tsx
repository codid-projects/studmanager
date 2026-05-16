'use client';

import { useEffect, useMemo, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { HorseCard } from '@/components/horses/HorseCard';
import { HorseFormModal } from '@/components/horses/HorseFormModal';
import { StudbookImportModal } from '@/components/horses/StudbookImportModal';
import { toHorseCardModel } from '@/lib/api/horse-formatters';
import { clientApiFetch } from '@/lib/api/client';
import { isDirectApiMode } from '@/lib/api/transport';
import type { HorseListItemDto, LocaleCode, PagedResponse, StudbookHorseDto } from '@/lib/api/types';
import { useLocale, useTranslation } from '@/lib/locale-context';

interface HorsesPageClientProps {
  initialHorses: PagedResponse<HorseListItemDto>;
  initialStudbook: PagedResponse<StudbookHorseDto>;
  initialError?: string;
}

export function HorsesPageClient({
  initialHorses,
  initialStudbook,
  initialError = '',
}: HorsesPageClientProps) {
  const { t } = useTranslation();
  const { locale, direction } = useLocale();
  const isRTL = direction === 'rtl';
  const [isStudbookOpen, setIsStudbookOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [mainSearchQuery, setMainSearchQuery] = useState('');
  const [horses, setHorses] = useState(initialHorses.data);
  const [error, setError] = useState(initialError);
  const [loading, setLoading] = useState(isDirectApiMode && !initialHorses.data.length);

  useEffect(() => {
    if (isDirectApiMode) return;

    window.dispatchEvent(
      new CustomEvent('api-debug-entry', {
        detail: {
          id: `initial-horses-${Date.now()}`,
          label: 'Initial horses list',
          method: 'GET',
          backendEndpoint: 'https://studmanagerapi-dev.studmarket.net/api/Horses?pageNumber=1&pageSize=24',
          nextEndpoint: `/api/horses?pageNumber=1&pageSize=24&locale=${locale}`,
          nextService: 'Server render: app/[locale]/horses/page.tsx -> lib/api/horses-service.ts:getHorses',
          payload: { pageNumber: 1, pageSize: 24, locale },
          status: initialError ? undefined : 200,
          response: {
            currentPage: initialHorses.currentPage,
            pageSize: initialHorses.pageSize,
            totalCount: initialHorses.totalCount,
            returnedCount: initialHorses.data.length,
            firstItems: initialHorses.data.slice(0, 2),
          },
          error: initialError || undefined,
          createdAt: new Date().toLocaleTimeString(),
          replayable: true,
        },
      }),
    );
  }, [initialError, initialHorses, locale]);

  useEffect(() => {
    if (!isDirectApiMode) return;

    let mounted = true;

    async function loadHorses() {
      setLoading(true);
      setError('');

      try {
        const payload = await clientApiFetch<PagedResponse<HorseListItemDto>>({
          backendPath: '/api/Horses',
          nextPath: '/api/horses',
          backendQuery: { pageNumber: 1, pageSize: 24 },
          nextQuery: { pageNumber: 1, pageSize: 24, locale },
          locale: locale as LocaleCode,
        });

        if (!mounted) return;
        setHorses(payload.data ?? []);
      } catch (requestError) {
        if (!mounted) return;
        setError(requestError instanceof Error ? requestError.message : t('common.error'));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadHorses();

    return () => {
      mounted = false;
    };
  }, [locale, t]);

  const cards = useMemo(
    () => horses.map((horse) => toHorseCardModel(horse, locale as LocaleCode)),
    [horses, locale],
  );

  const filteredHorses = cards.filter((horse) => {
    if (!mainSearchQuery.trim()) return true;
    const query = mainSearchQuery.toLowerCase();

    return horse.nameAr.includes(mainSearchQuery) || horse.nameEn.toLowerCase().includes(query);
  });

  const handleImported = () => {
    setIsStudbookOpen(false);
    window.location.reload();
  };

  return (
    <MainLayout>
      <div className={`rounded-[16px] p-4 sm:rounded-[28px] sm:p-6 ${isRTL ? 'text-right' : 'text-left'}`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <h1 className="text-lg font-semibold text-text-dark sm:text-2xl">{t('horses.title')}</h1>

          <div className="relative w-full sm:max-w-[30rem] sm:flex-1">
            <input
              type="search"
              value={mainSearchQuery}
              onChange={(event) => setMainSearchQuery(event.target.value)}
              placeholder={t('common.search')}
              className={`h-10 w-full rounded-lg border border-[#ece2da] bg-white text-xs text-[#2c2330] outline-none transition placeholder:text-[#d9cfc5] focus:border-[#5a3b25] focus:ring-2 focus:ring-[#5a3b25]/10 sm:h-11 sm:rounded-2xl sm:text-sm ${
                isRTL ? 'pr-10 text-right sm:pr-12' : 'pl-10 text-left sm:pl-12'
              }`}
            />
            <span className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 text-[#5a473d] ${isRTL ? 'right-3 sm:right-4' : 'left-3 sm:left-4'}`}>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 10.5a7.5 7.5 0 0012.15 6.15z" />
              </svg>
            </span>
          </div>

          <button
            onClick={() => setIsStudbookOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-[16px] bg-[#311C11] px-4 py-2 text-xs font-medium text-primary-light transition-all hover:bg-opacity-90 sm:w-auto sm:px-6 sm:text-sm"
          >
            + {t('horses.addNew')}
          </button>
        </div>
      </div>

      {error ? (
        <div className="mx-4 rounded-2xl border border-[#f2c7c7] bg-[#fff3f3] px-4 py-3 text-sm text-[#b04444] sm:mx-6">
          {error}
        </div>
      ) : null}

      <div className="p-4 sm:p-6">
        {loading ? (
          <div className="rounded-2xl bg-white p-10 text-center text-sm text-[#7a6c63]">
            {t('common.loading')}
          </div>
        ) : filteredHorses.length ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3">
            {filteredHorses.map((horse) => (
              <HorseCard key={horse.id} horse={horse} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-white p-10 text-center text-sm text-[#7a6c63]">
            {t('common.noRecordsFound')}
          </div>
        )}
      </div>

      {isStudbookOpen ? (
        <StudbookImportModal
          initialStudbook={initialStudbook}
          onClose={() => setIsStudbookOpen(false)}
          onManualAdd={() => {
            setIsStudbookOpen(false);
            setIsAddModalOpen(true);
          }}
          onImported={handleImported}
        />
      ) : null}

      <HorseFormModal
        isOpen={isAddModalOpen}
        isManual
        initialData={null}
        onClose={() => setIsAddModalOpen(false)}
        onBack={() => {
          setIsAddModalOpen(false);
          setIsStudbookOpen(true);
        }}
        onSubmit={() => {
          setError(t('horses.manualApiPending'));
          setIsAddModalOpen(false);
        }}
      />

    </MainLayout>
  );
}
