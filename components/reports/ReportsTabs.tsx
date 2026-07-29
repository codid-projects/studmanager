"use client";

import { useLocale } from "@/lib/locale-context";

export const REPORT_TABS = [
  { id: "overview", labelAr: "نظرة عامة", labelEn: "Overview" },
  { id: "herd", labelAr: "القطيع", labelEn: "Herd" },
  { id: "housing", labelAr: "الإسكان", labelEn: "Housing" },
  { id: "breeding", labelAr: "التناسل", labelEn: "Breeding" },
  { id: "healthcare", labelAr: "الرعاية الصحية", labelEn: "Healthcare" },
  { id: "finance", labelAr: "المالية", labelEn: "Finance" },
] as const;

export type ReportTabId = (typeof REPORT_TABS)[number]["id"];

interface ReportsTabsProps {
  activeTab: ReportTabId;
  onTabChange: (tab: ReportTabId) => void;
}

/**
 * Section switcher for the reports dashboard. Scrolls horizontally on phones and
 * wraps once there is room, mirroring the pill-tab style used across the app.
 */
export function ReportsTabs({ activeTab, onTabChange }: ReportsTabsProps) {
  const { locale, direction } = useLocale();
  const isRTL = locale === "ar";

  return (
    <div
      role="tablist"
      aria-label={isRTL ? "أقسام التقارير" : "Report sections"}
      dir={direction}
      className="hide-scrollbar flex items-center gap-2 overflow-x-auto pb-1 scroll-smooth sm:flex-wrap sm:overflow-visible sm:pb-0"
    >
      {REPORT_TABS.map(({ id, labelAr, labelEn }) => {
        const isActive = id === activeTab;

        return (
          <button
            key={id}
            type="button"
            role="tab"
            id={`reports-tab-${id}`}
            aria-selected={isActive}
            aria-controls={`reports-panel-${id}`}
            onClick={() => onTabChange(id)}
            className={`flex-shrink-0 whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-semibold transition-colors sm:px-5 sm:text-sm ${
              isActive
                ? "bg-[#3d2a1b] text-white"
                : "border border-gray-100 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            {isRTL ? labelAr : labelEn}
          </button>
        );
      })}
    </div>
  );
}
