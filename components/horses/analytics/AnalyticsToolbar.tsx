'use client';

import { FC, useEffect, useRef, useState } from 'react';
import { ChevronDown, FileSpreadsheet, FileText, Printer, Search } from 'lucide-react';
import { useLocale } from '@/lib/locale-context';

interface AnalyticsSearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

export const AnalyticsSearchField: FC<AnalyticsSearchFieldProps> = ({
  value,
  onChange,
  placeholder,
}) => {
  const { direction } = useLocale();
  const isRTL = direction === 'rtl';

  return (
    <label className="relative flex min-w-[200px] max-w-full flex-1 sm:max-w-[260px]">
      <span className="sr-only">{placeholder}</span>
      <Search
        className={`pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-[#a5947f] ${
          isRTL ? 'right-3' : 'left-3'
        }`}
        aria-hidden
      />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        dir={direction}
        className={`h-11 w-full rounded-xl border border-[#eadfd9] bg-white text-sm shadow-sm outline-none transition focus:border-[#4b2f1a] focus:ring-2 focus:ring-[#4b2f1a]/15 ${
          isRTL ? 'pr-10 pl-3 text-right' : 'pl-10 pr-3 text-left'
        }`}
      />
    </label>
  );
};

interface AnalyticsExportMenuProps {
  label: string;
  pdfLabel: string;
  excelLabel: string;
  onExportPdf: () => void;
  onExportExcel: () => void;
}

export const AnalyticsExportMenu: FC<AnalyticsExportMenuProps> = ({
  label,
  pdfLabel,
  excelLabel,
  onExportPdf,
  onExportExcel,
}) => {
  const { direction } = useLocale();
  const isRTL = direction === 'rtl';
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const runAndClose = (action: () => void) => () => {
    setOpen(false);
    action();
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#eadfd9] bg-white px-4 py-2 text-sm font-semibold text-[#3b2314] shadow-sm transition hover:bg-[#faf5f2]"
      >
        {label}
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>

      {open ? (
        <ul
          role="menu"
          className={`absolute top-[calc(100%+0.35rem)] z-20 w-44 rounded-xl border border-[#eadfd9] bg-white p-2 text-sm text-[#3b2314] shadow-lg ${
            isRTL ? 'left-0 text-right' : 'right-0 text-left'
          }`}
        >
          <li role="none">
            <button
              type="button"
              role="menuitem"
              onClick={runAndClose(onExportPdf)}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 font-medium transition hover:bg-[#faf5f2] ${
                isRTL ? 'flex-row-reverse' : ''
              }`}
            >
              <FileText className="h-4 w-4 shrink-0 text-[#8b6f47]" aria-hidden />
              {pdfLabel}
            </button>
          </li>
          <li role="none">
            <button
              type="button"
              role="menuitem"
              onClick={runAndClose(onExportExcel)}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 font-medium transition hover:bg-[#faf5f2] ${
                isRTL ? 'flex-row-reverse' : ''
              }`}
            >
              <FileSpreadsheet className="h-4 w-4 shrink-0 text-[#8b6f47]" aria-hidden />
              {excelLabel}
            </button>
          </li>
        </ul>
      ) : null}
    </div>
  );
};

interface AnalyticsPrintButtonProps {
  label: string;
  onPrint: () => void;
}

export const AnalyticsPrintButton: FC<AnalyticsPrintButtonProps> = ({ label, onPrint }) => (
  <button
    type="button"
    onClick={onPrint}
    title={label}
    aria-label={label}
    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#eadfd9] bg-white text-[#3b2314] shadow-sm transition hover:bg-[#faf5f2]"
  >
    <Printer className="h-5 w-5" aria-hidden />
  </button>
);
