'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { HorseCard } from '@/components/horses/HorseCard';
import { HorseFormModal, type HorseFormData } from '@/components/horses/HorseFormModal';
import { StudbookImportModal } from '@/components/horses/StudbookImportModal';
import DeleteConfirmModal from '@/components/common/DeleteConfirmModal';
import { mediaUrl, toHorseCardModel } from '@/lib/api/horse-formatters';
import { clientApiFetch } from '@/lib/api/client';
import { buildCreateHorseFormData } from '@/lib/api/create-horse-form-data';
import { createHorse } from '@/lib/api/create-horse';
import { localizeApiMessage } from '@/lib/api/errors';
import { isDirectApiMode } from '@/lib/api/transport';
import type { CreateHorsePayload } from '@/lib/api/types';
import type { ApiResult, HorseInfoDto, HorseListItemDto, LocaleCode, PagedResponse, StudbookHorseDto } from '@/lib/api/types';
import { useLocale, useTranslation } from '@/lib/locale-context';

interface HorsesPageClientProps {
  initialHorses: PagedResponse<HorseListItemDto>;
  initialStudbook: PagedResponse<StudbookHorseDto>;
  initialError?: string;
}

const HORSES_PAGE_SIZE = 24;

function unwrapApiResult<T>(payload: T | ApiResult<T>): T | undefined {
  if (payload && typeof payload === 'object' && 'statusCode' in payload) {
    return (payload as ApiResult<T>).data;
  }

  return payload as T;
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
  const [isStudbookOpen, setIsStudbookOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingHorseId, setEditingHorseId] = useState<string | null>(null);
  const [mainSearchQuery, setMainSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [horses, setHorses] = useState(initialHorses.data);
  const [error, setError] = useState(initialError);
  const [loading, setLoading] = useState(isDirectApiMode && !initialHorses.data.length);
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

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchQuery(mainSearchQuery.trim());
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [mainSearchQuery]);

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

  const loadHorsesPage = useCallback(
    async (pageNumber: number, append = false) => {
      if (append && appendInFlightRef.current) return;

      const requestId = ++requestSeqRef.current;
      const search = debouncedSearchQuery || undefined;
      const gender = genderFilter || undefined;

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
          backendQuery: { pageNumber, pageSize: HORSES_PAGE_SIZE, search, gender },
          nextQuery: { pageNumber, pageSize: HORSES_PAGE_SIZE, search, gender, locale },
          locale: locale as LocaleCode,
        });

        if (requestId !== requestSeqRef.current) return;

        setHorses((current) => (append ? [...current, ...(payload.data ?? [])] : payload.data ?? []));
        setPageInfo({
          currentPage: payload.currentPage || pageNumber,
          totalPages: payload.totalPages || 0,
          totalCount: payload.totalCount || 0,
          hasNextPage: Boolean(payload.hasNextPage),
        });
      } catch (requestError) {
        if (requestId !== requestSeqRef.current) return;
        setError(requestError instanceof Error ? requestError.message : t('common.error'));
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
    [debouncedSearchQuery, genderFilter, locale, t],
  );

  useEffect(() => {
    loadHorsesPage(1);
  }, [loadHorsesPage]);

  const loadNextPage = useCallback(() => {
    if (loading || loadingMore || !pageInfo.hasNextPage) return;
    loadHorsesPage(pageInfo.currentPage + 1, true);
  }, [loadHorsesPage, loading, loadingMore, pageInfo.currentPage, pageInfo.hasNextPage]);

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
    () => horses.map((horse) => toHorseCardModel(horse, locale as LocaleCode)),
    [horses, locale],
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
        const profileImage = editingHorse.horseProfileImage ?? mediaUrl(editingHorse.images?.[0]) ?? undefined;

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
              if (typeof image === 'string') return { id: -(index + 1), url: image };
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
        locale: locale as LocaleCode,
      });

      const deletedId = Number(horseIdToDelete);
      setHorses((current) => current.filter((horse) => (horse.localId ?? horse.id) !== deletedId));
      setHorseIdToDelete(null);
    } catch (requestError) {
      const status = typeof requestError === 'object' && requestError && 'status' in requestError
        ? Number((requestError as { status?: number }).status)
        : undefined;

      if (status === 401) {
        router.replace(`/${locale}/login?session=expired`);
        router.refresh();
        return;
      }

      setError(
        requestError instanceof Error
          ? localizeApiMessage(requestError.message, locale as LocaleCode)
          : t('common.error'),
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const toHorsePayload = (data: HorseFormData, mode: 'create' | 'update' = 'create'): CreateHorsePayload => ({
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
      mode === 'update' && Boolean(editingHorse?.horseProfileImage) && !data.image && !data.imagePreview,
    RemoveImageIds: mode === 'update' ? data.removeImageIds?.filter((id) => id > 0) : undefined,
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
        throw new Error(localizeApiMessage(result.message, locale as LocaleCode));
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
          ? localizeApiMessage(requestError.message, locale as LocaleCode)
          : t('common.error'),
      );
    }
  };

  const handleLocalEdit = async (data: HorseFormData) => {
    if (!editingHorseId) return;

    try {
      const result = await clientApiFetch<ApiResult<number> | ApiResult<null> | ApiResult<boolean>>({
        method: 'PUT',
        backendPath: `/api/Horses/${editingHorseId}`,
        nextPath: `/api/horses/${editingHorseId}`,
        nextQuery: { locale },
        locale: locale as LocaleCode,
        body: buildCreateHorseFormData(toHorsePayload(data, 'update')),
      });

      if (result?.succeeded === false) {
        throw new Error(localizeApiMessage(result.message, locale as LocaleCode));
      }

      const refreshed = await clientApiFetch<ApiResult<HorseInfoDto> | HorseInfoDto>({
        backendPath: `/api/Horses/${editingHorseId}`,
        nextPath: `/api/horses/${editingHorseId}`,
        nextQuery: { locale },
        locale: locale as LocaleCode,
      });
      const refreshedHorse = unwrapApiResult(refreshed);

      setHorses((current) =>
        current.map((horse) => {
          if ((horse.localId ?? horse.id) !== Number(editingHorseId)) return horse;

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
                  : horse.horseProfileImage ?? mediaUrl(refreshedHorse?.images?.[0])),
          };
        }),
      );
      setEditingHorseId(null);
    } catch (requestError) {
      throw new Error(
        requestError instanceof Error
          ? localizeApiMessage(requestError.message, locale as LocaleCode)
          : t('common.error'),
      );
    }
  };

  return (
    <MainLayout>
      <div className={`p-4 sm:p-6 ${isRTL ? 'text-right' : 'text-left'}`}>
        <div className="flex flex-col gap-4 rounded-[18px] border border-[#eee3da] bg-white/90 p-4 shadow-[0_12px_30px_rgba(49,28,17,0.06)] sm:rounded-[24px] sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <h1 className="shrink-0 text-lg font-semibold text-text-dark sm:text-2xl">{t('horses.title')}</h1>

          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:max-w-[46rem]">
            <div className="relative min-w-0 flex-1">
              <input
                type="search"
                value={mainSearchQuery}
                onChange={(event) => setMainSearchQuery(event.target.value)}
                placeholder={t('common.search')}
                className={`h-11 w-full rounded-2xl border border-[#eadfd7] bg-[#fffdfb] text-sm text-[#2c2330] outline-none transition placeholder:text-[#b9ada4] focus:border-[#5a3b25] focus:bg-white focus:ring-2 focus:ring-[#5a3b25]/10 ${
                  isRTL ? 'pr-11 text-right' : 'pl-11 text-left'
                }`}
              />
              <span className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 text-[#6a5548] ${isRTL ? 'right-4' : 'left-4'}`}>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 10.5a7.5 7.5 0 0012.15 6.15z" />
                </svg>
              </span>
            </div>

            <select
              value={genderFilter}
              onChange={(event) => setGenderFilter(event.target.value)}
              aria-label={t('horses.gender')}
              className={`h-11 w-full rounded-2xl border border-[#eadfd7] bg-[#fffdfb] px-4 text-sm font-medium text-[#2c2330] outline-none transition focus:border-[#5a3b25] focus:bg-white focus:ring-2 focus:ring-[#5a3b25]/10 sm:w-40 ${
                isRTL ? 'text-right' : 'text-left'
              }`}
            >
              <option value="">{t('common.all')}</option>
              <option value="Male">{t('horses.male')}</option>
              <option value="Female">{t('horses.female')}</option>
            </select>

            <button
              onClick={() => setIsStudbookOpen(true)}
              className="flex h-11 w-full shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-2xl bg-[#311C11] px-5 text-sm font-semibold text-primary-light shadow-[0_10px_22px_rgba(49,28,17,0.18)] transition hover:bg-[#442819] sm:w-auto"
            >
              + {t('horses.addNew')}
            </button>
          </div>
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
