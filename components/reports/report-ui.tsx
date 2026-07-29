"use client";

import type { ReactNode } from "react";
import { useTranslation } from "@/lib/locale-context";
import type { NameCount } from "@/lib/api/reports-client";

// Validated categorical palette (dataviz slots, fixed order — never cycled).
export const SERIES = ["#2a78d6", "#1baf7a", "#eda100", "#008300", "#4a3aa7", "#e34948", "#e87ba4", "#eb6834"];
export const INK = "#3b2b20";
export const INK_MUTED = "#8a7a6d";
export const GRID = "#efe9e3";

export const card = "bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-[#f1e9e2]";

export const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid #ece2da",
  fontSize: 12,
  fontFamily: "inherit",
};

export const axisTick = { fontSize: 10, fill: INK_MUTED };

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-base font-bold text-[#3b2b20] sm:text-lg">{children}</h2>;
}

export function StatTile({
  label,
  value,
  accent,
  hint,
}: {
  label: string;
  value: ReactNode;
  accent?: string;
  hint?: string;
}) {
  return (
    <div className={`${card} flex min-h-20 flex-col justify-between sm:min-h-24`}>
      <p className="text-[11px] font-semibold leading-tight text-[#8a7a6d] sm:text-xs">{label}</p>
      <p className="mt-2 text-2xl font-bold leading-none sm:text-3xl" style={{ color: accent ?? INK }}>
        {value ?? "—"}
      </p>
      {hint ? <p className="mt-1 text-[10px] text-[#a2938a] sm:text-[11px]">{hint}</p> : null}
    </div>
  );
}

/** 2-up on phones, 4-up from large screens — the standard KPI row for every tab. */
export function StatGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">{children}</div>;
}

export function EmptyState({ label }: { label?: string }) {
  const { t } = useTranslation();
  return <p className="py-10 text-center text-xs text-[#8a7a6d]">{label ?? t("common.noRecordsFound")}</p>;
}

interface ChartCardProps {
  title: string;
  children: ReactNode;
  /** Rendered opposite the title (year pickers, totals…). */
  action?: ReactNode;
  className?: string;
  /** Responsive plot height — shorter on phones by default. */
  height?: string;
  /** Below this width the plot scrolls horizontally instead of squashing. */
  minWidth?: number;
  isEmpty?: boolean;
  emptyLabel?: string;
  /**
   * Recharts always draws its axes left-to-right, so plot bodies are pinned to
   * LTR — under `dir="rtl"` the axis labels are anchored the wrong way and land
   * on top of the bars. Set false for cards holding plain HTML (lists, legends)
   * that must follow the page direction.
   */
  plot?: boolean;
}

export function ChartCard({
  title,
  children,
  action,
  className = "",
  height = "h-[190px] sm:h-[220px]",
  minWidth,
  isEmpty,
  emptyLabel,
  plot = true,
}: ChartCardProps) {
  return (
    <div className={`${card} ${className}`}>
      <div className="mb-3 flex items-start justify-between gap-2">
        <h3 className="text-sm font-bold text-[#3b2b20]">{title}</h3>
        {action}
      </div>
      {isEmpty ? (
        <EmptyState label={emptyLabel} />
      ) : minWidth ? (
        <div className="overflow-x-auto">
          <div className={height} style={{ minWidth }} dir={plot ? "ltr" : undefined}>
            {children}
          </div>
        </div>
      ) : (
        <div className={height} dir={plot ? "ltr" : undefined}>
          {children}
        </div>
      )}
    </div>
  );
}

/** Name/value rows used wherever a ranked list beats a chart. */
export function RankedList({
  items,
  unit,
}: {
  items: Array<{ key: string | number; label: string; value: ReactNode }>;
  unit?: string;
}) {
  if (!items.length) return <EmptyState />;
  return (
    <ul className="space-y-2 text-xs">
      {items.map((item) => (
        <li key={item.key} className="flex items-center justify-between gap-2 rounded-lg bg-[#fbf7f3] px-3 py-2">
          <span className="min-w-0 truncate font-semibold text-[#3b2b20]">{item.label}</span>
          <span className="shrink-0 rounded-full bg-white px-2 py-0.5 font-bold text-[#6b5a4c]">
            {item.value}
            {unit ? ` ${unit}` : ""}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function localName(item: NameCount, isRTL: boolean) {
  return (isRTL ? item.nameAr || item.name : item.name || item.nameAr) || "—";
}

export function monthLabel(year: number, month: number, locale: string) {
  return new Date(year, month - 1, 1).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-GB", {
    month: "short",
    year: "2-digit",
  });
}
