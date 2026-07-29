'use client';

import { useEffect, useState } from 'react';
import {
  getHorseFamilyAnalysisTree,
  getTailFemale,
  getTailMale,
  normalizePagedList,
} from '@/lib/api/external-horses';
import type { ExternalTailNode, HorseFamilyTreeItem } from '@/lib/api/types';
import { useLocale } from '@/lib/locale-context';
import { AnalyticsSubTabBar } from './analytics/AnalyticsSubTabBar';
import { AncestorLossPanel } from './analytics/AncestorLossPanel';
import { TailLinePanel } from './analytics/TailLinePanel';

interface HorseAnalyticsTabProps {
  localId?: number | string | null;
}

type AnalysisSubTab = 'tail_female' | 'tail_male' | 'ancestor_loss';

/** The analysis endpoints page their results; one large page keeps the tables complete. */
const ANALYSIS_PAGE_SIZE = 500;

export function HorseAnalyticsTab({ localId }: HorseAnalyticsTabProps) {
  const { locale, direction } = useLocale();
  const isRTL = direction === 'rtl';
  const isArabic = locale === 'ar';
  const numericLocalId = typeof localId === 'number' ? localId : Number(localId);
  const hasLocalId = Number.isFinite(numericLocalId) && numericLocalId > 0;
  const [activeTab, setActiveTab] = useState<AnalysisSubTab>('tail_female');
  const [analysis, setAnalysis] = useState<HorseFamilyTreeItem[]>([]);
  const [tailMale, setTailMale] = useState<ExternalTailNode[]>([]);
  const [tailFemale, setTailFemale] = useState<ExternalTailNode[]>([]);
  const [loading, setLoading] = useState(hasLocalId);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!hasLocalId) return;

    let mounted = true;

    async function loadAnalytics() {
      setLoading(true);
      setError('');

      try {
        const [analysisResult, tailMaleResult, tailFemaleResult] = await Promise.all([
          getHorseFamilyAnalysisTree({
            localId: numericLocalId,
            levels: 12,
            pageNumber: 1,
            pageSize: ANALYSIS_PAGE_SIZE,
          }),
          getTailMale({
            localId: numericLocalId,
            levels: 12,
            pageNumber: 1,
            pageSize: ANALYSIS_PAGE_SIZE,
          }),
          getTailFemale({
            localId: numericLocalId,
            levels: 12,
            pageNumber: 1,
            pageSize: ANALYSIS_PAGE_SIZE,
          }),
        ]);

        if (!mounted) return;
        setAnalysis(normalizePagedList(analysisResult).items);
        setTailMale(normalizePagedList(tailMaleResult).items);
        setTailFemale(normalizePagedList(tailFemaleResult).items);
      } catch (requestError) {
        if (mounted) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : isArabic
                ? 'تعذر تحميل التحليلات'
                : 'Failed to load analytics',
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadAnalytics();

    return () => {
      mounted = false;
    };
  }, [hasLocalId, numericLocalId, isArabic]);

  if (!hasLocalId) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center text-sm text-[#7a6c63]">
        {isArabic ? 'لا يوجد رقم محلي لهذا الخيل' : 'No local id is available for this horse.'}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-52 w-full items-center justify-center rounded-2xl border border-[#eadfd9] bg-white">
        <span className="h-9 w-9 animate-spin rounded-full border-2 border-[#eadfd9] border-t-[#3d2a1b]" />
      </div>
    );
  }

  const tabs = [
    { id: 'tail_female', label: isArabic ? 'خط أنثوي ذيلي' : 'Tail female line' },
    { id: 'tail_male', label: isArabic ? 'خط ذكوري ذيلي' : 'Tail male line' },
    { id: 'ancestor_loss', label: isArabic ? 'فقدان أجداد (12 جيل)' : 'Ancestor loss (12 gen.)' },
  ];

  const sectionTitle = isArabic ? 'تحليل النسب' : 'Pedigree Analysis';

  return (
    <div className={`mb-12 space-y-6 ${isRTL ? 'text-right' : 'text-left'}`}>
      <header className="space-y-2 border-b border-[#eadfd9] pb-6">
        <h2 className="text-2xl font-bold tracking-tight text-[#2a2a2a] sm:text-[28px]">
          {sectionTitle}
        </h2>
        <p className="max-w-3xl text-sm leading-relaxed text-[#7a6c63]">
          {isArabic
            ? 'استكشف خطوط الذيل وإحصائيات الأجداد عبر أجيال متعددة لهذا النسب.'
            : 'Explore tail lines and multi-generation ancestor statistics for this pedigree.'}
        </p>
      </header>

      {error ? (
        <div className="rounded-2xl border border-[#f2c7c7] bg-[#fff3f3] px-4 py-3 text-sm text-[#b04444]">
          {error}
        </div>
      ) : null}

      <AnalyticsSubTabBar
        ariaLabel={sectionTitle}
        tabs={tabs}
        activeId={activeTab}
        onChange={(id) => setActiveTab(id as AnalysisSubTab)}
      />

      <div className="rounded-2xl border border-[#eadfd9] bg-white p-1 shadow-sm sm:p-4">
        {activeTab === 'tail_female' ? (
          <TailLinePanel sex="Female" rows={tailFemale} />
        ) : activeTab === 'tail_male' ? (
          <TailLinePanel sex="Male" rows={tailMale} />
        ) : (
          <AncestorLossPanel rows={analysis} />
        )}
      </div>
    </div>
  );
}
