'use client';

import { FC, useMemo, useState } from 'react';
import { getLocalizedName } from '@/lib/api/localization';
import type { HorseFamilyTreeItem } from '@/lib/api/types';
import { useLocale } from '@/lib/locale-context';
import { AncestorLossTable, AncestorTableRow } from './AncestorLossTable';
import { AnalyticsSearchField } from './AnalyticsToolbar';

interface AncestorLossPanelProps {
  rows: HorseFamilyTreeItem[];
}

/**
 * Folds the flat analysis-tree response into one row per ancestor, counting how
 * often it appears at each generation on the sire and the dam side.
 */
function transformAncestorRows(items: HorseFamilyTreeItem[], isArabic: boolean): AncestorTableRow[] {
  const rowsByAncestor = new Map<string, AncestorTableRow & { generations: Record<string, number> }>();
  const order: string[] = [];

  items.forEach((item) => {
    const key = `${item.englishName || ''}_${item.arabicName || ''}`;

    if (!rowsByAncestor.has(key)) {
      order.push(key);
      rowsByAncestor.set(key, {
        name: getLocalizedName(item.englishName, item.arabicName, isArabic) || 'Unknown',
        occurs: 0,
        total: 0,
        sirePercentage: item.percentageFromFather || 0,
        damPercentage: item.percentageFromMother || 0,
        generations: {},
      });
    }

    const row = rowsByAncestor.get(key)!;

    if (Array.isArray(item.generationLevels)) row.occurs = item.generationLevels.length;

    row.total = (item.percentageFromFather || 0) + (item.percentageFromMother || 0);

    item.generationLevelsFromFather?.forEach((level) => {
      if (level >= 1 && level <= 12) {
        const cellKey = `g${level}Men`;
        row.generations[cellKey] = (row.generations[cellKey] || 0) + 1;
      }
    });

    item.generationLevelsFromMother?.forEach((level) => {
      if (level >= 1 && level <= 12) {
        const cellKey = `g${level}Women`;
        row.generations[cellKey] = (row.generations[cellKey] || 0) + 1;
      }
    });
  });

  return order
    .map((key) => rowsByAncestor.get(key)!)
    .map((row) => ({
      ...row,
      ...Object.fromEntries(
        Array.from({ length: 12 }, (_, index) => [
          [`g${index + 1}Men`, row.generations[`g${index + 1}Men`] || '-'],
          [`g${index + 1}Women`, row.generations[`g${index + 1}Women`] || '-'],
        ]).flat(),
      ),
    }));
}

export const AncestorLossPanel: FC<AncestorLossPanelProps> = ({ rows }) => {
  const { locale, direction } = useLocale();
  const isArabic = locale === 'ar';
  const isRTL = direction === 'rtl';
  const [searchText, setSearchText] = useState('');

  const tableRows = useMemo(() => transformAncestorRows(rows, isArabic), [rows, isArabic]);

  const filteredRows = useMemo(() => {
    if (!searchText.trim()) return tableRows;

    const needle = searchText.trim().toLowerCase();

    return tableRows.filter((row) =>
      Object.values(row).some((value) => value?.toString().toLowerCase().includes(needle)),
    );
  }, [tableRows, searchText]);

  return (
    <>
      <div
        className={`mb-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between ${
          isRTL ? 'text-right' : 'text-left'
        }`}
      >
        <div className="flex max-w-2xl flex-col gap-1.5">
          <h3 className="text-lg font-bold text-[#2a2a2a]">
            {isArabic ? 'تحليل الأنساب لـ 12 جيل' : '12 Generation Pedigree Analysis'}
          </h3>
          <p className="text-sm leading-relaxed text-[#7a6c63]">
            {isArabic
              ? 'حلل النسبة المئوية وتكرار الأجداد الظاهرين في شجرة أنساب الحصان عبر 12 جيل. هذا يساعد في تحديد أنماط التربية والمساهمات الجينية من سلالات الأب والأم.'
              : "Analyze the percentage and frequency of ancestors appearing in the horse's pedigree tree across 12 generations. This helps identify breeding patterns and genetic contributions from sire and dam lineages."}
          </p>
        </div>

        <AnalyticsSearchField
          value={searchText}
          onChange={setSearchText}
          placeholder={isArabic ? 'بحث...' : 'Search...'}
        />
      </div>

      {tableRows.length === 0 ? (
        <div
          role="status"
          className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#eadfd9] bg-[#fdfbf7] px-6 py-14 text-center"
        >
          <p className="text-lg font-bold text-[#3b2314]">
            {isArabic ? 'لا توجد بيانات متاحة' : 'No Data Available'}
          </p>
          <p className="mt-2 max-w-md text-sm text-[#7a6c63]">
            {isArabic
              ? 'لم يتم العثور على بيانات تحليل الأنساب لهذا الحصان.'
              : 'No pedigree analysis data found for this horse.'}
          </p>
        </div>
      ) : (
        <div className="rounded-xl">
          <AncestorLossTable
            key={`${searchText}-${filteredRows.length}`}
            rows={filteredRows}
          />
        </div>
      )}
    </>
  );
};
