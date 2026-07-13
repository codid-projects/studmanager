'use client';

import { useEffect, useMemo, useState } from 'react';
import { Save, Search, Tag, X } from 'lucide-react';
import { useBodyScrollLock } from '@/components/common/useBodyScrollLock';
import { clientApiFetch } from '@/lib/api/client';
import { getLocalizedName } from '@/lib/api/localization';
import { useLocale, useTranslation } from '@/lib/locale-context';
import type {
  ApiResult,
  ExternalHorseSummaryItem,
  HorseTagDto,
  LocaleCode,
  PagedResponse,
  StudbookHorseDto,
} from '@/lib/api/types';

interface ExternalHorseSearchModalProps {
  onClose: () => void;
}

const PAGE_SIZE = 12;

function formatDate(value: string | null | undefined) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString().slice(0, 10);
}

export function ExternalHorseSearchModal({ onClose }: ExternalHorseSearchModalProps) {
  const { t } = useTranslation();
  const { locale, direction } = useLocale();
  const isRTL = direction === 'rtl';
  const localeCode = locale as LocaleCode;

  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [results, setResults] = useState<PagedResponse<StudbookHorseDto> | null>(null);
  const [selected, setSelected] = useState<StudbookHorseDto | null>(null);
  const [summary, setSummary] = useState<ExternalHorseSummaryItem | null>(null);
  const [directTag, setDirectTag] = useState<HorseTagDto | null>(null);
  const [tagName, setTagName] = useState('');
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [savingTag, setSavingTag] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useBodyScrollLock(true);

  useEffect(() => {
    setPage(1);
  }, [query]);

  useEffect(() => {
    let active = true;
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      setMessage(null);

      try {
        const payload = await clientApiFetch<PagedResponse<StudbookHorseDto>>({
          backendPath: '/api/ExternalHorses/search-external-horses',
          nextPath: '/api/horses/studbook',
          backendQuery: {
            SearchTerm: query,
            PageNumber: page,
            PageSize: PAGE_SIZE,
          },
          nextQuery: {
            search: query,
            pageNumber: page,
            pageSize: PAGE_SIZE,
            locale,
          },
          locale: localeCode,
        });

        if (active) setResults(payload);
      } catch (error) {
        if (!active) return;
        setMessage({
          type: 'error',
          text: error instanceof Error ? error.message : t('common.error'),
        });
      } finally {
        if (active) setLoading(false);
      }
    }, 300);

    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [locale, localeCode, page, query, t]);

  async function loadSelectedHorse(horse: StudbookHorseDto) {
    setSelected(horse);
    setSummary(null);
    setDirectTag(null);
    setTagName('');
    setMessage(null);
    setDetailsLoading(true);

    try {
      const [summaryResult, tagsResult] = await Promise.all([
        clientApiFetch<ApiResult<ExternalHorseSummaryItem>>({
          backendPath: `/api/ExternalHorses/${horse.id}/summary`,
          nextPath: `/api/external-horses/${horse.id}/summary`,
          nextQuery: { locale },
          locale: localeCode,
        }),
        clientApiFetch<ApiResult<HorseTagDto[]>>({
          backendPath: `/api/Horses/${horse.id}/tags`,
          nextPath: `/api/horses/${horse.id}/tags`,
          query: { idType: 'studbook' },
          nextQuery: { idType: 'studbook', locale },
          locale: localeCode,
        }),
      ]);

      const loadedSummary = summaryResult.data ?? null;
      const loadedDirectTag = (tagsResult.data ?? []).find((tag) => !tag.isInherited) ?? null;
      setSummary(loadedSummary);
      setDirectTag(loadedDirectTag);
      setTagName(loadedDirectTag?.name ?? '');
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : t('common.error'),
      });
    } finally {
      setDetailsLoading(false);
    }
  }

  async function saveTag() {
    if (!selected) return;
    const cleaned = tagName.trim();
    if (!cleaned) {
      setMessage({
        type: 'error',
        text: isRTL ? 'اسم الوسم مطلوب.' : 'Tag name is required.',
      });
      return;
    }

    setSavingTag(true);
    setMessage(null);

    try {
      const payload = await clientApiFetch<ApiResult<HorseTagDto[]>>({
        method: directTag ? 'PUT' : 'POST',
        backendPath: directTag
          ? `/api/Horses/${selected.id}/tags/${directTag.id}`
          : `/api/Horses/${selected.id}/tags`,
        nextPath: directTag
          ? `/api/horses/${selected.id}/tags/${directTag.id}`
          : `/api/horses/${selected.id}/tags`,
        query: { idType: 'studbook' },
        nextQuery: { idType: 'studbook', locale },
        locale: localeCode,
        body: {
          name: cleaned,
          englishName: summary?.englishName ?? selected.englishName,
          arabicName: summary?.arabicName ?? selected.arabicName,
        },
      });

      if (payload.succeeded === false) {
        throw new Error(payload.message || t('common.error'));
      }

      const nextDirectTag = (payload.data ?? []).find((tag) => !tag.isInherited) ?? null;
      setDirectTag(nextDirectTag);
      setTagName(nextDirectTag?.name ?? cleaned);
      setMessage({
        type: 'success',
        text: directTag
          ? isRTL ? 'تم تحديث الوسم.' : 'Tag updated.'
          : isRTL ? 'تم حفظ الوسم.' : 'Tag saved.',
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : t('common.error'),
      });
    } finally {
      setSavingTag(false);
    }
  }

  const selectedName = useMemo(() => {
    if (!selected) return '';
    return getLocalizedName(selected.englishName, selected.arabicName, isRTL) || String(selected.id);
  }, [isRTL, selected]);

  const totalPages = Math.max(1, results?.totalPages || 1);

  return (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center bg-black/45 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        dir={direction}
        className="grid max-h-[90vh] w-full max-w-6xl grid-cols-1 overflow-hidden rounded-[22px] bg-white shadow-xl lg:grid-cols-[minmax(0,1fr)_390px]"
      >
        <div className="flex min-h-0 flex-col border-[#eadfd7] lg:border-e">
          <div className="flex items-center justify-between gap-3 border-b border-[#eadfd7] px-5 py-4">
            <div>
              <h2 className="text-lg font-black text-[#2b1a12]">
                {isRTL ? 'البحث في كل خيول Studbook' : 'Search All External Horses'}
              </h2>
              <p className="text-xs text-[#7a6c63]">
                {isRTL ? 'اختر خيلاً لعرض تفاصيله وإدارة الوسم' : 'Select a horse to preview details and manage its tag'}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f7f1eb] text-[#3b2b20] transition hover:bg-[#efe5da]"
              aria-label={isRTL ? 'إغلاق' : 'Close'}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="border-b border-[#eadfd7] p-4">
            <div className="relative">
              <Search className={`pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-[#9b8a7a] ${isRTL ? 'right-4' : 'left-4'}`} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={isRTL ? 'ابحث بالاسم العربي أو الإنجليزي أو الرقم...' : 'Search name or studbook id...'}
                className={`h-12 w-full rounded-2xl border border-[#eadfd7] bg-[#fffdfb] text-sm font-semibold text-[#2b1a12] outline-none focus:border-[#5a3b25] focus:ring-2 focus:ring-[#5a3b25]/10 ${
                  isRTL ? 'pr-11 pl-4 text-right' : 'pl-11 pr-4 text-left'
                }`}
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="rounded-2xl bg-[#fbf8f4] p-6 text-center text-sm text-[#7a6c63]">
                {t('common.loading')}
              </div>
            ) : results?.data?.length ? (
              <div className="space-y-2">
                {results.data.map((horse) => {
                  const name = getLocalizedName(horse.englishName, horse.arabicName, isRTL) || String(horse.id);
                  const active = selected?.id === horse.id;

                  return (
                    <button
                      key={horse.id}
                      type="button"
                      onClick={() => loadSelectedHorse(horse)}
                      className={`w-full rounded-2xl border px-4 py-3 text-start transition ${
                        active
                          ? 'border-[#5a3b25] bg-[#f7f1eb]'
                          : 'border-[#eadfd7] bg-white hover:bg-[#fbf8f4]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="min-w-0 truncate text-sm font-black text-[#2b1a12]">{name}</span>
                        <span className="shrink-0 rounded-full bg-[#f0e5d3] px-2 py-0.5 text-[11px] font-bold text-[#6a5548]">
                          #{horse.id}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#7a6c63]">
                        <span>{horse.gender || '-'}</span>
                        <span>{formatDate(horse.dateofBirth)}</span>
                        {horse.strain || horse.strainAr ? (
                          <span>{isRTL ? horse.strainAr || horse.strain : horse.strain || horse.strainAr}</span>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl bg-[#fbf8f4] p-6 text-center text-sm text-[#7a6c63]">
                {t('common.noRecordsFound')}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-[#eadfd7] px-4 py-3 text-xs font-bold text-[#6a5548]">
            <button
              type="button"
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              disabled={page <= 1 || loading}
              className="rounded-xl border border-[#eadfd7] px-3 py-2 disabled:opacity-40"
            >
              {isRTL ? 'السابق' : 'Previous'}
            </button>
            <span>
              {page} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
              disabled={page >= totalPages || loading}
              className="rounded-xl border border-[#eadfd7] px-3 py-2 disabled:opacity-40"
            >
              {isRTL ? 'التالي' : 'Next'}
            </button>
          </div>
        </div>

        <aside className="min-h-0 overflow-y-auto bg-[#fbf8f4] p-5">
          {!selected ? (
            <div className="flex min-h-[260px] items-center justify-center rounded-2xl border border-dashed border-[#d9c8bd] bg-white p-6 text-center text-sm text-[#7a6c63]">
              {isRTL ? 'اختر خيلاً لعرض التفاصيل والوسم.' : 'Select a horse to preview details and tags.'}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-[#eadfd7] bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-black text-[#2b1a12]">{selectedName}</h3>
                    <p className="mt-1 text-xs font-bold text-[#7a6c63]">Studbook ID: {selected.id}</p>
                  </div>
                  {detailsLoading ? (
                    <span className="rounded-full bg-[#f0e5d3] px-2 py-1 text-[11px] font-bold text-[#6a5548]">
                      {t('common.loading')}
                    </span>
                  ) : null}
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <dt className="font-bold text-[#9b8a7a]">{isRTL ? 'النوع' : 'Gender'}</dt>
                    <dd className="mt-1 font-black text-[#2b1a12]">{summary?.gender ?? selected.gender ?? '-'}</dd>
                  </div>
                  <div>
                    <dt className="font-bold text-[#9b8a7a]">{isRTL ? 'تاريخ الميلاد' : 'Birth date'}</dt>
                    <dd className="mt-1 font-black text-[#2b1a12]">{formatDate(summary?.dateofBirth ?? selected.dateofBirth)}</dd>
                  </div>
                  <div>
                    <dt className="font-bold text-[#9b8a7a]">{isRTL ? 'الأب' : 'Father'}</dt>
                    <dd className="mt-1 font-black text-[#2b1a12]">
                      {getLocalizedName(summary?.horseFatherEnglishName ?? selected.horseFatherEnglishName, summary?.horseFatherArabicName ?? selected.horseFatherArabicName, isRTL) || '-'}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-bold text-[#9b8a7a]">{isRTL ? 'الأم' : 'Mother'}</dt>
                    <dd className="mt-1 font-black text-[#2b1a12]">
                      {getLocalizedName(summary?.horseMotherEnglishName ?? selected.horseMotherEnglishName, summary?.horseMotherArabicName ?? selected.horseMotherArabicName, isRTL) || '-'}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-2xl border border-[#eadfd7] bg-white p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h4 className="flex items-center gap-2 text-sm font-black text-[#2b1a12]">
                    <Tag className="h-4 w-4" />
                    {isRTL ? 'وسم الخيل' : 'Horse tag'}
                  </h4>
                  {directTag ? (
                    <span className="rounded-full bg-[#d8eddf] px-2 py-1 text-[11px] font-bold text-[#245338]">
                      {isRTL ? 'موجود' : 'Existing'}
                    </span>
                  ) : null}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    value={tagName}
                    onChange={(event) => setTagName(event.target.value)}
                    placeholder={isRTL ? 'اسم الوسم' : 'Tag name'}
                    className="h-11 min-w-0 flex-1 rounded-xl border border-[#eadfd7] bg-[#fffdfb] px-3 text-sm font-semibold text-[#2b1a12] outline-none focus:border-[#5a3b25]"
                  />
                  <button
                    type="button"
                    onClick={saveTag}
                    disabled={savingTag || detailsLoading}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#311C11] text-primary-light disabled:opacity-50"
                    aria-label={directTag ? (isRTL ? 'تحديث الوسم' : 'Update tag') : (isRTL ? 'حفظ الوسم' : 'Save tag')}
                  >
                    <Save className="h-4 w-4" />
                  </button>
                </div>

                {directTag ? (
                  <p className="mt-2 text-xs text-[#7a6c63]">
                    {isRTL ? 'سيتم تعديل الوسم الموجود.' : 'Saving will edit the existing tag.'}
                  </p>
                ) : null}
              </div>

              {message ? (
                <div
                  className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
                    message.type === 'success'
                      ? 'border-[#b9dfc4] bg-[#effaf2] text-[#245338]'
                      : 'border-[#f2c7c7] bg-[#fff3f3] text-[#b04444]'
                  }`}
                >
                  {message.text}
                </div>
              ) : null}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
