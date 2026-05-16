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
} from '@/components/horses';
import { RelatedHorsesTable } from '@/components/horses/profile/RelatedHorsesTable';
import { clientApiFetch } from '@/lib/api/client';
import { getExternalHorseDashboard, getHorseOffsprings, getHorseSiblings } from '@/lib/api/external-horses';
import { toProfileHorseModel } from '@/lib/api/horse-formatters';
import { isDirectApiMode } from '@/lib/api/transport';
import type {
  ApiResult,
  HorseInfoDto,
  HorseListItemDto,
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
    owner: null,
    breeder: null,
  };
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

  const profileHorse = horse ? toProfileHorseModel(horse, locale as LocaleCode) : null;

  useEffect(() => {
    if (isDirectApiMode) return;
    if (!horse) return;

    const localId = horse.id;
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
          const fallbackHorse = listPayload.data.find((item) => item.id === Number(horseId));

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
            <HorseProfileHeader horse={profileHorse} />
            <HorsePedigreeStats
              loading={!dashboard}
              horse={{
                maleOffspring: dashboard?.foals?.male,
                femaleOffspring: dashboard?.foals?.female,
                maleResults: dashboard?.siblings?.male,
                femaleResults: dashboard?.siblings?.female,
              }}
            />
            <HorseProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />

            {activeTab === 'pedigree' && <HorsePedigreeTree horse={profileHorse} />}
            {activeTab === 'analytics' && <HorseAnalyticsTab studbookId={profileHorse.studbookId} />}
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
          </>
        )}
      </div>
    </MainLayout>
  );
}
