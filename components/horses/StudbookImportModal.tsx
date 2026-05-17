'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Check } from 'lucide-react';
import type { ApiDebugEntry } from '@/components/debug/ApiDebugInspector';
import { useBodyScrollLock } from '@/components/common/useBodyScrollLock';
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
  const [currentPage, setCurrentPage] = useState(initialStudbook.currentPage || 1);
  const [selectedHorses, setSelectedHorses] = useState<StudbookHorseDto[]>([]);
  const [studbook, setStudbook] = useState(initialStudbook);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const pageSize = 12;

  useBodyScrollLock(true);

  const cards = useMemo(
    () => studbook.data.map((horse) => toStudbookCardModel(horse, locale as LocaleCode)),
    [locale, studbook.data],
  );
  const selectedIds = useMemo(
    () => new Set(selectedHorses.map((horse) => horse.id)),
    [selectedHorses],
  );
  const totalPages = Math.max(1, studbook.totalPages || 1);
  const canGoPrevious = currentPage > 1 && !loading;
  const canGoNext = currentPage < totalPages && !loading;
  const visiblePages = useMemo(() => {
    const start = Math.max(1, Math.min(currentPage - 1, totalPages - 2));
    const end = Math.min(totalPages, start + 2);

    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, [currentPage, totalPages]);

  const handleSessionExpired = () => {
    router.replace(`/${locale}/login?session=expired`);
    router.refresh();
  };

  const getHorseName = (horse: StudbookHorseDto) => {
    if (locale === 'ar') return horse.arabicName || horse.englishName || String(horse.id);
    return horse.englishName || horse.arabicName || String(horse.id);
  };

  const toggleSelectedHorse = (horseId: number) => {
    const horse = studbook.data.find((item) => item.id === horseId);
    if (!horse) return;

    setSelectedHorses((current) => {
      if (current.some((item) => item.id === horse.id)) {
        return current.filter((item) => item.id !== horse.id);
      }

      return [...current, horse];
    });
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [query]);

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
            PageNumber: currentPage,
            PageSize: pageSize,
          },
          nextQuery: {
            search: query,
            pageNumber: currentPage,
            pageSize,
            locale,
          },
          locale: locale as LocaleCode,
        });
        onDebugCall?.({
          id: `studbook-search-${Date.now()}`,
          label: 'Studbook horse search',
          method: 'GET',
          backendEndpoint: `https://studmanagerapi-dev.studmarket.net/api/ExternalHorses/search-external-horses?SearchTerm=${encodeURIComponent(query)}&PageNumber=${currentPage}&PageSize=${pageSize}`,
          nextEndpoint: `/api/horses/studbook?search=${encodeURIComponent(query)}&pageNumber=${currentPage}&pageSize=${pageSize}&locale=${locale}`,
          nextService: 'app/api/horses/studbook/route.ts -> lib/api/horses-service.ts:searchStudbookHorses',
          payload: {
            search: query,
            pageNumber: currentPage,
            pageSize,
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
            backendEndpoint: `https://studmanagerapi-dev.studmarket.net/api/ExternalHorses/search-external-horses?SearchTerm=${encodeURIComponent(query)}&PageNumber=${currentPage}&PageSize=${pageSize}`,
            nextEndpoint: `/api/horses/studbook?search=${encodeURIComponent(query)}&pageNumber=${currentPage}&pageSize=${pageSize}&locale=${locale}`,
            nextService: 'app/api/horses/studbook/route.ts -> lib/api/horses-service.ts:searchStudbookHorses',
            payload: { search: query, pageNumber: currentPage, pageSize, locale },
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
  }, [currentPage, locale, query, t]);

  const handleImport = async () => {
    if (!selectedHorses.length) return;

    setImporting(true);
    setError('');

    try {
      for (const selectedHorse of selectedHorses) {
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
          id: `studbook-import-${selectedHorse.id}-${Date.now()}`,
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
        payload: selectedHorses.map((horse) => ({
          studbookId: horse.id,
          strain: horse.strain,
          specialLine: horse.specialLine,
          strainAr: horse.strainAr,
          specialLineAr: horse.specialLineAr,
          locale,
        })),
        error: message,
        createdAt: new Date().toLocaleTimeString(),
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/40 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        dir={direction}
        className="flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-[16px] bg-white shadow-xl sm:rounded-[28px]"
        onWheel={(event) => event.stopPropagation()}
        onTouchMove={(event) => event.stopPropagation()}
      >
        <div
          className={`flex flex-col gap-3 px-4 py-4 sm:items-center sm:justify-between sm:px-8 sm:py-6 ${
            isRTL ? 'sm:flex-row' : 'sm:flex-row'
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

        <div
          className={`flex flex-col gap-3 border-y border-[#f1e8e1] bg-[#fbf8f4] px-4 py-4 sm:flex-row sm:items-center sm:gap-4 sm:px-8 ${
            isRTL ? 'sm:justify-start' : 'sm:justify-end'
          }`}
        >
          <div className="relative order-1 w-full sm:max-w-[430px]">
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('common.search')}
              className={`h-12 w-full rounded-2xl border-2 border-[#dccbc0] bg-white text-sm font-medium text-[#302018] shadow-sm outline-none transition placeholder:text-[#9b8b7f] focus:border-[#311C11] focus:ring-4 focus:ring-[#311C11]/10 ${
                isRTL ? 'pr-12 pl-4 text-right' : 'pl-12 pr-4 text-left'
              }`}
            />
            <span
              className={`pointer-events-none absolute top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-[#f3e8e1] ${
                isRTL ? 'right-3' : 'left-3'
              }`}
            >
              <Image src="/horse/search.svg" alt="" width={20} height={20} />
            </span>
          </div>

          <button
            onClick={onManualAdd}
            className="order-2 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-[#311C11] px-5 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(49,28,17,0.18)] transition hover:bg-[#4a2d1a] focus:outline-none focus:ring-2 focus:ring-[#311C11]/25 sm:w-auto sm:min-w-[150px]"
          >
            <span className="text-lg leading-none">+</span>
            <span className={isRTL ? 'mr-2' : 'ml-2'}>{t('horses.addManually')}</span>
          </button>
        </div>

        <div className="px-4 pt-4 sm:px-8">
          <div
            className={`rounded-2xl border border-[#eadfd9] bg-[#fffaf6] px-4 py-3 shadow-sm ${
              isRTL ? 'text-right' : 'text-left'
            }`}
          >
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-semibold text-[#311C11] sm:text-base">
                {isRTL ? 'اختر خيلًا واحدًا أو أكثر من Studbook.' : 'Select one or more horses from the Studbook.'}
              </p>
              <span className="text-xs font-medium text-[#8a6f5e]">
                {selectedHorses.length
                  ? isRTL
                    ? `${selectedHorses.length} محدد`
                    : `${selectedHorses.length} selected`
                  : isRTL
                    ? 'لم يتم تحديد أي خيل'
                    : 'No horses selected'}
              </span>
            </div>
          </div>
          {selectedHorses.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedHorses.map((horse) => (
                <span
                  key={horse.id}
                  className="inline-flex max-w-full items-center gap-2 rounded-full border border-[#d9c8ba] bg-[#fbf8f4] px-3 py-1.5 text-xs font-medium text-[#3a2c24]"
                >
                  <span className="max-w-[180px] truncate">{getHorseName(horse)}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedHorses((current) => current.filter((item) => item.id !== horse.id))}
                    className="flex h-5 w-5 items-center justify-center rounded-full text-[#7a6c63] transition hover:bg-[#eadfd9] hover:text-[#311C11]"
                    aria-label={isRTL ? 'إزالة من المحدد' : 'Remove selected horse'}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          ) : null}
          {error ? (
            <div className="mt-3 rounded-2xl border border-[#f2c7c7] bg-[#fff3f3] px-4 py-3 text-sm text-[#b04444]">
              {error}
            </div>
          ) : null}
        </div>

        <div className="flex-1 overscroll-contain overflow-y-auto px-4 py-6 sm:px-8">
          {loading ? (
            <div className="py-10 text-center text-sm text-[#7a6c63]">{t('common.loading')}</div>
          ) : cards.length ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              {cards.map((horse) => (
                <button
                  key={horse.id}
                  onClick={() => toggleSelectedHorse(Number(horse.id))}
                  className={`relative overflow-hidden rounded-2xl border-2 bg-white p-3 text-center shadow-[0_6px_18px_rgba(49,28,17,0.06)] transition hover:-translate-y-0.5 hover:border-[#8a684f] hover:shadow-[0_12px_28px_rgba(49,28,17,0.12)] sm:p-4 ${
                    selectedIds.has(Number(horse.id))
                      ? 'border-[#311C11] bg-[#fffaf6] ring-4 ring-[#311C11]/10'
                      : 'border-[#d8c7ba]'
                  }`}
                >
                  <span
                    className={`absolute top-3 flex h-7 w-7 items-center justify-center rounded-full border text-xs transition ${
                      isRTL ? 'left-3' : 'right-3'
                    } ${
                      selectedIds.has(Number(horse.id))
                        ? 'border-[#311C11] bg-[#311C11] text-white'
                        : 'border-[#d8c7ba] bg-white text-transparent'
                    }`}
                    aria-hidden="true"
                  >
                    <Check className="h-4 w-4" />
                  </span>
                  <img
                    src={horse.image}
                    alt={horse.nameEn}
                    className="h-32 w-full rounded-xl border border-[#f0e7df] object-cover sm:h-40"
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

        <div className="border-t border-[#f1e8e1] bg-[#fbf8f4] px-4 py-3 sm:px-8">
          <div className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
            <div className="text-center text-xs font-medium text-[#8a6f5e] sm:text-start">
              {isRTL
                ? `صفحة ${currentPage} من ${totalPages}`
                : `Page ${currentPage} of ${totalPages}`}
            </div>

            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={!canGoPrevious}
                className="h-9 rounded-xl border border-[#d8c7ba] bg-white px-3 text-sm font-semibold text-[#311C11] transition hover:bg-[#fff7f1] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isRTL ? 'السابق' : 'Prev'}
              </button>

              {visiblePages.map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  disabled={loading}
                  className={`h-9 min-w-9 rounded-xl border px-3 text-sm font-semibold transition ${
                    page === currentPage
                      ? 'border-[#311C11] bg-[#311C11] text-white'
                      : 'border-[#d8c7ba] bg-white text-[#311C11] hover:bg-[#fff7f1]'
                  } disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={!canGoNext}
                className="h-9 rounded-xl border border-[#d8c7ba] bg-white px-3 text-sm font-semibold text-[#311C11] transition hover:bg-[#fff7f1] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isRTL ? 'التالي' : 'Next'}
              </button>
            </div>
          </div>
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
            disabled={!selectedHorses.length || importing}
            className="rounded-xl bg-[#311C11] px-6 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-40"
          >
            {importing
              ? t('common.loading')
              : selectedHorses.length
                ? `${t('common.add')} (${selectedHorses.length})`
                : t('common.add')}
          </button>
        </div>
      </div>
    </div>
  );
}
