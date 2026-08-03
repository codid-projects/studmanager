'use client';

import { FC, useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Save, Search, Tag, X } from 'lucide-react';
import { clientApiFetch } from '@/lib/api/client';
import { getHorseFamilyAnalysisTree, normalizePagedList } from '@/lib/api/external-horses';
import { getLocalizedName } from '@/lib/api/localization';
import { useLocale } from '@/lib/locale-context';
import type { ApiResult, HorseFamilyTreeItem, HorseTagDto } from '@/lib/api/types';

const SEARCH_LEVELS = 12;
const MIN_QUERY_LENGTH = 2;
const FETCH_PAGE_SIZE = 1000;
const MAX_RENDERED_RESULTS = 50;

interface HorseFamilySearchProps {
  localId: number;
}

// Mirrors the backend StringNormalizer so matching is tolerant of Arabic
// diacritics/letter variants and common transliteration differences.
const normalizeName = (value: string) => {
  let text = value.trim().toLowerCase();
  if (!text) return '';

  // Arabic: strip tashkeel + tatweel, unify letter variants
  text = text
    .replace(/[ً-ٟ]/g, '')
    .replace(/ـ/g, '')
    .replace(/[أإآٱٲٳ]/g, 'ا')
    .replace(/[ىئٸ]/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/[ةۀ]/g, 'ه')
    .replace(/ء/g, 'ا');

  // English: unify common Arabic-name transliteration tokens
  const tokens = text.split(/\s+/).map((token) => {
    switch (token) {
      case 'el':
        return 'al';
      case 'ibn':
      case 'abn':
      case 'ebn':
        return 'bin';
      case 'bent':
        return 'bint';
      case 'abo':
      case 'abou':
        return 'abu';
      default:
        return token;
    }
  });

  return tokens.join('').replace(/[^\p{L}\p{N}]/gu, '');
};

const matchesQuery = (item: HorseFamilyTreeItem, rawQuery: string, normalizedQuery: string) => {
  const rawLower = rawQuery.toLowerCase();

  for (const name of [item.englishName, item.arabicName]) {
    if (!name) continue;
    if (name.toLowerCase().includes(rawLower)) return true;
    if (normalizedQuery && normalizeName(name).includes(normalizedQuery)) return true;
  }

  return false;
};

const formatPercentage = (value: number | null | undefined) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return `${value.toFixed(value < 1 ? 2 : 1)}%`;
};

const formatGenerations = (levels: number[] | null | undefined, isRTL: boolean) => {
  if (!levels?.length) return '';
  const unique = [...new Set(levels)].sort((a, b) => a - b);
  return isRTL
    ? `الجيل ${unique.join('، ')}`
    : `Generation ${unique.join(', ')}`;
};

export const HorseFamilySearch: FC<HorseFamilySearchProps> = ({ localId }) => {
  const { direction } = useLocale();
  const isRTL = direction === 'rtl';

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [ancestors, setAncestors] = useState<HorseFamilyTreeItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [taggingHorseId, setTaggingHorseId] = useState<number | null>(null);
  const [tagName, setTagName] = useState('');
  const [tagSavingId, setTagSavingId] = useState<number | null>(null);
  const [tagSavedHorseId, setTagSavedHorseId] = useState<number | null>(null);
  const [directTagsByHorseId, setDirectTagsByHorseId] = useState<Record<number, HorseTagDto | null>>({});
  const [tagMessage, setTagMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const trimmedQuery = query.trim();

  useEffect(() => {
    setQuery('');
    setAncestors(null);
    setError('');
  }, [localId]);

  useEffect(() => {
    if (!open) return;

    const frame = window.requestAnimationFrame(() => inputRef.current?.focus());

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  // Load the full family tree once per horse; filtering happens locally so
  // results stay correct even when the API ignores the search parameter.
  useEffect(() => {
    if (!open || ancestors !== null) return;

    let mounted = true;
    setLoading(true);
    setError('');

    (async () => {
      try {
        const result = await getHorseFamilyAnalysisTree({
          localId,
          levels: SEARCH_LEVELS,
          pageNumber: 1,
          pageSize: FETCH_PAGE_SIZE,
        });

        if (!mounted) return;
        const items = normalizePagedList(result).items;
        setAncestors(items);
        setDirectTagsByHorseId(Object.fromEntries(
          items.map((item) => [
            item.id,
            (item.tags ?? []).find((tag) => !tag.isInherited) ?? null,
          ]),
        ));
      } catch (requestError) {
        if (!mounted) return;
        setError(
          requestError instanceof Error
            ? requestError.message
            : isRTL
              ? 'تعذر تحميل شجرة العائلة.'
              : 'Failed to load the family tree.',
        );
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [open, ancestors, localId, isRTL, reloadKey]);

  const matches = useMemo(() => {
    if (!ancestors || trimmedQuery.length < MIN_QUERY_LENGTH) return null;

    const normalizedQuery = normalizeName(trimmedQuery);
    return ancestors.filter((item) => matchesQuery(item, trimmedQuery, normalizedQuery));
  }, [ancestors, trimmedQuery]);

  const showIdle = !loading && !error && trimmedQuery.length < MIN_QUERY_LENGTH;
  const showEmpty = !loading && !error && matches !== null && matches.length === 0;
  const visibleMatches = matches?.slice(0, MAX_RENDERED_RESULTS) ?? [];

  function openTagEditor(item: HorseFamilyTreeItem) {
    const existingTag = directTagsByHorseId[item.id];
    setTaggingHorseId(item.id);
    setTagName(existingTag?.name ?? '');
    setTagSavedHorseId(null);
    setTagMessage(null);
  }

  async function saveSearchResultTag(item: HorseFamilyTreeItem) {
    const cleaned = tagName.trim();
    if (!cleaned) {
      setTagMessage({
        type: 'error',
        text: isRTL ? 'اسم الوسم مطلوب.' : 'Tag name is required.',
      });
      return;
    }

    setTagSavingId(item.id);
    setTagSavedHorseId(null);
    setTagMessage(null);

    try {
      const existingTag = directTagsByHorseId[item.id] ?? null;
      const result = await clientApiFetch<ApiResult<HorseTagDto[]>>({
        method: existingTag ? 'PUT' : 'POST',
        backendPath: existingTag
          ? `/api/Horses/${item.id}/tags/${existingTag.id}`
          : `/api/Horses/${item.id}/tags`,
        nextPath: existingTag
          ? `/api/horses/${item.id}/tags/${existingTag.id}`
          : `/api/horses/${item.id}/tags`,
        query: { idType: 'studbook' },
        body: {
          name: cleaned,
          englishName: item.englishName,
          arabicName: item.arabicName,
        },
      });

      if (result.succeeded === false) {
        throw new Error(result.message || (isRTL ? 'تعذر حفظ الوسم.' : 'Failed to save tag.'));
      }

      const tags = result.data ?? [];
      const directTag = tags.find((tag) => !tag.isInherited) ?? null;
      setDirectTagsByHorseId((current) => ({ ...current, [item.id]: directTag }));
      setAncestors((current) => current?.map((ancestor) =>
        ancestor.id === item.id ? { ...ancestor, tags } : ancestor
      ) ?? current);
      setTagMessage({
        type: 'success',
        text: existingTag
          ? isRTL ? 'تم تحديث الوسم.' : 'Tag updated.'
          : isRTL ? 'تم حفظ الوسم.' : 'Tag saved.',
      });
      setTagSavedHorseId(item.id);
      setTagName('');
      setTaggingHorseId(null);
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : '';
      if (message.includes('already has a tag')) {
        setTagMessage({
          type: 'error',
          text: isRTL
            ? 'هذا الخيل لديه وسم بالفعل. عدّل الوسم الموجود هنا.'
            : 'This horse already has a tag. Edit the existing tag here.',
        });
        return;
      }

      setTagMessage({
        type: 'error',
        text:
          message
            ? message
            : isRTL
              ? 'تعذر حفظ الوسم.'
              : 'Failed to save tag.',
      });
    } finally {
      setTagSavingId(null);
    }
  }

  return (
    <>
      <div dir={direction} className="mb-4 flex justify-end px-1">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex h-11 items-center gap-2 whitespace-nowrap rounded-2xl bg-[#4a2b1a] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#3b2115] focus:outline-none focus:ring-2 focus:ring-[#4a2b1a]/30"
        >
          <Search className="h-4 w-4" />
          {isRTL ? 'البحث في عائلة الخيل' : 'Family Search'}
        </button>
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div
            dir={direction}
            className="flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-[24px] bg-white shadow-xl"
          >
            <div className="flex items-start justify-between gap-4 px-5 pb-3 pt-5">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#f7f1eb] text-[#4a2b1a]">
                  <Search className="h-5 w-5" />
                </span>

                <div className="min-w-0">
                  <h3 className="truncate text-lg font-bold text-[#2b1a12]">
                    {isRTL ? 'البحث في عائلة الخيل' : 'Family Ancestry Search'}
                  </h3>
                  <p className="mt-0.5 text-xs text-[#7a6c63]">
                    {isRTL
                      ? `يشمل البحث حتى ${SEARCH_LEVELS} جيلاً من الأجداد`
                      : `Searches up to ${SEARCH_LEVELS} generations of ancestors`}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f7f1eb] text-[#3b2b20] transition hover:bg-[#efe5da]"
                aria-label={isRTL ? 'إغلاق' : 'Close'}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-5 pb-4">
              <div className="relative">
                <span
                  className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-[#b3a698] ${
                    isRTL ? 'right-4' : 'left-4'
                  }`}
                >
                  <Search className="h-4 w-4" />
                </span>

                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={
                    isRTL
                      ? 'اكتب اسم الخيل (عربي أو إنجليزي)...'
                      : 'Type a horse name (Arabic or English)...'
                  }
                  className={`h-12 w-full rounded-2xl border border-[#e6ddd4] bg-[#fbf8f4] text-sm text-[#2b1a12] outline-none transition placeholder:text-[#b3a698] focus:border-[#c9a76a] focus:bg-white ${
                    isRTL ? 'pr-11 pl-11' : 'pl-11 pr-11'
                  }`}
                />

                {query ? (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('');
                      inputRef.current?.focus();
                    }}
                    className={`absolute top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[#7a6c63] transition hover:bg-[#f2ece5] ${
                      isRTL ? 'left-2' : 'right-2'
                    }`}
                    aria-label={isRTL ? 'مسح' : 'Clear'}
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            </div>

            <div className="min-h-[180px] flex-1 overflow-y-auto px-5 pb-5">
              {loading ? (
                <div className="space-y-2">
                  {[0, 1, 2].map((index) => (
                    <div key={index} className="h-16 animate-pulse rounded-2xl bg-[#f2ece5]" />
                  ))}
                </div>
              ) : null}

              {error ? (
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-[#f2c7c7] bg-[#fff3f3] px-4 py-5 text-center text-sm text-[#b04444]">
                  <span>{error}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setError('');
                      setAncestors(null);
                      setReloadKey((key) => key + 1);
                    }}
                    className="rounded-xl bg-white px-4 py-2 text-xs font-semibold text-[#b04444] shadow-sm transition hover:bg-[#fdeaea]"
                  >
                    {isRTL ? 'إعادة المحاولة' : 'Retry'}
                  </button>
                </div>
              ) : null}

              {showIdle ? (
                <div className="flex h-full min-h-[160px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[#e0d3c5] bg-[#fbf8f4] px-6 py-8 text-center">
                  <Search className="h-6 w-6 text-[#cbbba9]" />
                  <p className="text-sm text-[#7a6c63]">
                    {isRTL
                      ? 'اكتب اسم خيل للتحقق مما إذا كان موجوداً في عائلة هذا الخيل — حتى لو لم يظهر في شهادة النسب المعروضة.'
                      : "Type a horse name to check whether it appears anywhere in this horse's family — even beyond what the pedigree certificate shows."}
                  </p>
                  {ancestors ? (
                    <p className="text-xs text-[#b3a698]">
                      {isRTL
                        ? `${ancestors.length} من الأجداد جاهزون للبحث`
                        : `${ancestors.length} ancestors ready to search`}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {showEmpty ? (
                <div className="flex min-h-[160px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[#d9c8ba] bg-[#fbf8f4] px-6 py-8 text-center">
                  <span className="text-2xl">🐎</span>
                  <p className="text-sm font-semibold text-[#4f4037]">
                    {isRTL ? 'غير موجود في العائلة' : 'Not found in the family'}
                  </p>
                  <p className="text-xs text-[#7a6c63]">
                    {isRTL
                      ? `لم يتم العثور على "${trimmedQuery}" خلال ${SEARCH_LEVELS} جيلاً من الأجداد.`
                      : `"${trimmedQuery}" was not found within ${SEARCH_LEVELS} generations of ancestors.`}
                  </p>
                </div>
              ) : null}

              {!loading && !error && matches && matches.length > 0 ? (
                <div>
                  <p className="mb-2 text-xs font-semibold text-[#7a6c63]">
                    {isRTL
                      ? `تم العثور على ${matches.length} من الأقارب المطابقين`
                      : `Found ${matches.length} matching family ${matches.length === 1 ? 'member' : 'members'}`}
                  </p>

                  <div className="space-y-2">
                    {visibleMatches.map((item) => {
                      const name = getLocalizedName(item.englishName, item.arabicName, isRTL) || '-';
                      const effectiveTags = item.tags ?? [];
                      const fatherName = getLocalizedName(
                        item.horseFatherEnglishName,
                        item.horseFatherArabicName,
                        isRTL,
                      );
                      const motherName = getLocalizedName(
                        item.horseMotherEnglishName,
                        item.horseMotherArabicName,
                        isRTL,
                      );
                      const percentage = formatPercentage(item.percentage);
                      const sireGenerations = formatGenerations(item.generationLevelsFromFather, isRTL);
                      const damGenerations = formatGenerations(item.generationLevelsFromMother, isRTL);

                      return (
                        <div
                          key={item.id}
                          className="rounded-2xl border border-[#efe7dd] bg-[#fbf8f4] px-4 py-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-sm font-bold text-[#2b1a12]">{name}</span>

                            {percentage ? (
                              <span className="rounded-full bg-[#f0e5d3] px-2.5 py-1 text-xs font-bold text-[#7a5c2e]">
                                {isRTL ? `نسبة الدم ${percentage}` : `${percentage} blood`}
                              </span>
                            ) : null}
                          </div>

                          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#7a6c63]">
                            {sireGenerations ? (
                              <span>
                                {isRTL ? 'من جهة الأب: ' : 'Sire side: '}
                                <span className="font-semibold text-[#4f4037]">{sireGenerations}</span>
                              </span>
                            ) : null}

                            {damGenerations ? (
                              <span>
                                {isRTL ? 'من جهة الأم: ' : 'Dam side: '}
                                <span className="font-semibold text-[#4f4037]">{damGenerations}</span>
                              </span>
                            ) : null}

                            {!sireGenerations && !damGenerations ? (
                              <span>{formatGenerations(item.generationLevels, isRTL)}</span>
                            ) : null}
                          </div>

                          {fatherName || motherName ? (
                            <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#9a8a7d]">
                              {fatherName ? (
                                <span>
                                  {isRTL ? 'الأب: ' : 'Father: '}
                                  {fatherName}
                                </span>
                              ) : null}

                              {motherName ? (
                                <span>
                                  {isRTL ? 'الأم: ' : 'Mother: '}
                                  {motherName}
                                </span>
                              ) : null}
                            </div>
                          ) : null}

                          <div className="mt-3 border-t border-[#eadfd4] pt-3">
                            {effectiveTags.length ? (
                              <div className="mb-2 flex flex-wrap gap-1.5">
                                {effectiveTags.map((tag) => (
                                  <div
                                    key={tag.id}
                                    className={`inline-flex max-w-full items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                                      tag.isInherited
                                        ? 'bg-[#f0e5d3] text-[#7a5c2e]'
                                        : 'bg-[#d8eddf] text-[#245338]'
                                    }`}
                                    title={tag.sourceLine ?? undefined}
                                  >
                                    <Tag className="h-3.5 w-3.5 shrink-0" />
                                    <span className="truncate">{tag.name}</span>
                                  </div>
                                ))}
                              </div>
                            ) : null}

                            {taggingHorseId === item.id ? (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <div className="relative min-w-0 flex-1">
                                    <Tag
                                      className={`pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-[#b3a698] ${
                                        isRTL ? 'right-3' : 'left-3'
                                      }`}
                                    />
                                    <input
                                      type="text"
                                      value={tagName}
                                      onChange={(event) => setTagName(event.target.value)}
                                      placeholder={
                                        isRTL ? 'اسم الوسم' : 'Tag name'
                                      }
                                      className={`h-10 w-full rounded-xl border border-[#e6ddd4] bg-white text-sm text-[#2b1a12] outline-none transition placeholder:text-[#b3a698] focus:border-[#c9a76a] ${
                                        isRTL ? 'pr-9 pl-3' : 'pl-9 pr-3'
                                      }`}
                                      onKeyDown={(event) => {
                                        if (event.key === 'Enter') saveSearchResultTag(item);
                                      }}
                                    />
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => saveSearchResultTag(item)}
                                    disabled={tagSavingId === item.id}
                                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#4a2b1a] text-white transition hover:bg-[#3b2115] disabled:cursor-not-allowed disabled:opacity-60"
                                    aria-label={
                                      directTagsByHorseId[item.id]
                                        ? isRTL ? 'تحديث الوسم' : 'Update tag'
                                        : isRTL ? 'حفظ الوسم' : 'Save tag'
                                    }
                                  >
                                    <Save className="h-4 w-4" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setTaggingHorseId(null);
                                      setTagName('');
                                      setTagSavedHorseId(null);
                                      setTagMessage(null);
                                    }}
                                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f2ece5] text-[#4f4037] transition hover:bg-[#e9ded2]"
                                    aria-label={isRTL ? 'إلغاء' : 'Cancel'}
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>

                                {tagMessage && taggingHorseId === item.id ? (
                                  <p
                                    className={`text-xs font-semibold ${
                                      tagMessage.type === 'success' ? 'text-[#2f7d4a]' : 'text-[#b04444]'
                                    }`}
                                  >
                                    {tagMessage.text}
                                  </p>
                                ) : null}
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => openTagEditor(item)}
                                className="inline-flex h-9 items-center gap-2 rounded-xl bg-white px-3 text-xs font-bold text-[#4a2b1a] shadow-sm ring-1 ring-[#eadfd4] transition hover:bg-[#f7f1eb]"
                              >
                                <Plus className="h-4 w-4" />
                                {isRTL ? 'إضافة وسم لهذا الخيل' : 'Add tag to this horse'}
                              </button>
                            )}

                            {tagMessage && tagMessage.type === 'success' && tagSavedHorseId === item.id ? (
                              <p className="mt-2 text-xs font-semibold text-[#2f7d4a]">{tagMessage.text}</p>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}

                    {matches.length > MAX_RENDERED_RESULTS ? (
                      <p className="pt-1 text-center text-xs text-[#b3a698]">
                        {isRTL
                          ? `يتم عرض أول ${MAX_RENDERED_RESULTS} نتيجة — اكتب اسماً أدق لتضييق البحث.`
                          : `Showing the first ${MAX_RENDERED_RESULTS} results — type a more specific name to narrow down.`}
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};
