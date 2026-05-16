'use client';

import { useEffect, useState } from 'react';
import { getHorseFamilyAnalysisTree, getTailFemale, getTailMale, normalizePagedList } from '@/lib/api/external-horses';
import { getLocalizedName } from '@/lib/api/localization';
import type { ExternalTailNode, HorseFamilyTreeItem } from '@/lib/api/types';
import { useLocale } from '@/lib/locale-context';

interface HorseAnalyticsTabProps {
  studbookId?: number | null;
}

function Chips({ values }: { values?: number[] | null }) {
  if (!values?.length) return <span>-</span>;

  return (
    <div className="flex flex-wrap justify-center gap-1">
      {values.map((value) => (
        <span key={value} className="rounded-full bg-[#f3e8e0] px-2 py-1 text-[11px] font-semibold text-[#4a2b1a]">
          {value}
        </span>
      ))}
    </div>
  );
}

function TailList({ title, rows }: { title: string; rows: ExternalTailNode[] }) {
  const { locale } = useLocale();
  const isArabic = locale === 'ar';

  return (
    <section className="rounded-2xl border border-[#eadfd9] bg-white p-4">
      <h3 className="mb-4 text-lg font-bold text-[#2a2a2a]">{title}</h3>
      <div className="space-y-2">
        {rows.length ? rows.map((row) => (
          <div key={`${row.id}-${row.generationLevel}`} className="flex items-center justify-between rounded-xl bg-[#fdfbf7] px-3 py-2 text-sm">
            <span className="font-semibold text-[#3b2314]">{getLocalizedName(row.englishName, row.arabicName, isArabic)}</span>
            <span className="text-[#7a6c63]">{isArabic ? 'الجيل' : 'Generation'} {row.generationLevel}</span>
          </div>
        )) : (
          <div className="py-6 text-center text-sm text-[#7a6c63]">{isArabic ? 'لا توجد سجلات' : 'No records found'}</div>
        )}
      </div>
    </section>
  );
}

export function HorseAnalyticsTab({ studbookId }: HorseAnalyticsTabProps) {
  const { locale, direction } = useLocale();
  const isRTL = direction === 'rtl';
  const isArabic = locale === 'ar';
  const [analysis, setAnalysis] = useState<HorseFamilyTreeItem[]>([]);
  const [tailMale, setTailMale] = useState<ExternalTailNode[]>([]);
  const [tailFemale, setTailFemale] = useState<ExternalTailNode[]>([]);
  const [loading, setLoading] = useState(Boolean(studbookId));
  const [error, setError] = useState('');

  useEffect(() => {
    if (!studbookId) return;

    let mounted = true;

    async function loadAnalytics() {
      setLoading(true);
      setError('');

      try {
        const [analysisResult, tailMaleResult, tailFemaleResult] = await Promise.all([
          getHorseFamilyAnalysisTree({ studbookId: studbookId as number, levels: 12, pageNumber: 1, pageSize: 20 }),
          getTailMale({ studbookId: studbookId as number, levels: 12, pageNumber: 1, pageSize: 20 }),
          getTailFemale({ studbookId: studbookId as number, levels: 12, pageNumber: 1, pageSize: 20 }),
        ]);

        if (!mounted) return;
        setAnalysis(normalizePagedList(analysisResult).items);
        setTailMale(normalizePagedList(tailMaleResult).items);
        setTailFemale(normalizePagedList(tailFemaleResult).items);
      } catch (requestError) {
        if (mounted) setError(requestError instanceof Error ? requestError.message : isArabic ? 'تعذر تحميل التحليلات' : 'Failed to load analytics');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadAnalytics();

    return () => {
      mounted = false;
    };
  }, [studbookId, isArabic]);

  if (!studbookId) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center text-sm text-[#7a6c63]">
        {isArabic ? 'لا يوجد رقم Studbook لهذا الخيل' : 'No studbook id is available for this horse.'}
      </div>
    );
  }

  if (loading) {
    return <div className="rounded-2xl bg-white p-10 text-center text-sm text-[#7a6c63]">{isArabic ? 'جارٍ التحميل' : 'Loading'}</div>;
  }

  return (
    <div className={`mb-12 ${isRTL ? 'text-right' : 'text-left'}`}>
      <h2 className="mb-6 text-2xl font-bold text-[#2a2a2a]">{isArabic ? 'التحليلات' : 'Analytics'}</h2>

      {error ? (
        <div className="mb-4 rounded-2xl border border-[#f2c7c7] bg-[#fff3f3] px-4 py-3 text-sm text-[#b04444]">{error}</div>
      ) : null}

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <TailList title={isArabic ? 'خط الذكور' : 'Tail Male'} rows={tailMale} />
        <TailList title={isArabic ? 'خط الإناث' : 'Tail Female'} rows={tailFemale} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-center text-sm">
            <thead className="bg-[#3d2a1b] text-white">
              <tr>
                <th className="px-4 py-4">{isArabic ? 'الاسم' : 'Name'}</th>
                <th className="px-4 py-4">{isArabic ? 'النسبة' : 'Percentage'}</th>
                <th className="px-4 py-4">{isArabic ? 'من الأم' : 'From Mother'}</th>
                <th className="px-4 py-4">{isArabic ? 'من الأب' : 'From Father'}</th>
                <th className="px-4 py-4">{isArabic ? 'الأجيال' : 'Generations'}</th>
              </tr>
            </thead>
            <tbody>
              {analysis.length ? analysis.map((row, index) => (
                <tr key={`${row.id}-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                  <td className="border-b border-gray-100 px-4 py-4 font-semibold text-[#3b2314]">
                    {getLocalizedName(row.englishName, row.arabicName, isArabic)}
                  </td>
                  <td className="border-b border-gray-100 px-4 py-4">{row.percentage ?? '-'}</td>
                  <td className="border-b border-gray-100 px-4 py-4">{row.percentageFromMother ?? '-'}</td>
                  <td className="border-b border-gray-100 px-4 py-4">{row.percentageFromFather ?? '-'}</td>
                  <td className="border-b border-gray-100 px-4 py-4"><Chips values={row.generationLevels} /></td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-[#7a6c63]">{isArabic ? 'لا توجد سجلات' : 'No records found'}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
