'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import {
  HorseAnalyticsTab,
  HorseCompetitionTab,
  HorseInfoTab,
  HorsePedigreeStats,
  HorsePedigreeTree,
  HorsePhotosTab,
  HorseProfileHeader,
  HorseProfileTabs,
  HorseVideosTab,
  HorseProfileSkeleton,
  HorseFormModal,
  HorseRatingModal,
  AssignBoxModal,
} from '@/components/horses';
import type { HorseFormData } from '@/components/horses/HorseFormModal';
import { RelatedHorsesTable } from '@/components/horses/profile/RelatedHorsesTable';
import { clientApiFetch } from '@/lib/api/client';
import { buildCreateHorseFormData } from '@/lib/api/create-horse-form-data';
import { buildChangedHorsePayload } from '@/lib/api/horse-update-payload';
import {
  getExternalHorseDashboard,
  getHorseFamilyAnalysisTree,
  getHorseOffsprings,
  getHorsePedigree,
  getHorseSiblings,
  normalizePagedList,
} from '@/lib/api/external-horses';
import { mediaUrl, mediaUrls, toProfileHorseModel } from '@/lib/api/horse-formatters';
import { getLocalizedName } from '@/lib/api/localization';
import { isDirectApiMode } from '@/lib/api/transport';
import type {
  ApiResult,
  HorseFamilyTreeItem,
  HorseInfoDto,
  HorsePedigreeNode,
  HorseListItemDto,
  HorseRatingPayload,
  HorseRatingResponse,
  ExternalHorseDashboardInformation,
  HorseSiblingsDto,
  LocaleCode,
  PagedResponse,
  RelatedHorseDto,
} from '@/lib/api/types';
import { useLocale, useTranslation } from '@/lib/locale-context';

interface HorseProfilePageClientProps {
  horseId?: string;
  horse: HorseInfoDto | null;
  offsprings: PagedResponse<RelatedHorseDto> | null;
  siblings: HorseSiblingsDto | null;
  error?: string;
}

function unwrapResult<T>(payload: T | ApiResult<T>): T {
  if (payload && typeof payload === 'object' && 'data' in payload && 'statusCode' in payload) {
    return (payload as ApiResult<T>).data as T;
  }

  return payload as T;
}

function toHorseInfoFallback(horse: HorseListItemDto): HorseInfoDto {
  return {
    ...horse,
    studbookId: null,
    bornIn: null,
    currentlyIn: null,
    height: null,
    additionalInformation: null,
    type: null,
    faceSpecialMarkings: null,
    frontRightLeg: null,
    frontLeftLeg: null,
    backRightLeg: null,
    backLeftLeg: null,
    specialNotes: null,
    registrationNumber: null,
    microchipID: null,
    uelnNumber: null,
    internationalFEIRegistrationNumber: null,
    nationalSportRegistrationNumber: null,
    passportNumber: null,
    images: [],
    videos: [],
    isStallion: false,
    isMare: false,
    isStrain: false,
    isSpecial: false,
    box: null,
    isSold: horse.isSold ?? false,
    owner: null,
    breeder: null,
  };
}

function normalizePedigreeLevels(payload: unknown): HorsePedigreeNode[][] {
  if (Array.isArray(payload)) {
    return payload.filter(Array.isArray) as HorsePedigreeNode[][];
  }

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;

    if (Array.isArray(record.ancestors)) {
      const ancestors = record.ancestors.filter(Array.isArray) as HorsePedigreeNode[][];
      return record.root ? [[record.root as HorsePedigreeNode], ...ancestors] : ancestors;
    }

    if (Array.isArray(record.data)) return normalizePedigreeLevels(record.data);
    if (Array.isArray(record.levels)) return normalizePedigreeLevels(record.levels);
  }

  return [];
}

function directParentsFromPedigree(payload: unknown, isRTL: boolean) {
  const levels = normalizePedigreeLevels(payload);
  const root = levels[0]?.[0];
  const directParentLevel = levels.find((level) => level.length >= 2 && level !== levels[0]) ??
    (levels[0]?.length >= 2 ? levels[0] : []);

  const fatherFromRoot = root
    ? getLocalizedName(root.horseFatherEnglishName, root.horseFatherArabicName, isRTL)
    : '';
  const motherFromRoot = root
    ? getLocalizedName(root.horseMotherEnglishName, root.horseMotherArabicName, isRTL)
    : '';
  const fatherNode = directParentLevel[0];
  const motherNode = directParentLevel[1];

  return {
    fatherName: cleanParentName(fatherFromRoot)
      ? cleanParentName(fatherFromRoot)
      : fatherNode
        ? cleanParentName(getLocalizedName(fatherNode.englishName, fatherNode.arabicName, isRTL))
        : '',
    motherName: cleanParentName(motherFromRoot)
      ? cleanParentName(motherFromRoot)
      : motherNode
        ? cleanParentName(getLocalizedName(motherNode.englishName, motherNode.arabicName, isRTL))
        : '',
  };
}

function cleanParentName(value: string | null | undefined) {
  const next = typeof value === 'string' ? value.trim() : '';
  return next && next.toLowerCase() !== 'null' && next.toLowerCase() !== 'undefined' && next !== '-' ? next : '';
}

function directParentsFromFamilyTree(items: HorseFamilyTreeItem[], localId: number | null | undefined, isRTL: boolean) {
  const parentNameFor = (item: HorseFamilyTreeItem) => {
    const fatherName = cleanParentName(getLocalizedName(
      item.horseFatherEnglishName,
      item.horseFatherArabicName,
      isRTL,
    ));
    const motherName = cleanParentName(getLocalizedName(
      item.horseMotherEnglishName,
      item.horseMotherArabicName,
      isRTL,
    ));

    return { fatherName, motherName };
  };

  const currentHorse = items.find((item) => item.id === localId) ?? items[0];

  if (currentHorse) {
    const parents = parentNameFor(currentHorse);
    if (parents.fatherName || parents.motherName) return parents;
  }

  return { fatherName: '', motherName: '' };
}

export function HorseProfilePageClient({
  horseId,
  horse: initialHorse,
  offsprings: initialOffsprings,
  siblings: initialSiblings,
  error = '',
}: HorseProfilePageClientProps) {
  const { t } = useTranslation();
  const { locale, direction } = useLocale();
  const isRTL = direction === 'rtl';
  const [activeTab, setActiveTab] = useState('pedigree');
  const [horse, setHorse] = useState(initialHorse);
  const [offsprings, setOffsprings] = useState(initialOffsprings);
  const [siblings, setSiblings] = useState(initialSiblings);
  const [localError, setLocalError] = useState(error);
  const [loading, setLoading] = useState(isDirectApiMode && !initialHorse);
  const [relatedLoading, setRelatedLoading] = useState('');
  const [relatedError, setRelatedError] = useState('');
  const [dashboard, setDashboard] = useState<ExternalHorseDashboardInformation | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isRatingOpen, setIsRatingOpen] = useState(false);
  const [rating, setRating] = useState<HorseRatingResponse | null>(null);
  const [ratingSaving, setRatingSaving] = useState(false);
  const [ratingError, setRatingError] = useState('');
  const [soldLoading, setSoldLoading] = useState(false);
  const [isAssignBoxOpen, setIsAssignBoxOpen] = useState(false);
  const [boxAssignLoading, setBoxAssignLoading] = useState(false);
  const [pedigreeParents, setPedigreeParents] = useState({ fatherName: '', motherName: '' });

  const profileHorse = horse ? toProfileHorseModel(horse, locale as LocaleCode) : null;
  const hasVideos = mediaUrls(horse?.videos).length > 0;

  const formatFormDate = (value: string | null | undefined) => {
    if (!value) return '';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toISOString().slice(0, 10);
  };

  const formExistingImages = (horse?.images ?? [])
    .map((image, index) => {
      if (typeof image === 'string') return { id: -(index + 1), url: image };
      return image.url ? { id: image.id, url: image.url } : null;
    })
    .filter((image): image is { id: number; url: string } => Boolean(image));

  const editInitialData: HorseFormData | null = horse
    ? {
        nameAr: horse.arabicName ?? '',
        nameEn: horse.englishName ?? '',
        knownAs: horse.knownAs ?? '',
        type: horse.type ?? '',
        gender: horse.gender ?? '',
        birthDate: formatFormDate(horse.dateofBirth),
        description: horse.additionalInformation ?? '',
        color: horse.color ?? '',
        height: horse.height ?? '',
        currentCountry: horse.currentlyIn ?? '',
        birthCountry: horse.bornIn ?? '',
        ownerName: horse.owner?.studArabicName ?? horse.owner?.studName ?? '',
        ownerStudbookId: horse.owner?.id,
        breederName: horse.breeder?.studArabicName ?? horse.breeder?.studName ?? '',
        breederStudbookId: horse.breeder?.id,
        faceMarks: horse.faceSpecialMarkings ?? '',
        frontLeftLeg: horse.frontLeftLeg ?? '',
        frontRightLeg: horse.frontRightLeg ?? '',
        backLeftLeg: horse.backLeftLeg ?? '',
        backRightLeg: horse.backRightLeg ?? '',
        notes: horse.specialNotes ?? '',
        registrationNumber: horse.registrationNumber ?? '',
        microchipId: horse.microchipID ?? '',
        feiRegistrationNumber: horse.internationalFEIRegistrationNumber ?? '',
        nationalRegistrationNumber: horse.nationalSportRegistrationNumber ?? '',
        uelnNumber: horse.uelnNumber ?? '',
        passportNumber: horse.passportNumber ?? '',
        image: horse.horseProfileImage ?? mediaUrl(horse.images?.[0]) ?? undefined,
        imagePreview: horse.horseProfileImage ?? mediaUrl(horse.images?.[0]) ?? undefined,
        existingImages: formExistingImages,
        newImages: [],
        removeImageIds: [],
        videoLink: mediaUrl(horse.videos?.[0]) ?? '',
      }
    : null;

  const handleProfileEdit = async (data: HorseFormData) => {
    if (!horseId) return;

    const payload = buildChangedHorsePayload(data, editInitialData);

    if (Object.keys(payload).length === 0) {
      setIsEditOpen(false);
      return;
    }

    const result = await clientApiFetch<ApiResult<number> | ApiResult<null> | ApiResult<boolean>>({
      method: 'PUT',
      backendPath: `/api/Horses/${horseId}`,
      nextPath: `/api/horses/${horseId}`,
      nextQuery: { locale },
      locale: locale as LocaleCode,
      body: buildCreateHorseFormData(payload, { includeEmptyStrings: true }),
    });

    if (result?.succeeded === false) {
      throw new Error(result.message || t('common.error'));
    }

    const refreshed = await clientApiFetch<ApiResult<HorseInfoDto> | HorseInfoDto>({
      backendPath: `/api/Horses/${horseId}`,
      nextPath: `/api/horses/${horseId}`,
      nextQuery: { locale },
      locale: locale as LocaleCode,
    });

    setHorse(unwrapResult(refreshed));
    setIsEditOpen(false);
  };

  useEffect(() => {
    if (!horseId || !horse) return;
    let mounted = true;

    clientApiFetch<ApiResult<HorseRatingResponse>>({
      backendPath: `/api/Horses/${horseId}/rating`,
      nextPath: `/api/horses/${horseId}/rating`,
      nextQuery: { locale },
      locale: locale as LocaleCode,
    }).then((result) => {
      if (mounted) setRating(result.data ?? null);
    }).catch(() => {
      if (mounted) setRating(null);
    });

    return () => {
      mounted = false;
    };
  }, [horseId, horse?.id, locale]);

  const handleSoldChange = async (isSold: boolean) => {
    if (!horseId || soldLoading) return;
    setSoldLoading(true);
    setLocalError('');

    try {
      const result = await clientApiFetch<ApiResult<boolean>>({
        method: 'PATCH',
        backendPath: `/api/Horses/${horseId}/sold`,
        nextPath: `/api/horses/${horseId}/sold`,
        nextQuery: { locale },
        locale: locale as LocaleCode,
        body: { isSold },
      });

      if (result.succeeded === false) throw new Error(result.message || t('common.error'));

      setHorse((current) => current
        ? { ...current, isSold, soldAt: isSold ? new Date().toISOString() : null }
        : current);
    } catch (requestError) {
      setLocalError(requestError instanceof Error ? requestError.message : t('common.error'));
    } finally {
      setSoldLoading(false);
    }
  };

  const handleSaveRating = async (payload: HorseRatingPayload) => {
    if (!horseId) return;
    setRatingSaving(true);
    setRatingError('');

    try {
      const result = await clientApiFetch<ApiResult<HorseRatingResponse>>({
        method: 'PUT',
        backendPath: `/api/Horses/${horseId}/rating`,
        nextPath: `/api/horses/${horseId}/rating`,
        nextQuery: { locale },
        locale: locale as LocaleCode,
        body: payload,
      });

      if (result.succeeded === false || !result.data) {
        throw new Error(result.message || t('common.error'));
      }

      setRating(result.data);
      setIsRatingOpen(false);
    } catch (requestError) {
      setRatingError(requestError instanceof Error ? requestError.message : t('common.error'));
    } finally {
      setRatingSaving(false);
    }
  };

  const handleAssignBox = async (boxName: string) => {
    if (!horseId || boxAssignLoading) return;
    setBoxAssignLoading(true);

    try {
      const result = await clientApiFetch<ApiResult<never>>({
        method: 'POST',
        backendPath: `/api/Horses/${horseId}/assign-box`,
        nextPath: `/api/horses/${horseId}/assign-box`,
        backendQuery: { box: boxName },
        nextQuery: { locale, box: boxName },
        locale: locale as LocaleCode,
        body: {},
      });

      // Check for 409 Conflict first
      if (result.statusCode === 409) {
        const errorMessage = locale === 'ar' 
          ? 'هذه الحظيرة مأخوذة بالفعل' 
          : 'This box is already taken';
        throw new Error(errorMessage);
      }

      if (result.statusCode === 200 || result.succeeded === true) {
        setHorse((current) => (current ? { ...current, box: boxName } : current));
        setIsAssignBoxOpen(false);
      } else {
        throw new Error(result.message || t('common.error'));
      }
    } catch (requestError) {
      // Check if error has status 409 (from clientApiFetch)
      if (requestError instanceof Error && (requestError as any).status === 409) {
        const errorMessage = locale === 'ar' 
          ? 'هذه الحظيرة مأخوذة بالفعل' 
          : 'This box is already taken';
        throw new Error(errorMessage);
      }
      
      // Check if this is already our custom error message
      if (requestError instanceof Error && (
        requestError.message.includes('already taken') || 
        requestError.message.includes('مأخوذة بالفعل')
      )) {
        throw requestError;
      }
      
      const errorMessage = requestError instanceof Error ? requestError.message : t('common.error');
      throw new Error(errorMessage);
    } finally {
      setBoxAssignLoading(false);
    }
  };

  useEffect(() => {
    if (isDirectApiMode) return;
    if (!horse) return;

    const localId = horse.localId ?? horse.id;
    const now = new Date().toLocaleTimeString();

    window.dispatchEvent(
      new CustomEvent('api-debug-entry', {
        detail: {
          id: `horse-detail-${localId}-${Date.now()}`,
          label: 'Horse profile detail',
          method: 'GET',
          backendEndpoint: `https://studmanagerapi-dev.studmarket.net/api/Horses/${localId}`,
          nextEndpoint: `Server render: /${locale}/horses/${localId}`,
          nextService: 'app/[locale]/horses/[id]/page.tsx -> lib/api/horses-service.ts:getHorse',
          payload: { localId },
          status: localError ? undefined : 200,
          response: horse,
          error: localError || undefined,
          createdAt: now,
          replayable: false,
        },
      }),
    );

  }, [localError, horse, locale, offsprings, siblings]);

  useEffect(() => {
    if (!isDirectApiMode || !horseId) return;

    let mounted = true;

    async function loadHorseProfile() {
      setLoading(true);
      setLocalError('');

      try {
        let horseDetail: HorseInfoDto;

        try {
          const detailPayload = await clientApiFetch<ApiResult<HorseInfoDto> | HorseInfoDto>({
            backendPath: `/api/Horses/${horseId}`,
            nextPath: `/${locale}/horses/${horseId}`,
            locale: locale as LocaleCode,
          });
          horseDetail = unwrapResult(detailPayload);
        } catch (detailError) {
          const listPayload = await clientApiFetch<PagedResponse<HorseListItemDto>>({
            backendPath: '/api/Horses',
            nextPath: '/api/horses',
            backendQuery: { pageNumber: 1, pageSize: 100 },
            nextQuery: { pageNumber: 1, pageSize: 100, locale },
            locale: locale as LocaleCode,
          });
          const fallbackHorse = listPayload.data.find((item) => (item.localId ?? item.id) === Number(horseId));

          if (!fallbackHorse) throw detailError;
          horseDetail = toHorseInfoFallback(fallbackHorse);
        }

        if (!mounted) return;
        setHorse(horseDetail);

      } catch (requestError) {
        if (!mounted) return;
        setLocalError(requestError instanceof Error ? requestError.message : t('common.error'));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadHorseProfile();

    return () => {
      mounted = false;
    };
  }, [horseId, locale, t]);

  useEffect(() => {
    if (!horseId) return;

    let mounted = true;

    async function loadDashboard() {
      try {
        const result = await getExternalHorseDashboard(Number(horseId));
        if (mounted) setDashboard(result.data ?? null);
      } catch {
        if (mounted) setDashboard(null);
      }
    }

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, [horseId]);

  useEffect(() => {
    const localId = Number(profileHorse?.id);

    if (!Number.isFinite(localId) || localId <= 0) {
      setPedigreeParents({ fatherName: '', motherName: '' });
      return;
    }

    let mounted = true;

    async function loadFamilyTreeParents() {
      try {
        const familyResult = await getHorseFamilyAnalysisTree({
          localId,
          levels: 1,
          pageNumber: 1,
          pageSize: 20,
        });

        if (!mounted) return;

        const familyParents = directParentsFromFamilyTree(
          normalizePagedList(familyResult).items,
          localId,
          isRTL,
        );

        if (
          (familyParents.fatherName && familyParents.fatherName !== '-') ||
          (familyParents.motherName && familyParents.motherName !== '-')
        ) {
          setPedigreeParents(familyParents);
          return;
        }

        const pedigreeResult = await getHorsePedigree({ localId, levels: 2 });

        if (mounted) {
          setPedigreeParents(directParentsFromPedigree(pedigreeResult.data, isRTL));
        }
      } catch {
        if (mounted) setPedigreeParents({ fatherName: '', motherName: '' });
      }
    }

    loadFamilyTreeParents();

    return () => {
      mounted = false;
    };
  }, [profileHorse?.id, isRTL]);

  useEffect(() => {
    if (activeTab === 'videos' && !hasVideos) {
      setActiveTab('info');
    }
  }, [activeTab, hasVideos]);

  useEffect(() => {
    if (!horseId) return;
    if (activeTab !== 'children' || offsprings) return;

    let mounted = true;

    async function loadOffsprings() {
      setRelatedLoading('children');
      setRelatedError('');

      try {
        const result = await getHorseOffsprings({
          localId: Number(horseId),
          pageNumber: 1,
          pageSize: 20,
        });

        if (mounted) setOffsprings(result.data ?? null);
      } catch (requestError) {
        if (mounted) setRelatedError(requestError instanceof Error ? requestError.message : t('common.error'));
      } finally {
        if (mounted) setRelatedLoading('');
      }
    }

    loadOffsprings();

    return () => {
      mounted = false;
    };
  }, [activeTab, horseId, offsprings, t]);

  useEffect(() => {
    if (!horseId) return;
    if (activeTab !== 'siblings' || siblings) return;

    let mounted = true;

    async function loadSiblings() {
      setRelatedLoading('siblings');
      setRelatedError('');

      try {
        const result = await getHorseSiblings({
          localId: Number(horseId),
          pageNumber: 1,
          pageSize: 20,
        });

        if (mounted) setSiblings(result.data ?? null);
      } catch (requestError) {
        if (mounted) setRelatedError(requestError instanceof Error ? requestError.message : t('common.error'));
      } finally {
        if (mounted) setRelatedLoading('');
      }
    }

    loadSiblings();

    return () => {
      mounted = false;
    };
  }, [activeTab, horseId, siblings, t]);

  return (
    <MainLayout>
      <div className={`min-h-screen pb-12 ${isRTL ? 'text-right' : 'text-left'}`}>
        <div className="px-2 sm:px-0">
          <Link
            href={`/${locale}/horses`}
            className="mb-6 inline-flex items-center gap-2 text-amber-900 transition-colors hover:text-amber-800"
          >
            {isRTL ? (
              <>
                {t('common.back')}
                <ChevronRight className="h-5 w-5" />
              </>
            ) : (
              <>
                <ChevronLeft className="h-5 w-5" />
                {t('common.back')}
              </>
            )}
          </Link>
        </div>

        {loading ? (
          <HorseProfileSkeleton />
        ) : localError || !profileHorse ? (
          <div className="rounded-2xl border border-[#f2c7c7] bg-[#fff3f3] px-4 py-3 text-sm text-[#b04444]">
            {localError || t('common.error')}
          </div>
        ) : (
          <>
            <HorseProfileHeader
              horse={profileHorse}
              fatherName={pedigreeParents.fatherName}
              motherName={pedigreeParents.motherName}
              onEdit={() => setIsEditOpen(true)}
              isSold={horse?.isSold}
              soldLoading={soldLoading}
              onSoldChange={handleSoldChange}
              onRate={() => setIsRatingOpen(true)}
              averageRating={rating?.averageScore}
              ratingsCount={rating?.ratingsCount}
              box={horse?.box ?? null}
              onOpenAssignBox={() => setIsAssignBoxOpen(true)}
            />
            <HorsePedigreeStats
              loading={!dashboard}
              horse={{
                maleOffspring: dashboard?.foals?.male,
                femaleOffspring: dashboard?.foals?.female,
                maleResults: dashboard?.siblings?.male,
                femaleResults: dashboard?.siblings?.female,
              }}
            />
            <HorseProfileTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              hiddenTabs={hasVideos ? [] : ['videos']}
            />

            {activeTab === 'pedigree' && <HorsePedigreeTree horse={profileHorse} />}
            {activeTab === 'analytics' && <HorseAnalyticsTab localId={profileHorse.id} />}
            {activeTab === 'info' && <HorseInfoTab horse={profileHorse} />}
            {activeTab === 'photos' && <HorsePhotosTab horse={profileHorse} />}
            {activeTab === 'videos' && <HorseVideosTab horse={profileHorse} />}
            {activeTab === 'children' && (
              relatedLoading === 'children' ? (
                <div className="rounded-2xl bg-white px-4 py-10 text-center text-sm text-[#7a6c63]">{t('common.loading')}</div>
              ) : (
                <RelatedHorsesTable
                  title={isRTL ? 'الأبناء' : 'Children'}
                  rows={offsprings?.data ?? []}
                  error={relatedError}
                />
              )
            )}
            {activeTab === 'siblings' && (
              relatedLoading === 'siblings' ? (
                <div className="rounded-2xl bg-white px-4 py-10 text-center text-sm text-[#7a6c63]">{t('common.loading')}</div>
              ) : (
                <RelatedHorsesTable
                  title={isRTL ? 'الأشقاء' : 'Siblings'}
                  rows={siblings?.all?.data ?? []}
                  error={relatedError}
                />
              )
            )}
            {activeTab === 'competition' && <HorseCompetitionTab horse={profileHorse} />}

            <HorseFormModal
              isOpen={isEditOpen}
              isManual
              initialData={editInitialData}
              onClose={() => setIsEditOpen(false)}
              onSubmit={handleProfileEdit}
            />
            <HorseRatingModal
              open={isRatingOpen}
              horseName={locale === 'ar' ? profileHorse.nameAr : profileHorse.nameEn}
              rating={rating}
              saving={ratingSaving}
              error={ratingError}
              onClose={() => setIsRatingOpen(false)}
              onSave={handleSaveRating}
            />
            <AssignBoxModal
              open={isAssignBoxOpen}
              horseId={horseId}
              currentBox={horse?.box ?? null}
              onClose={() => setIsAssignBoxOpen(false)}
              onSubmit={handleAssignBox}
            />
          </>
        )}
      </div>
    </MainLayout>
  );
}
