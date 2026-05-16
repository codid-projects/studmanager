'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import type { ApiDebugEntry } from '@/components/debug/ApiDebugInspector';
import { clientApiFetch } from '@/lib/api/client';
import { toStudbookCardModel } from '@/lib/api/horse-formatters';
import type { ApiResult, ImportHorseDto, LocaleCode, PagedResponse, StudbookHorseDto } from '@/lib/api/types';
import { useLocale, useTranslation } from '@/lib/locale-context';

interface StudbookImportModalProps {
  initialStudbook: PagedResponse<StudbookHorseDto>;
  onClose: () => void;
  onManualAdd: () => void;
  onImported: () => void;
  onDebugCall?: (entry: ApiDebugEntry) => void;
}

export function StudbookImportModal({
  initialStudbook,
  onClose,
  onManualAdd,
  onImported,
  onDebugCall,
}: StudbookImportModalProps) {
  const { t } = useTranslation();
  const { locale, direction } = useLocale();
  const router = useRouter();
  const isRTL = direction === 'rtl';
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [studbook, setStudbook] = useState(initialStudbook);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');

  const cards = useMemo(
    () => studbook.data.map((horse) => toStudbookCardModel(horse, locale as LocaleCode)),
    [locale, studbook.data],
  );
  const selectedHorse = studbook.data.find((horse) => horse.id === selectedId);
  const handleSessionExpired = () => {
    router.replace(`/${locale}/login?session=expired`);
    router.refresh();
  };

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      setError('');

      try {
        const payload = await clientApiFetch<PagedResponse<StudbookHorseDto>>({
          backendPath: '/api/ExternalHorses/search-external-horses',
          nextPath: '/api/horses/studbook',
          backendQuery: {
            SearchTerm: query,
            PageNumber: 1,
            PageSize: 12,
          },
          nextQuery: {
            search: query,
            pageNumber: 1,
            pageSize: 12,
            locale,
          },
          locale: locale as LocaleCode,
        });
        onDebugCall?.({
          id: `studbook-search-${Date.now()}`,
          label: 'Studbook horse search',
          method: 'GET',
          backendEndpoint: `https://studmanagerapi-dev.studmarket.net/api/ExternalHorses/search-external-horses?SearchTerm=${encodeURIComponent(query)}&PageNumber=1&PageSize=12`,
          nextEndpoint: `/api/horses/studbook?search=${encodeURIComponent(query)}&pageNumber=1&pageSize=12&locale=${locale}`,
          nextService: 'app/api/horses/studbook/route.ts -> lib/api/horses-service.ts:searchStudbookHorses',
          payload: {
            search: query,
            pageNumber: 1,
            pageSize: 12,
            locale,
          },
          status: 200,
          response: payload,
          createdAt: new Date().toLocaleTimeString(),
        });

        setStudbook(payload);
      } catch (requestError) {
        if (!controller.signal.aborted) {
          const status = typeof requestError === 'object' && requestError && 'status' in requestError
            ? Number((requestError as { status?: number }).status)
            : undefined;
          if (status === 401) {
            handleSessionExpired();
            return;
          }

          const message = requestError instanceof Error ? requestError.message : t('login.networkError');
          setError(message);
          onDebugCall?.({
            id: `studbook-search-error-${Date.now()}`,
            label: 'Studbook horse search',
            method: 'GET',
            backendEndpoint: `https://studmanagerapi-dev.studmarket.net/api/ExternalHorses/search-external-horses?SearchTerm=${encodeURIComponent(query)}&PageNumber=1&PageSize=12`,
            nextEndpoint: `/api/horses/studbook?search=${encodeURIComponent(query)}&pageNumber=1&pageSize=12&locale=${locale}`,
            nextService: 'app/api/horses/studbook/route.ts -> lib/api/horses-service.ts:searchStudbookHorses',
            payload: { search: query, pageNumber: 1, pageSize: 12, locale },
            error: message,
            createdAt: new Date().toLocaleTimeString(),
          });
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 350);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [locale, query, t]);

  const handleImport = async () => {
    if (!selectedHorse) return;

    setImporting(true);
    setError('');

    try {
      const importPayload: ImportHorseDto = {
        studbookId: selectedHorse.id,
        strain: selectedHorse.strain,
        specialLine: selectedHorse.specialLine,
        strainAr: selectedHorse.strainAr,
        specialLineAr: selectedHorse.specialLineAr,
      };
      const payload = await clientApiFetch<ApiResult<number>>({
        method: 'POST',
        backendPath: '/api/ExternalHorses/import-horse',
        nextPath: '/api/horses/import',
        body: importPayload,
        nextBody: { ...importPayload, locale },
        locale: locale as LocaleCode,
      });
      onDebugCall?.({
        id: `studbook-import-${Date.now()}`,
        label: 'Import Studbook horse',
        method: 'POST',
        backendEndpoint: 'https://studmanagerapi-dev.studmarket.net/api/ExternalHorses/import-horse',
        nextEndpoint: '/api/horses/import',
        nextService: 'app/api/horses/import/route.ts -> lib/api/horses-service.ts:importHorse',
        payload: {
          studbookId: selectedHorse.id,
          strain: selectedHorse.strain,
          specialLine: selectedHorse.specialLine,
          strainAr: selectedHorse.strainAr,
          specialLineAr: selectedHorse.specialLineAr,
          locale,
        },
        status: payload?.statusCode ?? 200,
        response: payload,
        createdAt: new Date().toLocaleTimeString(),
      });

      if (payload?.succeeded === false) {
        setError(payload?.message || t('common.error'));
        return;
      }

      onImported();
    } catch (requestError) {
      const status = typeof requestError === 'object' && requestError && 'status' in requestError
        ? Number((requestError as { status?: number }).status)
        : undefined;
      if (status === 401) {
        handleSessionExpired();
        return;
      }

      const message = requestError instanceof Error ? requestError.message : t('login.networkError');
      setError(message);
      onDebugCall?.({
        id: `studbook-import-error-${Date.now()}`,
        label: 'Import Studbook horse',
        method: 'POST',
        backendEndpoint: 'https://studmanagerapi-dev.studmarket.net/api/ExternalHorses/import-horse',
        nextEndpoint: '/api/horses/import',
        nextService: 'app/api/horses/import/route.ts -> lib/api/horses-service.ts:importHorse',
        payload: selectedHorse
          ? {
              studbookId: selectedHorse.id,
              strain: selectedHorse.strain,
              specialLine: selectedHorse.specialLine,
              strainAr: selectedHorse.strainAr,
              specialLineAr: selectedHorse.specialLineAr,
              locale,
            }
          : null,
        error: message,
        createdAt: new Date().toLocaleTimeString(),
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        dir={direction}
        className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-[16px] bg-white shadow-xl sm:rounded-[28px]"
      >
        <div
          className={`flex flex-col gap-3 px-4 py-4 sm:items-center sm:justify-between sm:px-8 sm:py-6 ${
            isRTL ? 'sm:flex-row-reverse' : 'sm:flex-row'
          }`}
        >
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-text-dark sm:text-[24px]">
              {t('horses.addFromStudbook')}
            </h2>
            <Image src="/horse/Group.svg" alt="" width={24} height={24} />
          </div>

          <button
            onClick={onClose}
            className="text-gray-500 transition hover:text-black"
            aria-label={t('common.cancel')}
          >
            <span className="text-3xl leading-none">×</span>
          </button>
        </div>

        <div className={`flex items-center gap-4 px-4 py-4 sm:px-8 ${isRTL ? 'justify-start' : 'justify-end'}`}>
          <button
            onClick={onManualAdd}
            className="rounded-[16px] border-2 border-[#311C11] px-4 py-[14px] text-xs font-medium sm:px-6 sm:text-sm"
          >
            {t('horses.addManually')}
          </button>

          <div className="relative w-full sm:max-w-[360px]">
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('common.search')}
              className={`h-11 w-full rounded-full border border-[#eadfd9] bg-white text-sm outline-none focus:border-[#5a3b25] focus:ring-2 focus:ring-[#5a3b25]/10 ${
                isRTL ? 'pr-12 text-right' : 'pl-12 text-left'
              }`}
            />
            <span className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'right-4' : 'left-4'}`}>
              <Image src="/horse/search.svg" alt="" width={20} height={20} />
            </span>
          </div>
        </div>

        <div className="px-4 sm:px-8">
          <p className={`text-sm text-[#7a6c63] ${isRTL ? 'text-right' : 'text-left'}`}>
            {t('horses.studbookInstruction')}
          </p>
          {error ? (
            <div className="mt-3 rounded-2xl border border-[#f2c7c7] bg-[#fff3f3] px-4 py-3 text-sm text-[#b04444]">
              {error}
            </div>
          ) : null}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
          {loading ? (
            <div className="py-10 text-center text-sm text-[#7a6c63]">{t('common.loading')}</div>
          ) : cards.length ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              {cards.map((horse) => (
                <button
                  key={horse.id}
                  onClick={() => setSelectedId(Number(horse.id))}
                  className={`rounded-lg border-[3px] bg-white p-3 text-center shadow-sm transition hover:border-[#bda58f] hover:shadow-md sm:rounded-2xl sm:p-4 ${
                    selectedId === Number(horse.id)
                      ? 'border-[#5a3b25] ring-2 ring-[#5a3b25]/20'
                      : 'border-[#d9c8ba]'
                  }`}
                >
                  <img
                    src={horse.image}
                    alt={horse.nameEn}
                    className="h-32 w-full rounded-lg object-cover sm:h-40 sm:rounded-xl"
                  />
                  <div className="mt-4 text-sm font-semibold text-[#3a2c24]">{horse.nameAr}</div>
                  <div className="text-sm text-[#8a7b70]">{horse.nameEn}</div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs text-[#7a6c63]">
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-[#3a2c24]">{horse.metaValue}</div>
                      <div className="truncate">{horse.metaLabel}</div>
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-[#3a2c24]">{horse.birthDate}</div>
                      <div className="truncate">{t('horses.birthDate')}</div>
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-[#3a2c24]">{horse.type}</div>
                      <div className="truncate">{t('horses.type')}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-sm text-[#7a6c63]">{t('common.noRecordsFound')}</div>
          )}
        </div>

        <div
          className={`sticky bottom-0 flex flex-col-reverse gap-3 border-t border-[#eadfd9] bg-white/95 px-4 py-4 shadow-[0_-12px_30px_rgba(49,28,17,0.08)] backdrop-blur sm:flex-row sm:gap-4 sm:px-8 ${
            isRTL ? 'sm:flex-row-reverse sm:justify-start' : 'sm:justify-end'
          }`}
        >
          <button
            onClick={onClose}
            className="rounded-xl border border-[#eadfd9] bg-white px-6 py-3 text-sm font-medium transition hover:bg-[#f3e8e3]"
          >
            {t('common.cancel')}
          </button>

          <button
            onClick={handleImport}
            disabled={!selectedHorse || importing}
            className="rounded-xl bg-[#311C11] px-6 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-40"
          >
            {importing ? t('common.loading') : t('common.add')}
          </button>
        </div>
      </div>
    </div>
  );
}
