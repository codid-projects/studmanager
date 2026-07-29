"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useLocale } from "@/lib/locale-context";
import type { BreedingReport, DashboardReport } from "@/lib/api/reports-client";
import {
  ChartCard,
  GRID,
  INK,
  RankedList,
  SERIES,
  StatGrid,
  StatTile,
  axisTick,
  localName,
  monthLabel,
  tooltipStyle,
} from "../report-ui";

export function useClinicalResults(breeding: BreedingReport | null, isRTL: boolean) {
  return useMemo(() => {
    const distribution = breeding?.mareSoundnessSummary?.clinicalResultDistribution;
    if (!distribution) return [];
    return [
      { name: isRTL ? "حامل" : "Pregnant", value: distribution.pregnant },
      { name: isRTL ? "فارغة" : "Empty", value: distribution.empty },
      { name: isRTL ? "توأم" : "Twins", value: distribution.pregnantWithTwins },
      { name: isRTL ? "امتصاص" : "Resorbing", value: distribution.resorbing },
      { name: isRTL ? "إجهاض" : "Aborted", value: distribution.aborted },
      { name: isRTL ? "تجميل" : "Vulvoplasty", value: distribution.needsVulvoplasty },
    ].filter((item) => item.value > 0);
  }, [breeding, isRTL]);
}

export function ClinicalResultsChart({ data, isRTL }: { data: Array<{ name: string; value: number }>; isRTL: boolean }) {
  return (
    <ResponsiveContainer>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 28, left: 8, bottom: 0 }}>
        <CartesianGrid horizontal={false} stroke={GRID} />
        <XAxis type="number" allowDecimals={false} tick={axisTick} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="name" width={78} tick={axisTick} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#f7f2ec" }} />
        <Bar
          dataKey="value"
          name={isRTL ? "الفحوصات" : "Exams"}
          fill={SERIES[0]}
          radius={[0, 4, 4, 0]}
          maxBarSize={18}
          label={{ position: "right", fontSize: 10, fill: INK }}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

interface BreedingTabProps {
  breeding: BreedingReport;
  dashboardBreeding: DashboardReport["breeding"] | null;
}

export function BreedingTab({ breeding, dashboardBreeding }: BreedingTabProps) {
  const { locale } = useLocale();
  const isRTL = locale === "ar";
  const mareSoundness = breeding.mareSoundnessSummary;
  const pregnancyOutcome = breeding.pregnancyOutcomeSummary;
  const breedingEvents = breeding.breedingEventSummary;
  const foalReport = breeding.foalReport;
  const cycleSummary = breeding.cycleSummary;

  const clinicalBars = useClinicalResults(breeding, isRTL);

  const stallionPregnancies = useMemo(
    () =>
      (mareSoundness?.pregnanciesByStallion ?? []).map((item) => ({
        name: localName(item, isRTL),
        value: item.count,
      })),
    [mareSoundness, isRTL],
  );

  const foalsByYear = useMemo(
    () => (foalReport?.byYear ?? []).slice().sort((a, b) => a.year - b.year).slice(-10),
    [foalReport],
  );

  const eventMix = useMemo(() => {
    return [
      { name: isRTL ? "تلقيح طبيعي" : "Natural cover", value: breedingEvents?.naturalCovers ?? 0 },
      { name: isRTL ? "سائل طازج" : "Fresh semen", value: breedingEvents?.freshSemenInseminations ?? 0 },
      { name: isRTL ? "سائل مجمد" : "Frozen semen", value: breedingEvents?.frozenSemenInseminations ?? 0 },
      { name: isRTL ? "نقل أجنة" : "Embryo transfer", value: breedingEvents?.embryoTransfers ?? 0 },
    ].filter((item) => item.value > 0);
  }, [breedingEvents, isRTL]);

  const cycleTrend = useMemo(
    () =>
      (cycleSummary?.monthlyTrend ?? []).map((item) => ({
        name: monthLabel(item.year, item.month, locale),
        value: item.count,
      })),
    [cycleSummary, locale],
  );
  const expectedBirthMonths = breeding.expectedBirthReport?.months ?? [];
  const incompleteMares = breeding.expectedBirthReport?.incompleteMares ?? [];
  const mareName = (mare: { mareName: string; mareNameAr: string }) =>
    (isRTL ? mare.mareNameAr || mare.mareName : mare.mareName || mare.mareNameAr) || "—";
  const dateRange = (start?: string | null, end?: string | null) => {
    if (!start && !end) return isRTL ? "غير مكتمل" : "Incomplete";
    const format = (value: string) => new Date(value).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-GB");
    if (start && end) return `${format(start)} - ${format(end)}`;
    return format((start || end) as string);
  };

  return (
    <div className="space-y-4">
      <StatGrid>
        <StatTile
          label={isRTL ? "فحوصات التبويض" : "Ovulation exams"}
          value={mareSoundness?.totalOvulationExaminations}
        />
        <StatTile
          label={isRTL ? "أفراس حوامل" : "Pregnant mares"}
          value={dashboardBreeding?.pregnantMares}
          accent={SERIES[1]}
        />
        <StatTile label={isRTL ? "أفراس غير حوامل" : "Non-pregnant mares"} value={dashboardBreeding?.nonPregnantMares} />
        <StatTile
          label={isRTL ? "معدل الولادات الحية" : "Live birth rate"}
          value={pregnancyOutcome ? `${Math.round(pregnancyOutcome.liveBirthRate)}%` : undefined}
          accent={SERIES[1]}
        />
        <StatTile
          label={isRTL ? "إجمالي عمليات التلقيح" : "Breeding events"}
          value={breedingEvents?.totalBreedingEvents}
        />
        <StatTile label={isRTL ? "أفراس ملقحة" : "Mares bred"} value={breedingEvents?.uniqueMaresBred} />
        <StatTile
          label={isRTL ? "إجمالي حالات الحمل" : "Total pregnancies"}
          value={pregnancyOutcome?.totalPregnancies}
        />
        <StatTile
          label={isRTL ? "حوامل حالياً" : "Currently pregnant"}
          value={breeding.expectedBirthReport?.currentlyPregnantMares ?? pregnancyOutcome?.currentlyPregnant}
          accent={SERIES[1]}
        />
        <StatTile
          label={isRTL ? "ولادات متوقعة هذا الشهر" : "Expected this month"}
          value={pregnancyOutcome?.expectedFoalingThisMonth}
          accent={SERIES[2]}
        />
        <StatTile
          label={isRTL ? "ولادات حية" : "Live births"}
          value={pregnancyOutcome?.liveBirths}
        />
      </StatGrid>

      <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
        <ChartCard
          title={isRTL ? "الولادات المتوقعة حسب الشهر" : "Expected births by month"}
          plot={false}
          isEmpty={!expectedBirthMonths.length}
          height="min-h-[220px]"
        >
          <div className="space-y-3">
            {expectedBirthMonths.map((month) => (
              <div key={`${month.year}-${month.month}`} className="rounded-xl bg-[#fbf7f3] p-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="font-bold text-[#3b2b20]">{monthLabel(month.year, month.month, locale)}</span>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-[#6b5a4c]">
                    {month.expectedBirths}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {month.mares.map((mare) => (
                    <div key={`${month.year}-${month.month}-${mare.profileId}`} className="flex items-center justify-between gap-2 text-xs">
                      <span className="min-w-0 truncate font-semibold text-[#3b2b20]">{mareName(mare)}</span>
                      <span className="shrink-0 text-[#8a7a6d]">
                        {dateRange(mare.expectedFoalingStartDate, mare.expectedFoalingEndDate)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard
          title={isRTL ? "بيانات حمل غير مكتملة" : "Incomplete pregnancy data"}
          plot={false}
          isEmpty={!incompleteMares.length}
          height="min-h-[220px]"
        >
          <RankedList
            items={incompleteMares.map((mare) => ({
              key: mare.profileId,
              label: mareName(mare),
              value: isRTL ? "تاريخ متوقع ناقص" : "Missing date",
            }))}
          />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-3">
        <ChartCard
          title={isRTL ? "نتائج الفحوصات الإكلينيكية" : "Clinical results"}
          height="h-[190px]"
          isEmpty={!clinicalBars.length}
        >
          <ClinicalResultsChart data={clinicalBars} isRTL={isRTL} />
        </ChartCard>

        <ChartCard
          title={isRTL ? "حالات الحمل حسب الفحل" : "Pregnancies by stallion"}
          height="h-[190px]"
          isEmpty={!stallionPregnancies.length}
        >
          <ResponsiveContainer>
            <BarChart data={stallionPregnancies} layout="vertical" margin={{ top: 0, right: 28, left: 8, bottom: 0 }}>
              <CartesianGrid horizontal={false} stroke={GRID} />
              <XAxis type="number" allowDecimals={false} tick={axisTick} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={92} tick={axisTick} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#f7f2ec" }} />
              <Bar
                dataKey="value"
                name={isRTL ? "حالات الحمل" : "Pregnancies"}
                fill={SERIES[1]}
                radius={[0, 4, 4, 0]}
                maxBarSize={18}
                label={{ position: "right", fontSize: 10, fill: INK }}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title={isRTL ? "المواليد المسجلة حسب السنة" : "Registered foals by year"}
          height="h-[190px]"
          minWidth={foalsByYear.length > 6 ? 340 : undefined}
          isEmpty={!foalsByYear.length}
        >
          <ResponsiveContainer>
            <BarChart data={foalsByYear} margin={{ top: 4, right: 8, left: isRTL ? 8 : -18, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={GRID} />
              <XAxis dataKey="year" tick={axisTick} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={axisTick} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#f7f2ec" }} />
              <Bar dataKey="count" name={isRTL ? "المواليد" : "Foals"} fill={SERIES[4]} radius={[4, 4, 0, 0]} maxBarSize={26} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
        <ChartCard
          title={isRTL ? "أنواع التلقيح" : "Breeding method mix"}
          height="h-[200px]"
          isEmpty={!eventMix.length}
        >
          <ResponsiveContainer>
            <BarChart data={eventMix} layout="vertical" margin={{ top: 0, right: 28, left: 8, bottom: 0 }}>
              <CartesianGrid horizontal={false} stroke={GRID} />
              <XAxis type="number" allowDecimals={false} tick={axisTick} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={100} tick={axisTick} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#f7f2ec" }} />
              <Bar
                dataKey="value"
                name={isRTL ? "العمليات" : "Events"}
                fill={SERIES[3]}
                radius={[0, 4, 4, 0]}
                maxBarSize={18}
                label={{ position: "right", fontSize: 10, fill: INK }}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title={isRTL ? "الدورات التناسلية شهرياً" : "Breeding cycles by month"}
          height="h-[200px]"
          minWidth={cycleTrend.length > 6 ? 380 : undefined}
          isEmpty={cycleTrend.length < 2}
          action={
            <span className="shrink-0 text-[11px] font-semibold text-[#8a7a6d]">
              {isRTL ? "مفتوحة" : "Open"} {cycleSummary?.openCycles ?? 0} · {isRTL ? "مغلقة" : "Closed"}{" "}
              {cycleSummary?.closedCycles ?? 0}
            </span>
          }
        >
          <ResponsiveContainer>
            <LineChart data={cycleTrend} margin={{ top: 4, right: 12, left: isRTL ? 8 : -18, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={GRID} />
              <XAxis dataKey="name" tick={axisTick} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={axisTick} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line
                type="monotone"
                dataKey="value"
                name={isRTL ? "الدورات" : "Cycles"}
                stroke={SERIES[4]}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <StatGrid>
        <StatTile label={isRTL ? "تسجيلات المواليد" : "Foal registrations"} value={foalReport?.totalFoalRegistrations} />
        <StatTile label={isRTL ? "مفطوم" : "Weaned"} value={foalReport?.weaned} />
        <StatTile label={isRTL ? "غير مفطوم" : "Not weaned"} value={foalReport?.nonWeaned} />
        <StatTile
          label={isRTL ? "متوسط مدة الدورة" : "Avg cycle length"}
          value={cycleSummary ? `${Math.round(cycleSummary.averageDurationDays)} ${isRTL ? "يوم" : "d"}` : undefined}
        />
      </StatGrid>
    </div>
  );
}
