'use client';

import { FC, useMemo, useState } from 'react';
import { localizeGender } from '@/lib/api/horse-formatters';
import { getLocalizedName } from '@/lib/api/localization';
import type { ExternalTailNode } from '@/lib/api/types';
import { exportAnalysisToExcel, exportAnalysisToPdf } from '@/lib/export/analysis-export';
import { useLocale } from '@/lib/locale-context';
import { AnalyticsColumn, AnalyticsDataTable } from './AnalyticsDataTable';
import { AnalyticsExportMenu, AnalyticsPrintButton, AnalyticsSearchField } from './AnalyticsToolbar';

interface TailLinePanelProps {
  sex: 'Male' | 'Female';
  rows: ExternalTailNode[];
}

const birthYear = (row: ExternalTailNode) =>
  row.dateofBirth ? new Date(row.dateofBirth).getFullYear() || '-' : '-';

export const TailLinePanel: FC<TailLinePanelProps> = ({ sex, rows }) => {
  const { locale, direction } = useLocale();
  const isArabic = locale === 'ar';
  const isRTL = direction === 'rtl';
  const [searchText, setSearchText] = useState('');

  const horseName = (row: ExternalTailNode) =>
    getLocalizedName(row.englishName, row.arabicName, isArabic);
  const sireName = (row: ExternalTailNode) =>
    getLocalizedName(row.horseFatherEnglishName, row.horseFatherArabicName, isArabic);
  const damName = (row: ExternalTailNode) =>
    getLocalizedName(row.horseMotherEnglishName, row.horseMotherArabicName, isArabic);

  const columns: AnalyticsColumn<ExternalTailNode>[] = [
    {
      key: 'generation',
      label: isArabic ? 'الجيل' : 'Generation',
      align: 'center',
      sortValue: (row) => row.generationLevel || 0,
      renderCell: (row) => (
        <span className="inline-flex min-w-[2.25rem] items-center justify-center rounded-full bg-[#f3e8e0] px-2.5 py-1 text-xs font-bold text-[#4a2b1a]">
          {row.generationLevel || 0}
        </span>
      ),
    },
    {
      key: 'name',
      label: isArabic ? 'الاسم' : 'Name',
      sortValue: horseName,
      renderCell: (row) => <span className="font-semibold text-[#3b2314]">{horseName(row)}</span>,
    },
    {
      key: 'year',
      label: isArabic ? 'السنة' : 'Year',
      align: 'center',
      sortValue: (row) => (row.dateofBirth ? new Date(row.dateofBirth).getFullYear() || 0 : 0),
      renderCell: (row) => <span className="tabular-nums">{birthYear(row)}</span>,
    },
    {
      key: 'sex',
      label: isArabic ? 'الجنس' : 'Sex',
      align: 'center',
      sortValue: (row) => row.gender || '',
      renderCell: (row) => localizeGender(row.gender, locale),
    },
    {
      key: 'sire',
      label: isArabic ? 'الأب' : 'Sire',
      renderCell: (row) => sireName(row),
    },
    {
      key: 'dam',
      label: isArabic ? 'الأم' : 'Dam',
      renderCell: (row) => damName(row),
    },
  ];

  const filteredRows = useMemo(() => {
    if (!searchText.trim()) return rows;

    const needle = searchText.trim().toLowerCase();

    return rows.filter((row) =>
      Object.values(row).some((value) => value?.toString().toLowerCase().includes(needle)),
    );
  }, [rows, searchText]);

  const sexLabel = isArabic ? (sex === 'Male' ? 'ذكر' : 'انثي') : sex;
  const title = `${isArabic ? 'خط الذيل لـ 14 جيل' : '14 generation tail line'} · ${sexLabel}`;

  const exportContext = () => ({
    title,
    locale,
    headers: [
      isArabic ? 'الجيل' : 'Generation',
      isArabic ? 'الاسم' : 'Name',
      isArabic ? 'السنة' : 'Year',
      isArabic ? 'الجنس' : 'Sex',
      isArabic ? 'الأب' : 'Sire',
      isArabic ? 'الأم' : 'Dam',
    ],
    rows: filteredRows.map((row) => [
      row.generationLevel || 0,
      horseName(row),
      birthYear(row),
      localizeGender(row.gender, locale),
      sireName(row),
      damName(row),
    ]),
    fileName: `tail-line-${sex.toLowerCase()}`,
  });

  return (
    <>
      <div
        className={`mb-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between ${
          isRTL ? 'text-right' : 'text-left'
        }`}
      >
        <div className="flex max-w-xl flex-col gap-1.5">
          <h3 className="text-lg font-bold text-[#2a2a2a]">{title}</h3>
          <p className="text-sm leading-relaxed text-[#7a6c63]">
            {isArabic
              ? 'حلل خط الذيل الذي يظهر النسب المباشر للأم أو الأب عبر 14 جيل. هذا يساعد في تحديد سلالات الدم النقية وأنماط التربية في أنساب الحصان.'
              : 'Analyze the tail line showing the direct maternal or paternal lineage through 14 generations. This helps identify the pure bloodlines and breeding patterns in the horse’s ancestry.'}
          </p>
        </div>

        <div
          className={`flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center ${
            isRTL ? 'sm:flex-row-reverse' : ''
          }`}
        >
          <AnalyticsSearchField
            value={searchText}
            onChange={setSearchText}
            placeholder={isArabic ? 'بحث...' : 'Search...'}
          />
          <AnalyticsExportMenu
            label={isArabic ? 'تصدير' : 'Export'}
            pdfLabel={isArabic ? 'بي دي اف' : 'PDF'}
            excelLabel={isArabic ? 'إكسل' : 'EXCEL'}
            onExportPdf={() => exportAnalysisToPdf(exportContext())}
            onExportExcel={() => exportAnalysisToExcel(exportContext())}
          />
          <AnalyticsPrintButton
            label={isArabic ? 'طباعة الجدول' : 'Print table'}
            onPrint={() => window.print()}
          />
        </div>
      </div>

      {rows.length === 0 ? (
        <div
          role="status"
          className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#eadfd9] bg-[#fdfbf7] px-6 py-14 text-center"
        >
          <p className="text-lg font-bold text-[#3b2314]">
            {isArabic ? 'لا توجد بيانات متاحة' : 'No Data Available'}
          </p>
          <p className="mt-2 max-w-md text-sm text-[#7a6c63]">
            {isArabic
              ? 'لم يتم العثور على بيانات خط الذيل لهذا الحصان.'
              : 'No tail line data found for this horse.'}
          </p>
        </div>
      ) : (
        <AnalyticsDataTable
          columns={columns}
          rows={filteredRows}
          rowKey={(row, index) => `${row.id}-${row.generationLevel}-${index}`}
          emptyMessage={isArabic ? 'لا توجد سجلات' : 'No records found'}
          labels={{
            showing: isArabic ? 'عرض' : 'Showing',
            of: isArabic ? 'من' : 'of',
            perPage: isArabic ? 'عدد الإدخالات لكل صفحة' : 'Listings per Page',
            previousPage: isArabic ? 'الصفحة السابقة' : 'Previous page',
            nextPage: isArabic ? 'الصفحة التالية' : 'Next page',
          }}
        />
      )}
    </>
  );
};
