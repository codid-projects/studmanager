'use client';

import { ReactNode, useMemo, useState } from 'react';
import { ChevronDown, ChevronsUpDown, ChevronUp } from 'lucide-react';
import { useLocale } from '@/lib/locale-context';

export interface AnalyticsColumn<T> {
  key: string;
  label: string;
  align?: 'start' | 'center';
  /** Providing this makes the column header sortable. */
  sortValue?: (row: T) => string | number;
  renderCell: (row: T) => ReactNode;
}

type SortDirection = 'asc' | 'desc';

interface AnalyticsDataTableProps<T> {
  columns: AnalyticsColumn<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string;
  emptyMessage: string;
  labels: {
    showing: string;
    of: string;
    perPage: string;
    previousPage: string;
    nextPage: string;
  };
}

const PAGE_SIZES = [5, 10, 15];
const MAX_VISIBLE_PAGES = 5;

export function AnalyticsDataTable<T>({
  columns,
  rows,
  rowKey,
  emptyMessage,
  labels,
}: AnalyticsDataTableProps<T>) {
  const { locale, direction } = useLocale();
  const isRTL = direction === 'rtl';
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);

  const sortedRows = useMemo(() => {
    const column = columns.find((item) => item.key === sortKey);
    if (!column?.sortValue) return rows;

    const collator = new Intl.Collator(locale === 'ar' ? 'ar' : 'en', { sensitivity: 'base' });

    return [...rows].sort((a, b) => {
      const left = column.sortValue!(a);
      const right = column.sortValue!(b);
      const comparison =
        typeof left === 'number' && typeof right === 'number'
          ? left - right
          : collator.compare(String(left), String(right));

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [columns, rows, sortKey, sortDirection, locale]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const pageIndex = Math.min(page, totalPages - 1);
  const pageRows = useMemo(
    () => sortedRows.slice(pageIndex * pageSize, pageIndex * pageSize + pageSize),
    [sortedRows, pageIndex, pageSize],
  );

  const startIndex = sortedRows.length === 0 ? 0 : pageIndex * pageSize + 1;
  const endIndex = Math.min((pageIndex + 1) * pageSize, sortedRows.length);

  const startPage = Math.max(
    0,
    Math.min(pageIndex - Math.floor(MAX_VISIBLE_PAGES / 2), totalPages - MAX_VISIBLE_PAGES),
  );
  const endPage = Math.min(startPage + MAX_VISIBLE_PAGES, totalPages);

  /** Cycles asc → desc → unsorted, matching the pedigree tables on the public site. */
  const toggleSort = (key: string) => {
    setPage(0);

    if (sortKey !== key) {
      setSortKey(key);
      setSortDirection('asc');
      return;
    }

    if (sortDirection === 'asc') {
      setSortDirection('desc');
      return;
    }

    setSortKey(null);
    setSortDirection('asc');
  };

  return (
    <div className="space-y-6">
      <div className="analysis-print-area overflow-hidden rounded-2xl border border-[#eadfd9] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-[#3d2a1b] text-white">
              <tr>
                {columns.map((column) => {
                  const isSorted = sortKey === column.key;
                  const alignment = column.align === 'center' ? 'text-center' : 'text-start';

                  return (
                    <th
                      key={column.key}
                      scope="col"
                      aria-sort={isSorted ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                      className={`h-[60px] px-5 py-4 font-bold ${alignment}`}
                    >
                      {column.sortValue ? (
                        <button
                          type="button"
                          onClick={() => toggleSort(column.key)}
                          className={`flex w-full items-center gap-1.5 rounded-lg px-1 py-0.5 transition hover:text-[#f3e8e0] ${
                            column.align === 'center' ? 'justify-center' : 'justify-start'
                          }`}
                        >
                          <span>{column.label}</span>
                          {!isSorted ? (
                            <ChevronsUpDown className="h-3.5 w-3.5 opacity-70" aria-hidden />
                          ) : sortDirection === 'asc' ? (
                            <ChevronUp className="h-3.5 w-3.5" aria-hidden />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5" aria-hidden />
                          )}
                        </button>
                      ) : (
                        column.label
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {pageRows.length ? (
                pageRows.map((row, index) => (
                  <tr
                    key={rowKey(row, index)}
                    className="border-b border-[#eee3db] transition-colors last:border-b-0 hover:bg-[#faf5f2]"
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={`h-[60px] px-5 py-4 align-middle text-[#3b2314] ${
                          column.align === 'center' ? 'text-center' : 'text-start'
                        }`}
                      >
                        {column.renderCell(row)}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-16 text-center text-[#7a6c63]">
                    {emptyMessage}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <nav
        aria-label={labels.showing}
        className="flex flex-col gap-4 rounded-2xl border border-[#eadfd9] bg-white px-4 py-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-6 sm:px-5"
      >
        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:justify-start">
          <button
            type="button"
            onClick={() => setPage(Math.max(0, pageIndex - 1))}
            disabled={pageIndex === 0}
            aria-label={labels.previousPage}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#eadfd9] bg-white text-[#3b2314] shadow-sm transition hover:bg-[#faf5f2] disabled:pointer-events-none disabled:opacity-35"
          >
            <ChevronUp className={`h-4 w-4 ${isRTL ? 'rotate-90' : '-rotate-90'}`} aria-hidden />
          </button>

          <div className="flex flex-wrap items-center justify-center gap-1 px-1">
            {Array.from({ length: Math.max(0, endPage - startPage) }, (_, index) => startPage + index).map(
              (value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPage(value)}
                  aria-current={value === pageIndex ? 'page' : undefined}
                  className={`flex min-w-9 items-center justify-center rounded-xl px-2.5 py-2 text-sm font-semibold tabular-nums transition ${
                    value === pageIndex
                      ? 'bg-[#3d2a1b] text-white shadow-sm'
                      : 'text-[#7a6c63] hover:bg-[#faf5f2] hover:text-[#3b2314]'
                  }`}
                >
                  {value + 1}
                </button>
              ),
            )}
          </div>

          <button
            type="button"
            onClick={() => setPage(Math.min(totalPages - 1, pageIndex + 1))}
            disabled={pageIndex >= totalPages - 1}
            aria-label={labels.nextPage}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#eadfd9] bg-white text-[#3b2314] shadow-sm transition hover:bg-[#faf5f2] disabled:pointer-events-none disabled:opacity-35"
          >
            <ChevronUp className={`h-4 w-4 ${isRTL ? '-rotate-90' : 'rotate-90'}`} aria-hidden />
          </button>
        </div>

        <div className="flex flex-col items-center gap-3 border-t border-[#eee3db] pt-3 sm:flex-row sm:border-t-0 sm:pt-0">
          <p className="text-center text-sm text-[#7a6c63]">
            <span className="font-semibold text-[#3b2314]">
              {labels.showing} {startIndex} — {endIndex}
            </span>{' '}
            <span>
              {labels.of} {sortedRows.length}
            </span>
          </p>
          <div className="flex items-center gap-2">
            <label htmlFor="analysis-page-size" className="whitespace-nowrap text-sm text-[#7a6c63]">
              {labels.perPage}
            </label>
            <select
              id="analysis-page-size"
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(0);
              }}
              className="cursor-pointer rounded-xl border border-[#eadfd9] bg-[#faf5f2] px-3 py-2 text-sm font-semibold text-[#3b2314] shadow-sm outline-none transition focus:border-[#4b2f1a] focus:ring-2 focus:ring-[#4b2f1a]/15"
            >
              {PAGE_SIZES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
        </div>
      </nav>
    </div>
  );
}
