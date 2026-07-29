"use client";

import type { ReactNode } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import type {
  BreedingReport,
  DashboardReport,
  HealthcareReport,
  HorseReport,
  MonthlyPnL,
} from "@/lib/api/reports-client";
import { SERIES, SectionTitle, StatGrid, StatTile, card } from "../report-ui";
import type { ReportTabId } from "../ReportsTabs";
import { HerdCompositionChart, useHerdComposition } from "./HerdTab";
import { ClinicalResultsChart, useClinicalResults } from "./BreedingTab";
import { HealthTrendChart, useHealthTrend } from "./HealthcareTab";
import { PnlBarChart, usePnlSeries } from "./FinanceTab";

interface OverviewTabProps {
  dashboard: DashboardReport | null;
  horses: HorseReport | null;
  breeding: BreedingReport | null;
  healthcare: HealthcareReport | null;
  pnl: MonthlyPnL[];
  financeYear: number;
  onOpenTab: (tab: ReportTabId) => void;
}

/** Summary card that previews one section and links through to its own tab. */
function SectionPreview({
  title,
  tab,
  onOpenTab,
  isEmpty,
  height = "h-[190px]",
  plot = true,
  children,
}: {
  title: string;
  tab: ReportTabId;
  onOpenTab: (tab: ReportTabId) => void;
  isEmpty?: boolean;
  height?: string;
  /** See ChartCard — recharts plots must stay LTR even on the Arabic page. */
  plot?: boolean;
  children: ReactNode;
}) {
  const { locale, direction } = useLocale();
  const isRTL = locale === "ar";
  const Arrow = direction === "rtl" ? ArrowLeft : ArrowRight;

  return (
    <div className={card}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-[#3b2b20]">{title}</h3>
        <button
          type="button"
          onClick={() => onOpenTab(tab)}
          className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-[#6b5a4c] transition hover:bg-[#fbf6f2] hover:text-[#3b2b20]"
        >
          {isRTL ? "التفاصيل" : "Details"}
          <Arrow className="h-3.5 w-3.5" />
        </button>
      </div>
      {isEmpty ? (
        <p className="py-10 text-center text-xs text-[#8a7a6d]">{isRTL ? "لا توجد بيانات" : "No data"}</p>
      ) : (
        <div className={height} dir={plot ? "ltr" : undefined}>
          {children}
        </div>
      )}
    </div>
  );
}

export function OverviewTab({
  dashboard,
  horses,
  breeding,
  healthcare,
  pnl,
  financeYear,
  onOpenTab,
}: OverviewTabProps) {
  const { locale } = useLocale();
  const isRTL = locale === "ar";

  const composition = useHerdComposition(horses, isRTL);
  const clinicalBars = useClinicalResults(breeding, isRTL);
  const healthTrend = useHealthTrend(healthcare, locale);
  const pnlData = usePnlSeries(pnl, locale);

  const netProfit = pnl.reduce((total, item) => total + item.profit, 0);

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <SectionTitle>{isRTL ? "المؤشرات الرئيسية" : "Key figures"}</SectionTitle>
        <StatGrid>
          <StatTile label={isRTL ? "إجمالي الخيول" : "Total horses"} value={horses?.totalHorses ?? dashboard?.horses.totalHorses} />
          <StatTile label={isRTL ? "متاح" : "Available"} value={horses?.available ?? dashboard?.horses.available} accent={SERIES[1]} />
          <StatTile
            label={isRTL ? "نسبة الإشغال" : "Occupancy rate"}
            value={dashboard ? `${Math.round(dashboard.housing.occupancyRate)}%` : undefined}
            accent={SERIES[0]}
          />
          <StatTile label={isRTL ? "أفراس حوامل" : "Pregnant mares"} value={dashboard?.breeding?.pregnantMares} accent={SERIES[1]} />
          <StatTile
            label={isRTL ? "معدل الولادات الحية" : "Live birth rate"}
            value={breeding?.pregnancyOutcomeSummary ? `${Math.round(breeding.pregnancyOutcomeSummary.liveBirthRate)}%` : undefined}
          />
          <StatTile label={isRTL ? "سجلات صحية" : "Health records"} value={healthcare?.totalRecords} />
          <StatTile
            label={isRTL ? "تكلفة الرعاية" : "Healthcare cost"}
            value={healthcare ? Math.round(healthcare.totalCost).toLocaleString() : undefined}
          />
          <StatTile
            label={isRTL ? `صافي الربح ${financeYear}` : `Net profit ${financeYear}`}
            value={pnl.length ? Math.round(netProfit).toLocaleString() : undefined}
            accent={netProfit >= 0 ? SERIES[3] : SERIES[5]}
          />
        </StatGrid>
      </div>

      <div className="space-y-3">
        <SectionTitle>{isRTL ? "ملخص الأقسام" : "Section summaries"}</SectionTitle>
        <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
          <SectionPreview
            title={isRTL ? "تكوين القطيع" : "Herd composition"}
            tab="herd"
            onOpenTab={onOpenTab}
            isEmpty={!composition.length}
            height=""
            plot={false}
          >
            <HerdCompositionChart data={composition} />
          </SectionPreview>

          <SectionPreview
            title={isRTL ? "نتائج الفحوصات الإكلينيكية" : "Clinical results"}
            tab="breeding"
            onOpenTab={onOpenTab}
            isEmpty={!clinicalBars.length}
          >
            <ClinicalResultsChart data={clinicalBars} isRTL={isRTL} />
          </SectionPreview>

          <SectionPreview
            title={isRTL ? "الاتجاه الشهري للسجلات" : "Monthly records trend"}
            tab="healthcare"
            onOpenTab={onOpenTab}
            isEmpty={healthTrend.length < 2}
          >
            <HealthTrendChart data={healthTrend} isRTL={isRTL} />
          </SectionPreview>

          <SectionPreview
            title={isRTL ? `الإيرادات والمصروفات ${financeYear}` : `Revenue & expenses ${financeYear}`}
            tab="finance"
            onOpenTab={onOpenTab}
            isEmpty={!pnlData.length}
            height="h-[190px]"
          >
            <PnlBarChart data={pnlData} isRTL={isRTL} />
          </SectionPreview>
        </div>
      </div>

      {dashboard ? (
        <div className="space-y-3">
          <SectionTitle>{isRTL ? "الإسكان" : "Housing"}</SectionTitle>
          <StatGrid>
            <StatTile label={isRTL ? "السعة الكلية" : "Total capacity"} value={dashboard.housing.totalCapacity} />
            <StatTile label={isRTL ? "مشغول" : "Occupied"} value={dashboard.housing.occupied} />
            <StatTile label={isRTL ? "متاح" : "Available"} value={dashboard.housing.available} />
            <StatTile
              label={isRTL ? "أطباء بيطريون" : "Veterinarians"}
              value={dashboard.veterinarians.totalVeterinarians}
            />
          </StatGrid>
        </div>
      ) : null}
    </div>
  );
}
