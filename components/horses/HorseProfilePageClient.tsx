'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import {
  HorseAnalyticsTab,
  HorseCompetitionTab,
  HorseInfoTab,
  HorseFamilySearch,
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
  HorseSaleModal,
  HorseStatusModal,
  HorseTagsPanel,
} from '@/components/horses';
import type { HorseFormData } from '@/components/horses/HorseFormModal';
import { RelatedHorsesTable } from '@/components/horses/profile/RelatedHorsesTable';
import { clientApiFetch } from '@/lib/api/client';
import { buildCreateHorseFormData } from '@/lib/api/create-horse-form-data';
import { buildChangedHorsePayload } from '@/lib/api/horse-update-payload';
import {
  getExternalHorseDashboard,
  getHorseOffsprings,
  getHorseSiblings,
} from '@/lib/api/external-horses';
import { mediaUrl, mediaUrls, toProfileHorseModel } from '@/lib/api/horse-formatters';
import { getLocalizedName } from '@/lib/api/localization';
import { API_BASE_URL, isDirectApiMode } from '@/lib/api/transport';
import { AUTH_TOKEN_COOKIE } from '@/lib/auth';
import type {
  ApiResult,
  HorseInfoDto,
  HorsePedigreeTreeResponse,
  HorseDeceasedPayload,
  HorseListItemDto,
  HorseRatingPayload,
  HorseRatingResponse,
  HorseTagDto,
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
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as ApiResult<T>).data as T;
  }

  return payload as T;
}

function horseBoxOverrideKey(horseId: string) {
  return `studmanager-horse-box:${horseId}`;
}

function readHorseBoxOverride(horseId: string | undefined) {
  if (!horseId || typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(horseBoxOverrideKey(horseId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      box?: string | null;
      isTemporarilyAwayFromBox?: boolean;
      temporaryLeavingReason?: string | null;
      temporaryLeavingDate?: string | null;
      leftToStudbookId?: number | null;
      leftToStudEn?: string | null;
      leftToStudAr?: string | null;
    };

    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function writeHorseBoxOverride(
  horseId: string,
  value: {
    box?: string | null;
    isTemporarilyAwayFromBox?: boolean;
    temporaryLeavingReason?: string | null;
    temporaryLeavingDate?: string | null;
    leftToStudbookId?: number | null;
    leftToStudEn?: string | null;
    leftToStudAr?: string | null;
  },
) {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(horseBoxOverrideKey(horseId), JSON.stringify(value));
}

type AssignBoxResult = ApiResult<never> & {
  success?: boolean;
};

function getClientCookie(name: string) {
  if (typeof document === 'undefined') return undefined;

  return document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

async function postAssignBoxDirect({
  horseId,
  locale,
  boxName,
  mapKey,
  entityType,
  entityId,
  remove,
  temporaryLeave,
}: {
  horseId: string;
  locale: LocaleCode;
  boxName: string;
  mapKey: string;
  entityType?: string | null;
  entityId?: string | number | null;
  remove?: boolean;
  temporaryLeave?: {
    isTemporarilyAwayFromBox: boolean;
    temporaryLeavingReason?: string | null;
    temporaryLeavingDate?: string | null;
    leftToStudbookId?: number | null;
    leftToStudEn?: string | null;
    leftToStudAr?: string | null;
  };
}) {
  const url = new URL(`/api/Horses/${horseId}/assign-box`, API_BASE_URL);
  if (boxName) url.searchParams.set('box', boxName);
  if (mapKey) url.searchParams.set('mapKey', mapKey);
  if (entityType) url.searchParams.set('entityType', entityType);
  if (entityId !== undefined && entityId !== null && entityId !== '') {
    url.searchParams.set('entityId', String(entityId));
  }
  if (remove) url.searchParams.set('remove', 'true');

  const token =
    window.localStorage.getItem('studmanager-token') ??
    (getClientCookie(AUTH_TOKEN_COOKIE)
      ? decodeURIComponent(getClientCookie(AUTH_TOKEN_COOKIE) as string)
      : null);
  const headers = new Headers({ Accept: 'application/json', 'Accept-Language': locale });
  if (temporaryLeave) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers,
    body: temporaryLeave ? JSON.stringify(temporaryLeave) : undefined,
  });
  const result = (await response.json().catch(() => ({
    succeeded: false,
    success: false,
    message: response.statusText,
    statusCode: response.status,
  }))) as AssignBoxResult;

  if (!response.ok || result.success === false || result.succeeded === false) {
    throw Object.assign(new Error(result.message || response.statusText), {
      status: response.status || result.statusCode,
      payload: result,
    });
  }

  return result;
}

function isSuccessfulAssignBoxResult(result: AssignBoxResult) {
  return result.success === true ||
    result.succeeded === true ||
    result.statusCode === 200 ||
    result.statusCode === undefined;
}

function toHorseInfoFallback(horse: HorseListItemDto): HorseInfoDto {
  const raw = horse as HorseListItemDto & { studbookId?: number | null };

  return {
    ...horse,
    studbookId: raw.studbookId ?? null,
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
    isTemporarilyAwayFromBox: horse.isTemporarilyAwayFromBox ?? false,
    temporaryLeavingReason: horse.temporaryLeavingReason ?? null,
    tags: horse.tags ?? [],
  };
}

async function findHorseListFallback(horseId: string, locale: LocaleCode) {
  const id = Number(horseId);

  if (!Number.isFinite(id)) return null;

  const pageSize = 200;
  const maxPages = 50;

  for (let pageNumber = 1; pageNumber <= maxPages; pageNumber += 1) {
    const listPayload = await clientApiFetch<PagedResponse<HorseListItemDto>>({
      backendPath: '/api/Horses',
      nextPath: '/api/horses',
      backendQuery: { pageNumber, pageSize },
      nextQuery: { pageNumber, pageSize, locale },
      locale,
    });
    const fallbackHorse = listPayload.data.find((item) => (item.localId ?? item.id) === id);

    if (fallbackHorse) return toHorseInfoFallback(fallbackHorse);
    if (!listPayload.hasNextPage || !listPayload.data.length) break;
  }

  return null;
}

async function fetchHorseDetailWithFallback(horseId: string, locale: LocaleCode) {
  let detailError: unknown;

  try {
    const payload = await clientApiFetch<ApiResult<HorseInfoDto> | HorseInfoDto>({
      backendPath: `/api/Horses/${horseId}`,
      nextPath: `/api/horses/${horseId}`,
      nextQuery: { locale },
      locale,
    });
    const detail = unwrapResult(payload);
    if (detail) return detail;
  } catch (error) {
    detailError = error;
  }

  const fallback = await findHorseListFallback(horseId, locale);
  if (fallback) return fallback;

  throw detailError instanceof Error ? detailError : new Error('Horse not found.');
}

function cleanParentName(value: string | null | undefined) {
  const next = typeof value === 'string' ? value.trim() : '';
  return next && next.toLowerCase() !== 'null' && next.toLowerCase() !== 'undefined' && next !== '-' ? next : '';
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
  const router = useRouter();
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
  const [saleOpen, setSaleOpen] = useState(false);
  const [saleError, setSaleError] = useState('');
  const [statusOpen, setStatusOpen] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const [statusError, setStatusError] = useState('');
  const [isAssignBoxOpen, setIsAssignBoxOpen] = useState(false);
  const [boxAssignLoading, setBoxAssignLoading] = useState(false);
  const [pedigreeParents, setPedigreeParents] = useState({ fatherName: '', motherName: '' });

  useEffect(() => {
    const override = readHorseBoxOverride(horseId);
    if (!override) return;

    setHorse((current) => {
      if (!current) return current;

      const next = {
        box: Object.prototype.hasOwnProperty.call(override, 'box') ? override.box ?? null : current.box,
        isTemporarilyAwayFromBox:
          override.isTemporarilyAwayFromBox ?? current.isTemporarilyAwayFromBox,
        temporaryLeavingReason: Object.prototype.hasOwnProperty.call(override, 'temporaryLeavingReason')
          ? override.temporaryLeavingReason ?? null
          : current.temporaryLeavingReason,
        leftToStudEn: Object.prototype.hasOwnProperty.call(override, 'leftToStudEn')
          ? override.leftToStudEn ?? null
          : current.leftToStudEn,
        leftToStudAr: Object.prototype.hasOwnProperty.call(override, 'leftToStudAr')
          ? override.leftToStudAr ?? null
          : current.leftToStudAr,
      };

      return current.box !== next.box ||
        current.isTemporarilyAwayFromBox !== next.isTemporarilyAwayFromBox ||
        current.temporaryLeavingReason !== next.temporaryLeavingReason ||
        current.leftToStudEn !== next.leftToStudEn ||
        current.leftToStudAr !== next.leftToStudAr
        ? { ...current, ...next }
        : current;
    });
  }, [horseId, horse?.id]);

  const profileHorse = horse ? toProfileHorseModel(horse, locale as LocaleCode) : null;
  const profileLocalId = Number(horse?.localId ?? horse?.id ?? horseId ?? profileHorse?.id);
  const hasVideos = mediaUrls(horse?.videos).length > 0;
  const tagsHorseId = horseId ?? profileHorse?.id;
  const [tagsLoaded, setTagsLoaded] = useState(false);

  const handlePedigreeLoaded = useCallback((pedigree: HorsePedigreeTreeResponse) => {
    const root = pedigree.root;
    const father = pedigree.ancestors[0]?.[0];
    const mother = pedigree.ancestors[0]?.[1];
    const prefer = (current: string | null | undefined, fallback: string | null | undefined) =>
      current?.trim() ? current : fallback ?? current;

    setHorse((current) => current ? {
      ...current,
      studbookId: current.studbookId ?? root.id,
      englishName: prefer(current.englishName, root.englishName) ?? current.englishName,
      arabicName: prefer(current.arabicName, root.arabicName) ?? current.arabicName,
      gender: prefer(current.gender, root.gender) ?? current.gender,
      dateofBirth: prefer(current.dateofBirth, root.dateofBirth) ?? current.dateofBirth,
      microchipID: prefer(current.microchipID, root.microchipID) ?? current.microchipID,
      strainEn: prefer(current.strainEn, root.strainEn) ?? null,
      strainAr: prefer(current.strainAr, root.strainAr) ?? null,
      specialEn: prefer(current.specialEn, root.lineEn) ?? null,
      specialAr: prefer(current.specialAr, root.lineAr) ?? null,
      lineEn: prefer(current.lineEn, root.lineEn),
      lineAr: prefer(current.lineAr, root.lineAr),
      breederEn: prefer(current.breederEn, root.breederEn),
      breederAr: prefer(current.breederAr, root.breederAr),
      ownerEn: prefer(current.ownerEn, root.ownerEn),
      ownerAr: prefer(current.ownerAr, root.ownerAr),
      horseFatherEnglishName: prefer(current.horseFatherEnglishName, father?.englishName) ?? null,
      horseFatherArabicName: prefer(current.horseFatherArabicName, father?.arabicName) ?? null,
      horseMotherEnglishName: prefer(current.horseMotherEnglishName, mother?.englishName) ?? null,
      horseMotherArabicName: prefer(current.horseMotherArabicName, mother?.arabicName) ?? null,
      tags: current.tags?.length ? current.tags : root.tags ?? current.tags,
    } : current);

    setPedigreeParents({
      fatherName: cleanParentName(getLocalizedName(
        father?.englishName,
        father?.arabicName,
        isRTL,
      )),
      motherName: cleanParentName(getLocalizedName(
        mother?.englishName,
        mother?.arabicName,
        isRTL,
      )),
    });
  }, [isRTL]);

  // Tags are loaded from the dedicated tags endpoint (not the horse-by-id
  // payload) so they can be re-fetched whenever a tag changes anywhere. The
  // panel stays hidden until this first fetch completes.
  const refreshTags = async () => {
    if (!tagsHorseId) return;

    try {
      const result = await clientApiFetch<ApiResult<HorseTagDto[]>>({
        backendPath: `/api/Horses/${tagsHorseId}/tags`,
        nextPath: `/api/horses/${tagsHorseId}/tags`,
        nextQuery: { locale },
        locale: locale as LocaleCode,
      });

      if (result.succeeded !== false) {
        const tags = result.data ?? [];
        setHorse((current) => (current ? { ...current, tags } : current));
      }
    } catch {
      // Keep whatever tags are already displayed if the refresh fails.
    } finally {
      setTagsLoaded(true);
    }
  };

  useEffect(() => {
    setTagsLoaded(false);
    refreshTags();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tagsHorseId, locale]);

  const handleTabChange = (tabId: string) => {
    if (tabId === 'injuries') {
      const id = horseId ?? (profileHorse ? String(profileHorse.id) : '');
      if (!id) return;
      const name = (locale === 'ar' ? profileHorse?.nameAr : profileHorse?.nameEn) ?? '';
      const query = new URLSearchParams({ horseId: String(id) });
      if (name) query.set('horseName', name);
      router.push(`/${locale}/health/injuries?${query.toString()}`);
      return;
    }
    setActiveTab(tabId);
  };

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
        ownerMode: !horse.owner && (horse.ownerEn || horse.ownerAr) ? 'text' : 'stud',
        breederMode: !horse.breeder && (horse.breederEn || horse.breederAr) ? 'text' : 'stud',
        ownerEn: horse.ownerEn ?? '',
        ownerAr: horse.ownerAr ?? '',
        breederEn: horse.breederEn ?? '',
        breederAr: horse.breederAr ?? '',
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

    const refreshed = await fetchHorseDetailWithFallback(horseId, locale as LocaleCode);

    setHorse(refreshed);
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

  const handleSoldChange = async (payload: { isSold: boolean; soldTo?: string | null; soldPrice?: string | null }) => {
    if (!horseId || soldLoading) return;
    setSoldLoading(true);
    setSaleError('');

    try {
      const result = await clientApiFetch<ApiResult<boolean>>({
        method: 'PATCH',
        backendPath: `/api/Horses/${horseId}/sold`,
        nextPath: `/api/horses/${horseId}/sold`,
        nextQuery: { locale },
        locale: locale as LocaleCode,
        body: payload,
      });

      if (result.succeeded === false) throw new Error(result.message || t('common.error'));

      setHorse((current) => current
        ? { ...current, isSold: payload.isSold, soldAt: payload.isSold ? current.soldAt || new Date().toISOString() : null, soldTo: payload.isSold ? payload.soldTo?.trim() || null : null, soldPrice: payload.isSold ? payload.soldPrice?.trim() || null : null }
        : current);
      if (!payload.isSold) setSaleOpen(false);
    } catch (requestError) {
      setSaleError(requestError instanceof Error ? requestError.message : t('common.error'));
    } finally {
      setSoldLoading(false);
    }
  };

  const handleStatusChange = async (payload: HorseDeceasedPayload) => {
    if (!horseId || statusSaving) return;
    setStatusSaving(true);
    setStatusError('');

    try {
      const result = await clientApiFetch<ApiResult<boolean>>({
        method: 'POST',
        backendPath: `/api/Horses/${horseId}/deceased`,
        nextPath: `/api/horses/${horseId}/deceased`,
        nextQuery: { locale },
        locale: locale as LocaleCode,
        body: payload,
      });

      if (result.succeeded === false) throw new Error(result.message || t('common.error'));

      setHorse((current) => current ? {
        ...current,
        isActive: !payload.isDeceased,
        deceasedAt: payload.isDeceased ? payload.deceasedAt ?? new Date().toISOString() : null,
        deceasedReason: payload.isDeceased ? payload.deceasedReason ?? null : null,
      } : current);
      setStatusOpen(false);
    } catch (requestError) {
      setStatusError(requestError instanceof Error ? requestError.message : t('common.error'));
    } finally {
      setStatusSaving(false);
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

  const handleAssignBox = async (
    boxName: string,
    mapKey = 'mousa',
    temporaryLeave?: {
      isTemporarilyAwayFromBox: boolean;
      temporaryLeavingReason?: string | null;
      temporaryLeavingDate?: string | null;
      leftToStudbookId?: number | null;
      leftToStudEn?: string | null;
      leftToStudAr?: string | null;
    },
    options?: { remove?: boolean; entityType?: string | null; entityId?: string | number | null },
  ) => {
    if (!horseId || boxAssignLoading) return;
    setBoxAssignLoading(true);
    const nextHousing = {
      box: options?.remove ? null : boxName || horse?.box || null,
      isTemporarilyAwayFromBox: options?.remove ? false : temporaryLeave ? temporaryLeave.isTemporarilyAwayFromBox : false,
      temporaryLeavingReason: temporaryLeave?.isTemporarilyAwayFromBox
        ? temporaryLeave.temporaryLeavingReason?.trim() || null
        : null,
      leftToStudEn: temporaryLeave?.isTemporarilyAwayFromBox
        ? temporaryLeave.leftToStudEn?.trim() || null
        : null,
      leftToStudAr: temporaryLeave?.isTemporarilyAwayFromBox
        ? temporaryLeave.leftToStudAr?.trim() || null
        : null,
    };

    try {
      const result = await postAssignBoxDirect({
        horseId,
        locale: locale as LocaleCode,
        boxName,
        mapKey,
        entityType: options?.entityType,
        entityId: options?.entityId,
        remove: options?.remove,
        temporaryLeave,
      });

      if (result.statusCode === 409) {
        const errorMessage = locale === 'ar' 
          ? 'هذا المكان مأخوذ بالفعل'
          : 'This slot is already taken';
        throw new Error(errorMessage);
      }

      if (isSuccessfulAssignBoxResult(result)) {
        setHorse((current) =>
          current
            ? {
                ...current,
                ...nextHousing,
              }
            : current,
        );
        writeHorseBoxOverride(horseId, nextHousing);
        setIsAssignBoxOpen(false);
      } else {
        throw new Error(result.message || t('common.error'));
      }
    } catch (requestError) {
      if (requestError instanceof Error && (requestError as any).status === 409) {
        const errorMessage = locale === 'ar' 
          ? 'هذا المكان مأخوذ بالفعل'
          : 'This slot is already taken';
        throw new Error(errorMessage);
      }
      
      // Check if this is already our custom error message
      if (requestError instanceof Error && (
        requestError.message.includes('already taken') || 
        requestError.message.includes('مأخوذة بالفعل')
      )) {
        throw requestError;
      }

      throw requestError instanceof Error ? requestError : new Error(t('common.error'));
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
    const currentHorseId = horseId;

    async function loadHorseProfile() {
      setLoading(true);
      setLocalError('');

      try {
        const horseDetail = await fetchHorseDetailWithFallback(currentHorseId, locale as LocaleCode);

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
    const profileParents = {
      fatherName: cleanParentName(getLocalizedName(
        horse?.horseFatherEnglishName,
        horse?.horseFatherArabicName,
        isRTL,
      )),
      motherName: cleanParentName(getLocalizedName(
        horse?.horseMotherEnglishName,
        horse?.horseMotherArabicName,
        isRTL,
      )),
    };

    if (profileParents.fatherName || profileParents.motherName) {
      setPedigreeParents(profileParents);
    } else {
      setPedigreeParents({ fatherName: '', motherName: '' });
    }
  }, [
    horse?.id,
    horse?.horseFatherEnglishName,
    horse?.horseFatherArabicName,
    horse?.horseMotherEnglishName,
    horse?.horseMotherArabicName,
    isRTL,
  ]);

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
              onOpenSale={() => { setSaleError(''); setSaleOpen(true); }}
              onRate={() => setIsRatingOpen(true)}
              averageRating={rating?.averageScore}
              ratingsCount={rating?.ratingsCount}
              box={horse?.box ?? null}
              isTemporarilyAwayFromBox={horse?.isTemporarilyAwayFromBox ?? false}
              temporaryLeavingReason={horse?.temporaryLeavingReason ?? null}
              leftToStudEn={horse?.leftToStudEn ?? horse?.leftToStud?.studName ?? null}
              leftToStudAr={horse?.leftToStudAr ?? horse?.leftToStud?.studArabicName ?? null}
              onOpenAssignBox={() => setIsAssignBoxOpen(true)}
              isActive={horse?.isActive ?? true}
              statusLoading={statusSaving}
              onOpenStatus={() => { setStatusError(''); setStatusOpen(true); }}
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
            {tagsLoaded ? (
              <HorseTagsPanel
                horseId={horseId ?? profileHorse.id}
                tags={horse?.tags}
                onChange={(tags) => setHorse((current) => current ? { ...current, tags } : current)}
              />
            ) : null}
            <HorseProfileTabs
              activeTab={activeTab}
              onTabChange={handleTabChange}
              hiddenTabs={hasVideos ? [] : ['videos']}
            />

            {activeTab === 'pedigree' && (
              <>
                <HorseFamilySearch localId={profileLocalId} />
                <HorsePedigreeTree
                  horse={{ ...profileHorse, localId: profileLocalId }}
                  onTagsMutated={refreshTags}
                  onPedigreeLoaded={handlePedigreeLoaded}
                />
              </>
            )}
            {activeTab === 'analytics' && <HorseAnalyticsTab localId={profileLocalId} />}
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
              isTemporarilyAwayFromBox={horse?.isTemporarilyAwayFromBox ?? false}
              temporaryLeavingReason={horse?.temporaryLeavingReason ?? null}
              leftToStudEn={horse?.leftToStudEn ?? horse?.leftToStud?.studName ?? null}
              leftToStudAr={horse?.leftToStudAr ?? horse?.leftToStud?.studArabicName ?? null}
              onClose={() => setIsAssignBoxOpen(false)}
              onSubmit={handleAssignBox}
            />
            <HorseSaleModal
              open={saleOpen}
              locale={locale as LocaleCode}
              horseName={locale === 'ar' ? profileHorse.nameAr : profileHorse.nameEn}
              isSold={horse?.isSold ?? false}
              soldTo={horse?.soldTo}
              soldPrice={horse?.soldPrice}
              soldAt={horse?.soldAt}
              saving={soldLoading}
              error={saleError}
              onClose={() => !soldLoading && setSaleOpen(false)}
              onSave={handleSoldChange}
            />
            <HorseStatusModal
              open={statusOpen}
              horseName={locale === 'ar' ? profileHorse.nameAr : profileHorse.nameEn}
              isActive={horse?.isActive ?? true}
              deceasedAt={horse?.deceasedAt}
              deceasedReason={horse?.deceasedReason}
              saving={statusSaving}
              error={statusError}
              onClose={() => !statusSaving && setStatusOpen(false)}
              onSave={handleStatusChange}
            />
          </>
        )}
      </div>
    </MainLayout>
  );
}
