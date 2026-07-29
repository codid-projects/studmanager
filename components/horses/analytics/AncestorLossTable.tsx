'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocale } from '@/lib/locale-context';

export interface AncestorTableRow {
  name: string;
  occurs: number;
  total: number;
  sirePercentage: number;
  damPercentage: number;
  [key: string]: unknown;
}

interface AncestorLossTableProps {
  rows: AncestorTableRow[];
}

const PAGE_SIZE = 8;

/** True when the API sent a positive occurrence count (what readers scan for). */
function hasPositiveCount(value: unknown): boolean {
  if (value === '-' || value === '' || value === null || value === undefined) return false;

  const parsed = typeof value === 'number' ? value : Number.parseFloat(String(value).trim());
  return Number.isFinite(parsed) && parsed > 0;
}

function GenStackCell({
  sireValue,
  damValue,
  sireShort,
  damShort,
  sireTitle,
  damTitle,
}: {
  sireValue: unknown;
  damValue: unknown;
  sireShort: string;
  damShort: string;
  sireTitle: string;
  damTitle: string;
}) {
  const sireActive = hasPositiveCount(sireValue);
  const damActive = hasPositiveCount(damValue);
  const cellActive = sireActive || damActive;

  const sireText = sireValue === '-' || sireValue === '' ? '—' : String(sireValue);
  const damText = damValue === '-' || damValue === '' ? '—' : String(damValue);

  return (
    <div
      className={`flex w-[4.25rem] min-w-[4.25rem] flex-col gap-0.5 rounded-lg border p-1 shadow-sm transition-colors ${
        cellActive
          ? 'border-[#d9c3a5] bg-gradient-to-b from-[#faf3e9] to-[#fdf1ea] shadow-md ring-2 ring-[#e4d2b8]/60'
          : 'border-[#f0e7dd] bg-[#faf7f3]'
      }`}
    >
      <div
        title={sireTitle}
        className={`flex items-center justify-between gap-0.5 rounded-md px-1 py-0.5 transition-colors ${
          sireActive
            ? 'border border-[#bfa176] bg-[#ece0cd] shadow-sm'
            : 'border border-transparent bg-[#f9f4ec]'
        }`}
      >
        <span
          className={`shrink-0 text-[10px] font-bold uppercase tracking-wide ${
            sireActive ? 'text-[#4a3113]' : 'text-[#b0a087]'
          }`}
        >
          {sireShort}
        </span>
        <span
          className={`text-xs font-semibold tabular-nums ${
            sireActive ? 'text-[#33200a]' : 'text-[#b0a087]'
          }`}
        >
          {sireText}
        </span>
      </div>
      <div
        title={damTitle}
        className={`flex items-center justify-between gap-0.5 rounded-md px-1 py-0.5 transition-colors ${
          damActive
            ? 'border border-[#c58a6c] bg-[#f4ddd1] shadow-sm'
            : 'border border-transparent bg-[#fdf3ed]'
        }`}
      >
        <span
          className={`shrink-0 text-[10px] font-bold uppercase tracking-wide ${
            damActive ? 'text-[#6b3320]' : 'text-[#c6ab9e]'
          }`}
        >
          {damShort}
        </span>
        <span
          className={`text-xs font-semibold tabular-nums ${
            damActive ? 'text-[#4f2213]' : 'text-[#c6ab9e]'
          }`}
        >
          {damText}
        </span>
      </div>
    </div>
  );
}

export function AncestorLossTable({ rows }: AncestorLossTableProps) {
  const { locale, direction } = useLocale();
  const isArabic = locale === 'ar';
  const isRTL = direction === 'rtl';
  const [nameSort, setNameSort] = useState<'asc' | 'desc' | null>(null);
  const [page, setPage] = useState(0);

  const sireShort = 'S';
  const damShort = 'D';
  const sireLine = isArabic ? 'خط الأب' : 'Sire';
  const damLine = isArabic ? 'خط الأم' : 'Dam';

  const displayRows = useMemo(() => {
    if (!nameSort) return rows;

    return [...rows].sort((a, b) => {
      const comparison = a.name.localeCompare(b.name, isArabic ? 'ar' : 'en', {
        sensitivity: 'base',
      });
      return nameSort === 'asc' ? comparison : -comparison;
    });
  }, [rows, nameSort, isArabic]);

  const cycleNameSort = () => {
    setNameSort((previous) => {
      if (previous === null) return 'asc';
      if (previous === 'asc') return 'desc';
      return null;
    });
    setPage(0);
  };

  const totalPages = Math.max(1, Math.ceil(displayRows.length / PAGE_SIZE));
  const pageIndex = Math.min(page, Math.max(0, totalPages - 1));
  const pageRows = useMemo(
    () => displayRows.slice(pageIndex * PAGE_SIZE, pageIndex * PAGE_SIZE + PAGE_SIZE),
    [displayRows, pageIndex],
  );

  const startIndex = displayRows.length === 0 ? 0 : pageIndex * PAGE_SIZE + 1;
  const endIndex = Math.min((pageIndex + 1) * PAGE_SIZE, displayRows.length);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#eadfd9] bg-gradient-to-br from-[#faf5f2] via-white to-[#fdf3ea] px-4 py-3 text-sm text-[#5c4a3f] shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <div className="min-w-0 space-y-1">
            <p className="font-bold text-[#3b2314]">
              {isArabic ? 'قراءة جدول الأجيال الاثني عشر' : 'Reading the 12-generation grid'}
            </p>
            <p className="max-w-3xl leading-relaxed text-[#7a6c63]">
              {isArabic
                ? 'كل عمود يمثل جيلًا في النسب (G1 = الأبوين، G12 = اثنا عشر جيلًا للخلف). في كل خلية، S يعد الظهور على خط الأب وD على خط الأم لهذا الجد.'
                : 'Each column is a pedigree depth (G1 = parents, G12 = twelve generations back). In every cell, S counts appearances on the sire side and D on the dam side for that ancestor.'}
            </p>
          </div>
          <div
            className={`flex shrink-0 flex-wrap gap-2 pt-0.5 sm:pt-1 ${
              isRTL ? 'flex-row-reverse' : ''
            }`}
          >
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e0cdb2] bg-[#f2e7d6] px-3 py-1 text-xs font-semibold text-[#4a3113]">
              <span className="text-[11px] font-bold text-[#8b6f47]">{sireShort}</span>
              {sireLine}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#eccdbd] bg-[#f8e5db] px-3 py-1 text-xs font-semibold text-[#6b3320]">
              <span className="text-[11px] font-bold text-[#b0745a]">{damShort}</span>
              {damLine}
            </span>
          </div>
        </div>
      </div>

      <div className="analysis-print-area overflow-hidden rounded-2xl border border-[#eadfd9] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] border-collapse text-sm" dir="ltr">
            <thead>
              <tr className="bg-[#f3e8e0]">
                <th
                  rowSpan={2}
                  className="sticky left-0 z-30 min-w-[168px] max-w-[240px] border-b border-r border-[#e0d0c3] bg-[#f3e8e0] px-3 py-3 text-start align-middle font-bold text-[#3b2314] shadow-[4px_0_12px_-4px_rgba(61,42,27,0.15)]"
                >
                  <button
                    type="button"
                    onClick={cycleNameSort}
                    className="flex w-full items-center gap-1.5 rounded-lg px-1 py-0.5 text-start transition hover:bg-white/70"
                  >
                    <span>{isArabic ? 'الاسم' : 'Name'}</span>
                    {nameSort ? (
                      <span className="text-xs font-normal text-[#7a6c63]" aria-hidden>
                        {nameSort === 'asc' ? '↑' : '↓'}
                      </span>
                    ) : null}
                  </button>
                </th>
                <th
                  rowSpan={2}
                  className="border-b border-r border-[#e0d0c3] bg-[#f3e8e0] px-2 py-3 text-center align-middle font-bold text-[#3b2314]"
                >
                  {isArabic ? 'التكرار' : 'Occurs'}
                </th>
                <th
                  rowSpan={2}
                  className="border-b border-r border-[#e0d0c3] bg-[#f3e8e0] px-2 py-3 text-center align-middle font-bold text-[#3b2314]"
                >
                  {isArabic ? 'المجموع' : 'Total'}
                </th>
                <th
                  rowSpan={2}
                  className="border-b border-[#e0d0c3] border-r-2 border-r-[#d3bda9] bg-[#f3e8e0] px-2 py-3 text-center align-middle font-bold text-[#3b2314]"
                >
                  <div className="flex flex-col gap-0.5">
                    <span>{isArabic ? 'النسبة' : 'Ratio'}</span>
                    <span className="text-[11px] font-normal text-[#7a6c63]">
                      {isArabic ? 'أب | أم' : 'sire | dam'}
                    </span>
                  </div>
                </th>
                <th
                  colSpan={12}
                  className="border-b border-[#e0d0c3] bg-[#e7d7c9] px-2 py-2 text-center text-xs font-bold uppercase tracking-wide text-[#4a3113]"
                >
                  {isArabic
                    ? 'عدد الظهور حسب العمق (خط الأب مقابل خط الأم)'
                    : 'Appearance counts by depth (sire line vs dam line)'}
                </th>
              </tr>
              <tr className="bg-[#faf5f2]">
                {Array.from({ length: 12 }, (_, index) => (
                  <th
                    key={index}
                    className={`border-b border-r border-[#eadfd9] px-1 py-2 text-center text-[11px] font-bold text-[#5c4a3f] last:border-r-0 ${
                      index === 0 ? 'border-l-2 border-l-[#d3bda9]' : ''
                    }`}
                  >
                    G{index + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row, rowIndex) => (
                <tr
                  key={`${row.name}-${pageIndex}-${rowIndex}`}
                  className={`group transition-colors hover:bg-[#faf5f2] ${
                    rowIndex % 2 === 0 ? 'bg-white' : 'bg-[#fdfbf7]'
                  }`}
                >
                  <td
                    className={`sticky left-0 z-20 max-w-[240px] border-b border-r border-[#eadfd9] px-3 py-2 align-middle font-semibold text-[#3b2314] shadow-[4px_0_12px_-4px_rgba(61,42,27,0.15)] group-hover:bg-[#faf5f2] ${
                      rowIndex % 2 === 0 ? 'bg-white' : 'bg-[#fdfbf7]'
                    }`}
                  >
                    <span className="line-clamp-2 leading-snug">{row.name}</span>
                  </td>
                  <td className="border-b border-r border-[#eadfd9] px-2 py-2 text-center align-middle tabular-nums text-[#5c4a3f]">
                    {row.occurs}
                  </td>
                  <td className="border-b border-r border-[#eadfd9] px-2 py-2 text-center align-middle tabular-nums text-[#5c4a3f]">
                    {row.total}
                  </td>
                  <td className="border-b border-[#eadfd9] border-r-2 border-r-[#e0d0c3] px-2 py-2 text-center align-middle tabular-nums">
                    <span className="inline-flex flex-col gap-0.5 rounded-md bg-[#f6efe7] px-2 py-1 text-xs font-semibold">
                      <span className="text-[#6b4a1f]">{(row.sirePercentage ?? 0).toFixed(2)}%</span>
                      <span className="text-[#8a4630]">{(row.damPercentage ?? 0).toFixed(2)}%</span>
                    </span>
                  </td>
                  {Array.from({ length: 12 }, (_, generationIndex) => (
                    <td
                      key={generationIndex}
                      className={`border-b border-r border-[#f2e9e1] px-1 py-2 align-middle ${
                        generationIndex === 0 ? 'border-l-2 border-l-[#e0d0c3]' : ''
                      }`}
                    >
                      <div className="flex justify-center">
                        <GenStackCell
                          sireValue={row[`g${generationIndex + 1}Men`]}
                          damValue={row[`g${generationIndex + 1}Women`]}
                          sireShort={sireShort}
                          damShort={damShort}
                          sireTitle={sireLine}
                          damTitle={damLine}
                        />
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 ? (
          <div
            className={`flex flex-col gap-3 border-t border-[#eadfd9] bg-[#faf5f2] px-3 py-3 sm:flex-row sm:items-center sm:justify-between ${
              isRTL ? 'sm:flex-row-reverse' : ''
            }`}
          >
            <p className="text-center text-sm text-[#7a6c63] sm:text-start">
              {isArabic ? 'عرض' : 'Showing'} {startIndex}–{endIndex} {isArabic ? 'من' : 'of'}{' '}
              {displayRows.length}
            </p>
            <div className={`flex items-center justify-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <button
                type="button"
                disabled={pageIndex <= 0}
                onClick={() => setPage((previous) => Math.max(0, previous - 1))}
                aria-label={isArabic ? 'الصفحة السابقة' : 'Previous page'}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#eadfd9] bg-white text-[#3b2314] shadow-sm transition hover:bg-[#faf5f2] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
              </button>
              <span className="min-w-[7rem] text-center text-sm font-semibold text-[#3b2314]">
                {pageIndex + 1} / {totalPages}
              </span>
              <button
                type="button"
                disabled={pageIndex >= totalPages - 1}
                onClick={() => setPage((previous) => Math.min(totalPages - 1, previous + 1))}
                aria-label={isArabic ? 'الصفحة التالية' : 'Next page'}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#eadfd9] bg-white text-[#3b2314] shadow-sm transition hover:bg-[#faf5f2] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
