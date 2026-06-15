'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { HorseCard } from '@/components/horses/HorseCard';
import {
  HorseFormModal,
  type HorseFormData,
} from '@/components/horses/HorseFormModal';
import { LineageFilterPicker } from '@/components/horses/LineageFilterPicker';
import { StudbookImportModal } from '@/components/horses/StudbookImportModal';
import DeleteConfirmModal from '@/components/common/DeleteConfirmModal';
import { mediaUrl, toHorseCardModel } from '@/lib/api/horse-formatters';
import { clientApiFetch } from '@/lib/api/client';
import { buildCreateHorseFormData } from '@/lib/api/create-horse-form-data';
import { createHorse } from '@/lib/api/create-horse';
import { localizeApiMessage } from '@/lib/api/errors';
import { buildChangedHorsePayload } from '@/lib/api/horse-update-payload';
import { fetchSpecialLines, fetchStrains } from '@/lib/api/lineage-client';
import { isDirectApiMode } from '@/lib/api/transport';
import type {
  ApiResult,
  HorseInfoDto,
  HorseListItemDto,
  LineageNameDto,
  LocaleCode,
  PagedResponse,
  StudbookHorseDto,
  CreateHorsePayload,
} from '@/lib/api/types';
import { useLocale, useTranslation } from '@/lib/locale-context';

interface HorsesPageClientProps {
  initialHorses: PagedResponse<HorseListItemDto>;
  initialStudbook: PagedResponse<StudbookHorseDto>;
  initialError?: string;
}

type FilterBadge = {
  key: string;
  label: string;
  value: string;
  onClear: () => void;
};

const HORSES_PAGE_SIZE = 24;

function unwrapApiResult<T>(payload: T | ApiResult<T>): T | undefined {
  if (payload && typeof payload === 'object' && 'statusCode' in payload) {
    return (payload as ApiResult<T>).data;
  }

  return payload as T;
}

function toFilterId(value: string) {
  const cleanValue = value.trim();

  if (!cleanValue) return undefined;

  const parsedValue = Number(cleanValue);

  return Number.isFinite(parsedValue) && parsedValue > 0
    ? parsedValue
    : cleanValue;
}

function getLineageId(item: LineageNameDto) {
  const row = item as LineageNameDto & {
    id?: number | string;
    localId?: number | string;
    value?: number | string;
  };

  return String(row.id ?? row.localId ?? row.value ?? '');
}

function getLineageLabel(item: LineageNameDto, locale: LocaleCode) {
  const row = item as LineageNameDto & {
    name?: string;
    arabicName?: string;
    englishName?: string;
    nameAr?: string;
    nameEn?: string;
    title?: string;
    label?: string;
  };

  if (locale === 'ar') {
    return (
      row.arabicName ??
      row.nameAr ??
      row.name ??
      row.title ??
      row.label ??
      row.englishName ??
      row.nameEn ??
      ''
    );
  }

  return (
    row.englishName ??
    row.nameEn ??
    row.name ??
    row.title ??
    row.label ??
    row.arabicName ??
    row.nameAr ??
    ''
  );
}

function findLineageLabel(
  options: LineageNameDto[],
  value: string,
  locale: LocaleCode,
) {
  const selected = options.find((item) => getLineageId(item) === String(value));

  return selected ? getLineageLabel(selected, locale) : value;
}

export function HorsesPageClient({
  initialHorses,
  initialStudbook,
  initialError = '',
}: HorsesPageClientProps) {
  const { t } = useTranslation();
  const { locale, direction } = useLocale();
  const router = useRouter();
  const isRTL = direction === 'rtl';
  const localeCode = locale as LocaleCode;

  const [isStudbookOpen, setIsStudbookOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingHorseId, setEditingHorseId] = useState<string | null>(null);

  const [mainSearchQuery, setMainSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [strainFilter, setStrainFilter] = useState('');
  const [lineFilter, setLineFilter] = useState('');
  const [microshipFilter, setMicroshipFilter] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState<'' | 'true' | 'false'>('');

  const [strains, setStrains] = useState<LineageNameDto[]>([]);
  const [specialLines, setSpecialLines] = useState<LineageNameDto[]>([]);
  const [lineagesLoading, setLineagesLoading] = useState(true);

  const [horses, setHorses] = useState(initialHorses.data);
  const [error, setError] = useState(initialError);
  const [loading, setLoading] = useState(
    isDirectApiMode && !initialHorses.data.length,
  );
  const [loadingMore, setLoadingMore] = useState(false);

  const [pageInfo, setPageInfo] = useState({
    currentPage: initialHorses.currentPage || 1,
    totalPages: initialHorses.totalPages || 0,
    totalCount: initialHorses.totalCount || 0,
    hasNextPage: initialHorses.hasNextPage || false,
  });

  const [horseIdToDelete, setHorseIdToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const requestSeqRef = useRef(0);
  const appendInFlightRef = useRef(false);

  const uiText = useMemo(
    () => ({
      searchApplied: isRTL ? 'تم تطبيق البحث' : 'Search applied',
      applyingSearch: isRTL ? 'جاري تطبيق البحث...' : 'Applying search...',
      results: isRTL
        ? `${pageInfo.totalCount} نتيجة`
        : `${pageInfo.totalCount} results`,
      clearAll: isRTL ? 'مسح الكل' : 'Clear all',
      search: isRTL ? 'بحث' : 'Search',
      gender: isRTL ? 'النوع' : 'Gender',
      strain: isRTL ? 'السلالة' : 'Strain',
      line: isRTL ? 'الخط' : 'Line',
      microship: t('horses.microshipFilterLabel'),
      status: t('horses.statusFilterLabel'),
    }),
    [isRTL, pageInfo.totalCount, t],
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchQuery(mainSearchQuery.trim());
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [mainSearchQuery]);

  useEffect(() => {
    let active = true;

    setLineagesLoading(true);

    Promise.allSettled([
      fetchStrains(localeCode),
      fetchSpecialLines(localeCode),
    ]).then(([strainResult, lineResult]) => {
      if (!active) return;

      setStrains(strainResult.status === 'fulfilled' ? strainResult.value : []);
      setSpecialLines(lineResult.status === 'fulfilled' ? lineResult.value : []);
      setLineagesLoading(false);
    });

    return () => {
      active = false;
    };
  }, [localeCode]);

  useEffect(() => {
    if (isDirectApiMode) return;

    window.dispatchEvent(
      new CustomEvent('api-debug-entry', {
        detail: {
          id: `initial-horses-${Date.now()}`,
          label: 'Initial horses list',
          method: 'GET',
          backendEndpoint:
            'https://studmanagerapi-dev.studmarket.net/api/Horses?pageNumber=1&pageSize=24',
          nextEndpoint: `/api/horses?pageNumber=1&pageSize=24&locale=${locale}`,
          nextService:
            'Server render: app/[locale]/horses/page.tsx -> lib/api/horses-service.ts:getHorses',
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

  const filtersQuery = useMemo(() => {
    const search = debouncedSearchQuery || undefined;
    const gender = genderFilter || undefined;
    const strain = strainFilter || undefined;
    const line = lineFilter || undefined;
    const microship = microshipFilter.trim() || undefined;
    const isActive =
      isActiveFilter === '' ? undefined : isActiveFilter === 'true';

    return {
      search,
      gender,
      strain,
      line,
      microship,
      isActive,
    };
  }, [
    debouncedSearchQuery,
    genderFilter,
    isActiveFilter,
    lineFilter,
    microshipFilter,
    strainFilter,
  ]);

  const hasActiveFilters = Boolean(
    debouncedSearchQuery ||
      genderFilter ||
      strainFilter ||
      lineFilter ||
      microshipFilter.trim() ||
      isActiveFilter,
  );

  const activeFilterBadges = useMemo<FilterBadge[]>(() => {
    const badges: FilterBadge[] = [];

    if (debouncedSearchQuery) {
      badges.push({
        key: 'search',
        label: uiText.search,
        value: debouncedSearchQuery,
        onClear: () => {
          setMainSearchQuery('');
          setDebouncedSearchQuery('');
        },
      });
    }

    if (genderFilter) {
      badges.push({
        key: 'gender',
        label: uiText.gender,
        value:
          genderFilter === 'Male'
            ? t('horses.male')
            : genderFilter === 'Female'
              ? t('horses.female')
              : genderFilter,
        onClear: () => setGenderFilter(''),
      });
    }

    if (strainFilter) {
      badges.push({
        key: 'strain',
        label: uiText.strain,
        value: findLineageLabel(strains, strainFilter, localeCode),
        onClear: () => setStrainFilter(''),
      });
    }

    if (lineFilter) {
      badges.push({
        key: 'line',
        label: uiText.line,
        value: findLineageLabel(specialLines, lineFilter, localeCode),
        onClear: () => setLineFilter(''),
      });
    }

    if (microshipFilter.trim()) {
      badges.push({
        key: 'microship',
        label: uiText.microship,
        value: microshipFilter.trim(),
        onClear: () => setMicroshipFilter(''),
      });
    }

    if (isActiveFilter) {
      badges.push({
        key: 'isActive',
        label: uiText.status,
        value:
          isActiveFilter === 'true'
            ? t('horses.activeHorses')
            : t('horses.inactiveHorses'),
        onClear: () => setIsActiveFilter(''),
      });
    }

    return badges;
  }, [
    debouncedSearchQuery,
    genderFilter,
    isActiveFilter,
    lineFilter,
    localeCode,
    microshipFilter,
    specialLines,
    strainFilter,
    strains,
    t,
    uiText.gender,
    uiText.line,
    uiText.microship,
    uiText.search,
    uiText.status,
    uiText.strain,
  ]);

  const clearFilters = () => {
    setMainSearchQuery('');
    setDebouncedSearchQuery('');
    setGenderFilter('');
    setStrainFilter('');
    setLineFilter('');
    setMicroshipFilter('');
    setIsActiveFilter('');
  };

  const loadHorsesPage = useCallback(
    async (pageNumber: number, append = false) => {
      if (append && appendInFlightRef.current) return;

      const requestId = ++requestSeqRef.current;

      if (append) {
        appendInFlightRef.current = true;
        setLoadingMore(true);
      } else {
        appendInFlightRef.current = false;
        setLoading(true);
      }

      setError('');

      try {
        const payload = await clientApiFetch<PagedResponse<HorseListItemDto>>({
          backendPath: '/api/Horses',
          nextPath: '/api/horses',
          backendQuery: {
            pageNumber,
            pageSize: HORSES_PAGE_SIZE,
            search: filtersQuery.search,
            gender: filtersQuery.gender,
            strain: filtersQuery.strain,
            line: filtersQuery.line,
            microship: filtersQuery.microship,
            isActive: filtersQuery.isActive,
          },
          nextQuery: {
            pageNumber,
            pageSize: HORSES_PAGE_SIZE,
            search: filtersQuery.search,
            gender: filtersQuery.gender,
            strain: filtersQuery.strain,
            line: filtersQuery.line,
            microship: filtersQuery.microship,
            isActive: filtersQuery.isActive,
            locale,
          },
          locale: localeCode,
        });

        if (requestId !== requestSeqRef.current) return;

        setHorses((current) =>
          append ? [...current, ...(payload.data ?? [])] : payload.data ?? [],
        );

        setPageInfo({
          currentPage: payload.currentPage || pageNumber,
          totalPages: payload.totalPages || 0,
          totalCount: payload.totalCount || 0,
          hasNextPage: Boolean(payload.hasNextPage),
        });
      } catch (requestError) {
        if (requestId !== requestSeqRef.current) return;

        setError(
          requestError instanceof Error ? requestError.message : t('common.error'),
        );
      } finally {
        if (append) appendInFlightRef.current = false;

        if (requestId === requestSeqRef.current) {
          if (append) {
            setLoadingMore(false);
          } else {
            setLoading(false);
          }
        }
      }
    },
    [filtersQuery, locale, localeCode, t],
  );

  useEffect(() => {
    loadHorsesPage(1);
  }, [loadHorsesPage]);

  const loadNextPage = useCallback(() => {
    if (loading || loadingMore || !pageInfo.hasNextPage) return;

    loadHorsesPage(pageInfo.currentPage + 1, true);
  }, [
    loadHorsesPage,
    loading,
    loadingMore,
    pageInfo.currentPage,
    pageInfo.hasNextPage,
  ]);

  useEffect(() => {
    const node = loadMoreRef.current;

    if (!node || !pageInfo.hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadNextPage();
      },
      { rootMargin: '320px 0px' },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [loadNextPage, pageInfo.hasNextPage]);

  const cards = useMemo(
    () => horses.map((horse) => toHorseCardModel(horse, localeCode)),
    [horses, localeCode],
  );

  const editingHorse = editingHorseId
    ? horses.find((horse) => (horse.localId ?? horse.id) === Number(editingHorseId)) ?? null
    : null;

  const formatFormDate = (value: string | null | undefined) => {
    if (!value) return '';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value;

    return date.toISOString().slice(0, 10);
  };

  const editInitialData: HorseFormData | null = editingHorse
    ? (() => {
        const profileImage =
          editingHorse.horseProfileImage ??
          mediaUrl(editingHorse.images?.[0]) ??
          undefined;

        return {
          nameAr: editingHorse.arabicName ?? '',
          nameEn: editingHorse.englishName ?? '',
          knownAs: editingHorse.knownAs ?? '',
          type: '',
          gender: editingHorse.gender ?? '',
          birthDate: formatFormDate(editingHorse.dateofBirth),
          color: editingHorse.color ?? '',
          image: profileImage,
          imagePreview: profileImage,
          existingImages: (editingHorse.images ?? [])
            .map((image, index) => {
              if (typeof image === 'string') {
                return { id: -(index + 1), url: image };
              }

              return image.url ? { id: image.id, url: image.url } : null;
            })
            .filter((image): image is { id: number; url: string } => Boolean(image)),
          newImages: [],
          removeImageIds: [],
        };
      })()
    : null;

  const handleImported = () => {
    setIsStudbookOpen(false);
    window.location.reload();
  };

  const handleDeleteHorse = async () => {
    if (!horseIdToDelete || isDeleting) return;

    setIsDeleting(true);
    setError('');

    try {
      await clientApiFetch({
        method: 'DELETE',
        backendPath: `/api/Horses/${horseIdToDelete}`,
        nextPath: `/api/horses/${horseIdToDelete}`,
        nextQuery: { locale },
        locale: localeCode,
      });

      const deletedId = Number(horseIdToDelete);

      setHorses((current) =>
        current.filter((horse) => (horse.localId ?? horse.id) !== deletedId),
      );

      setHorseIdToDelete(null);
    } catch (requestError) {
      const status =
        typeof requestError === 'object' && requestError && 'status' in requestError
          ? Number((requestError as { status?: number }).status)
          : undefined;

      if (status === 401) {
        router.replace(`/${locale}/login?session=expired`);
        router.refresh();
        return;
      }

      setError(
        requestError instanceof Error
          ? localizeApiMessage(requestError.message, localeCode)
          : t('common.error'),
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const toHorsePayload = (
    data: HorseFormData,
    mode: 'create' | 'update' = 'create',
  ): CreateHorsePayload => ({
    EnglishName: data.nameEn,
    ArabicName: data.nameAr,
    KnownAs: data.knownAs,
    DateofBirth: data.birthDate,
    Gender: data.gender,
    BornIn: data.birthCountry,
    CurrentlyIn: data.currentCountry,
    Color: data.color,
    Height: data.height,
    AdditionalInformation: data.description,
    FaceSpecialMarkings: data.faceMarks,
    FrontRightLeg: data.frontRightLeg,
    FrontLeftLeg: data.frontLeftLeg,
    BackRightLeg: data.backRightLeg,
    BackLeftLeg: data.backLeftLeg,
    SpecialNotes: data.notes,
    RegistrationNumber: data.registrationNumber,
    MicrochipID: data.microchipId,
    UELNNumber: data.uelnNumber,
    InternationalFEIRegistrationNumber: data.feiRegistrationNumber,
    NationalSportRegistrationNumber: data.nationalRegistrationNumber,
    PassportNumber: data.passportNumber,
    HorseProfileImage: data.image instanceof File ? data.image : null,
    ClearHorseProfileImage:
      mode === 'update' &&
      Boolean(editingHorse?.horseProfileImage) &&
      !data.image &&
      !data.imagePreview,
    RemoveImageIds:
      mode === 'update' ? data.removeImageIds?.filter((id) => id > 0) : undefined,
    NewImages: mode === 'update' ? data.newImages : undefined,
    Images: mode === 'create' ? data.newImages : undefined,
    Videos: mode === 'create' && data.videoLink ? [data.videoLink] : [],
    NewVideos: mode === 'update' && data.videoLink ? [data.videoLink] : [],
    HorseFatherStudbookId: data.fatherStudbookId,
    HorseMotherStudbookId: data.motherStudbookId,
    OwnerStudbookId: data.ownerStudbookId,
    BreederStudbookId: data.breederStudbookId,
    IsStallion: data.gender === 'Male',
    IsMare: data.gender === 'Female',
  });

  const handleManualCreate = async (data: HorseFormData) => {
    try {
      const result = await createHorse(toHorsePayload(data, 'create'));

      if (!result.succeeded) {
        throw new Error(localizeApiMessage(result.message, localeCode));
      }

      const createdHorseId = result.data;

      setIsAddModalOpen(false);

      if (createdHorseId) {
        router.push(`/${locale}/horses/${createdHorseId}`);
        return;
      }

      window.location.reload();
    } catch (requestError) {
      throw new Error(
        requestError instanceof Error
          ? localizeApiMessage(requestError.message, localeCode)
          : t('common.error'),
      );
    }
  };

  const handleLocalEdit = async (data: HorseFormData) => {
    if (!editingHorseId) return;

    try {
      const payload = buildChangedHorsePayload(data, editInitialData);

      if (Object.keys(payload).length === 0) {
        setEditingHorseId(null);
        return;
      }

      const result = await clientApiFetch<
        ApiResult<number> | ApiResult<null> | ApiResult<boolean>
      >({
        method: 'PUT',
        backendPath: `/api/Horses/${editingHorseId}`,
        nextPath: `/api/horses/${editingHorseId}`,
        nextQuery: { locale },
        locale: localeCode,
        body: buildCreateHorseFormData(payload, { includeEmptyStrings: true }),
      });

      if (result?.succeeded === false) {
        throw new Error(localizeApiMessage(result.message, localeCode));
      }

      const refreshed = await clientApiFetch<ApiResult<HorseInfoDto> | HorseInfoDto>({
        backendPath: `/api/Horses/${editingHorseId}`,
        nextPath: `/api/horses/${editingHorseId}`,
        nextQuery: { locale },
        locale: localeCode,
      });

      const refreshedHorse = unwrapApiResult(refreshed);

      setHorses((current) =>
        current.map((horse) => {
          if ((horse.localId ?? horse.id) !== Number(editingHorseId)) {
            return horse;
          }

          return {
            ...horse,
            ...refreshedHorse,
            id: horse.id,
            localId: refreshedHorse?.localId ?? horse.localId,
            englishName: refreshedHorse?.englishName ?? data.nameEn,
            arabicName: refreshedHorse?.arabicName ?? data.nameAr,
            dateofBirth: refreshedHorse?.dateofBirth ?? data.birthDate,
            gender: refreshedHorse?.gender ?? data.gender,
            color: refreshedHorse?.color ?? data.color ?? horse.color,
            horseProfileImage:
              refreshedHorse?.horseProfileImage ??
              (typeof data.imagePreview === 'string' && data.imagePreview
                ? data.imagePreview
                : typeof data.image === 'string'
                  ? data.image
                  : horse.horseProfileImage ??
                    mediaUrl(refreshedHorse?.images?.[0])),
          };
        }),
      );

      setEditingHorseId(null);
    } catch (requestError) {
      throw new Error(
        requestError instanceof Error
          ? localizeApiMessage(requestError.message, localeCode)
          : t('common.error'),
      );
    }
  };

  return (
    <MainLayout>
      <div className={`p-4 sm:p-6 ${isRTL ? 'text-right' : 'text-left'}`}>
        <div className="flex flex-col gap-4 rounded-[18px] border border-[#eee3da] bg-white/90 p-4 shadow-[0_12px_30px_rgba(49,28,17,0.06)] sm:rounded-[24px] sm:p-5">
          <div
            className={`flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between `}
          >
            <h1 className="shrink-0 text-lg font-semibold text-text-dark sm:text-2xl">
              {t('horses.title')}
            </h1>

            {hasActiveFilters ? (
              <div
                className={`flex w-fit items-center gap-2 rounded-full border border-[#d9c8bd] bg-[#fbf8f4] px-3 py-1.5 text-xs font-bold text-[#3b2314] ${
                  isRTL ? 'flex-row-reverse' : ''
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    loading ? 'animate-pulse bg-amber-500' : 'bg-emerald-500'
                  }`}
                />
                <span>{loading ? uiText.applyingSearch : uiText.searchApplied}</span>
                <span className="rounded-full bg-white px-2 py-0.5 text-[#6a5548]">
                  {uiText.results}
                </span>
              </div>
            ) : null}
          </div>

          <div className="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-12">
            <div className="relative min-w-0 sm:col-span-2 lg:col-span-2 xl:col-span-4">
              <input
                type="search"
                value={mainSearchQuery}
                onChange={(event) => setMainSearchQuery(event.target.value)}
                placeholder={t('common.search')}
                className={`h-14 w-full rounded-2xl border border-[#eadfd7] bg-[#fffdfb] text-sm text-[#2c2330] outline-none transition placeholder:text-[#b9ada4] focus:border-[#5a3b25] focus:bg-white focus:ring-2 focus:ring-[#5a3b25]/10 ${
                  isRTL ? 'pr-11 text-right' : 'pl-11 text-left'
                }`}
              />
              <span
                className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 text-[#6a5548] ${
                  isRTL ? 'right-4' : 'left-4'
                }`}
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 10.5a7.5 7.5 0 0012.15 6.15z"
                  />
                </svg>
              </span>
            </div>

            <select
              value={genderFilter}
              onChange={(event) => setGenderFilter(event.target.value)}
              aria-label={t('horses.gender')}
              className={`h-14 w-full rounded-2xl border border-[#eadfd7] bg-[#fffdfb] px-4 text-sm font-medium text-[#2c2330] outline-none transition focus:border-[#5a3b25] focus:bg-white focus:ring-2 focus:ring-[#5a3b25]/10 xl:col-span-2 ${
                isRTL ? 'text-right' : 'text-left'
              }`}
            >
              <option value="">{t('common.all')}</option>
              <option value="Male">{t('horses.male')}</option>
              <option value="Female">{t('horses.female')}</option>
            </select>

            <div className="xl:col-span-3">
              <LineageFilterPicker
                value={strainFilter}
                options={strains}
                placeholder={t('horses.strainFilter')}
                searchPlaceholder={t('horses.searchStrains')}
                emptyText={t('horses.noStrainsFound')}
                loading={lineagesLoading}
                onChange={(value) => setStrainFilter(String(value))}
              />
            </div>

            <div className="xl:col-span-3">
              <LineageFilterPicker
                value={lineFilter}
                options={specialLines}
                placeholder={t('horses.specialLineFilter')}
                searchPlaceholder={t('horses.searchSpecialLines')}
                emptyText={t('horses.noSpecialLinesFound')}
                loading={lineagesLoading}
                onChange={(value) => setLineFilter(String(value))}
              />
            </div>

            <div className="relative min-w-0 sm:col-span-2 lg:col-span-2 xl:col-span-4">
              <input
                type="search"
                value={microshipFilter}
                onChange={(event) => setMicroshipFilter(event.target.value)}
                placeholder={t('horses.microshipFilter')}
                aria-label={t('horses.microshipFilterLabel')}
                className={`h-14 w-full rounded-2xl border border-[#eadfd7] bg-[#fffdfb] px-4 pt-4 text-sm font-semibold text-[#2c2330] outline-none transition placeholder:text-transparent focus:border-[#5a3b25] focus:bg-white focus:ring-2 focus:ring-[#5a3b25]/10 ${
                  isRTL ? 'text-right' : 'text-left'
                }`}
              />
              <span className={`pointer-events-none absolute top-2 text-[11px] font-semibold text-[#927b6c] ${isRTL ? 'right-4' : 'left-4'}`}>
                {t('horses.microshipFilter')}
              </span>
            </div>

            <select
              value={isActiveFilter}
              onChange={(event) =>
                setIsActiveFilter(event.target.value as '' | 'true' | 'false')
              }
              aria-label={t('horses.statusFilterLabel')}
              className={`h-14 w-full rounded-2xl border border-[#eadfd7] bg-[#fffdfb] px-4 text-sm font-medium text-[#2c2330] outline-none transition focus:border-[#5a3b25] focus:bg-white focus:ring-2 focus:ring-[#5a3b25]/10 xl:col-span-3 ${
                isRTL ? 'text-right' : 'text-left'
              }`}
            >
              <option value="">{t('horses.allStatuses')}</option>
              <option value="true">{t('horses.activeHorses')}</option>
              <option value="false">{t('horses.inactiveHorses')}</option>
            </select>

            <button
              type="button"
              onClick={() => setIsStudbookOpen(true)}
              className="flex h-14 w-full shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-2xl bg-[#311C11] px-5 text-sm font-semibold text-primary-light shadow-[0_10px_22px_rgba(49,28,17,0.18)] transition hover:bg-[#442819] sm:col-span-2 lg:col-span-1 xl:col-span-2"
            >
              + {t('horses.addNew')}
            </button>
          </div>

          {hasActiveFilters ? (
            <div
              className={`flex flex-wrap items-center gap-2 ${
                isRTL ? 'justify-end' : 'justify-start'
              }`}
            >
              {activeFilterBadges.map((badge) => (
                <span
                  key={badge.key}
                  className={`inline-flex max-w-full items-center gap-1.5 rounded-full border border-[#eadfd7] bg-[#fffdfb] px-3 py-1.5 text-xs font-semibold text-[#3b2314] ${
                    isRTL ? 'flex-row-reverse' : ''
                  }`}
                >
                  <span className="text-[#8b776a]">{badge.label}:</span>
                  <span className="max-w-[160px] truncate">{badge.value}</span>
                  <button
                    type="button"
                    onClick={badge.onClear}
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#f3ebe5] text-[#6a5548] transition hover:bg-[#eadfd7]"
                    aria-label={`${isRTL ? 'مسح' : 'Clear'} ${badge.label}`}
                  >
                    ×
                  </button>
                </span>
              ))}

              <button
                type="button"
                onClick={clearFilters}
                className="rounded-full border border-[#eadfd7] bg-white px-3 py-1.5 text-xs font-bold text-[#6a5548] transition hover:bg-[#fbf8f4] hover:text-[#3b2314]"
              >
                {uiText.clearAll}
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="mx-4 rounded-2xl border border-[#f2c7c7] bg-[#fff3f3] px-4 py-3 text-sm text-[#b04444] sm:mx-6">
          {error}
        </div>
      ) : null}

      <div className="p-4 sm:p-6">
        {loading && !horses.length ? (
          <div className="rounded-2xl bg-white p-10 text-center text-sm text-[#7a6c63]">
            {t('common.loading')}
          </div>
        ) : cards.length ? (
          <>
            <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3">
              {cards.map((horse) => (
                <HorseCard
                  key={horse.id}
                  horse={horse}
                  onEdit={setEditingHorseId}
                  onDelete={setHorseIdToDelete}
                />
              ))}
            </div>

            <div ref={loadMoreRef} className="h-8" aria-hidden="true" />

            {loadingMore ? (
              <div className="rounded-2xl bg-white p-4 text-center text-sm text-[#7a6c63]">
                {t('common.loading')}
              </div>
            ) : null}
          </>
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
        onSubmit={handleManualCreate}
      />

      <HorseFormModal
        isOpen={Boolean(editingHorseId)}
        isManual
        initialData={editInitialData}
        onClose={() => setEditingHorseId(null)}
        onSubmit={handleLocalEdit}
      />

      <DeleteConfirmModal
        open={Boolean(horseIdToDelete)}
        title={t('common.deleteRecord')}
        description={isDeleting ? t('common.loading') : t('common.deleteRecordMsg')}
        onCancel={() => {
          if (!isDeleting) setHorseIdToDelete(null);
        }}
        onConfirm={handleDeleteHorse}
      />
    </MainLayout>
  );
}
