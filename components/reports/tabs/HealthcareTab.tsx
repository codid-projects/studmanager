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
import type { DashboardReport, HealthcareReport } from "@/lib/api/reports-client";
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

export function useHealthTrend(healthcare: HealthcareReport | null, locale: string) {
  return useMemo(
    () =>
      (healthcare?.monthlyTrend ?? []).map((item) => ({
        name: monthLabel(item.year, item.month, locale),
        value: item.count,
      })),
    [healthcare, locale],
  );
}

export function HealthTrendChart({ data, isRTL }: { data: Array<{ name: string; value: number }>; isRTL: boolean }) {
  return (
    <ResponsiveContainer>
      <LineChart data={data} margin={{ top: 4, right: 12, left: isRTL ? 8 : -18, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={GRID} />
        <XAxis dataKey="name" tick={axisTick} axisLine={false} tickLine={false} />
        <YAxis allowDecimals={false} tick={axisTick} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Line
          type="monotone"
          dataKey="value"
          name={isRTL ? "السجلات" : "Records"}
          stroke={SERIES[0]}
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

interface HealthcareTabProps {
  healthcare: HealthcareReport;
  veterinarians: DashboardReport["veterinarians"] | null;
}

export function HealthcareTab({ healthcare, veterinarians }: HealthcareTabProps) {
  const { locale } = useLocale();
  const isRTL = locale === "ar";

  const byCategory = useMemo(
    () =>
      healthcare.byCategory.map((item) => ({
        name: (isRTL ? item.categoryAr || item.category : item.category) || "—",
        count: item.count,
        cost: item.totalCost,
      })),
    [healthcare, isRTL],
  );

  const trend = useHealthTrend(healthcare, locale);

  const severity = useMemo(
    () => healthcare.injurySeverityDistribution.map((item) => ({ name: localName(item, isRTL), value: item.count })),
    [healthcare, isRTL],
  );

  const vaccinations = useMemo(
    () =>
      healthcare.vaccinationTypeDistribution
        .slice(0, 8)
        .map((item, index) => ({ key: index, label: localName(item, isRTL), value: item.count })),
    [healthcare, isRTL],
  );

  const topHorses = useMemo(
    () =>
      healthcare.topTreatedHorses.slice(0, 7).map((horse) => ({
        key: horse.horseId,
        label:
          (isRTL ? horse.horseNameAr || horse.horseName : horse.horseName || horse.horseNameAr) || `#${horse.horseId}`,
        value: horse.visitCount,
      })),
    [healthcare, isRTL],
  );

  const vets = useMemo(
    () =>
      (veterinarians?.topVeterinarians ?? [])
        .slice(0, 9)
        .map((vet, index) => ({ key: index, label: vet.name, value: vet.total })),
    [veterinarians],
  );

  return (
    <div className="space-y-4">
      <StatGrid>
        <StatTile label={isRTL ? "إجمالي السجلات" : "Total records"} value={healthcare.totalRecords} />
        <StatTile label={isRTL ? "خيول عولجت" : "Horses treated"} value={healthcare.horsesTreated} />
        <StatTile label={isRTL ? "إجمالي التكلفة" : "Total cost"} value={healthcare.totalCost.toLocaleString()} />
        <StatTile
          label={isRTL ? "متوسط التكلفة للسجل" : "Avg cost / record"}
          value={Math.round(healthcare.avgCostPerRecord).toLocaleString()}
        />
      </StatGrid>

      <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-3">
        <ChartCard
          title={isRTL ? "السجلات حسب القسم" : "Records by category"}
          className="lg:col-span-2"
          height="h-[220px]"
          minWidth={byCategory.length > 5 ? 460 : undefined}
          isEmpty={!byCategory.length}
        >
          <ResponsiveContainer>
            <BarChart data={byCategory} margin={{ top: 4, right: 8, left: isRTL ? 8 : -18, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={GRID} />
              <XAxis
                dataKey="name"
                interval={0}
                angle={-18}
                height={52}
                tick={{ fontSize: 9, fill: axisTick.fill }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis allowDecimals={false} tick={axisTick} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#f7f2ec" }} />
              <Bar dataKey="count" name={isRTL ? "السجلات" : "Records"} fill={SERIES[0]} radius={[4, 4, 0, 0]} maxBarSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={isRTL ? "أكثر الخيول علاجاً" : "Top treated horses"} height="" plot={false}>
          <RankedList items={topHorses} unit={isRTL ? "زيارة" : "visits"} />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
        <ChartCard
          title={isRTL ? "التكلفة حسب القسم" : "Cost by category"}
          height="h-[220px]"
          minWidth={byCategory.length > 5 ? 460 : undefined}
          isEmpty={!byCategory.length}
        >
          <ResponsiveContainer>
            <BarChart data={byCategory} margin={{ top: 4, right: 8, left: isRTL ? 8 : -8, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={GRID} />
              <XAxis
                dataKey="name"
                interval={0}
                angle={-18}
                height={52}
                tick={{ fontSize: 9, fill: axisTick.fill }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis tick={axisTick} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#f7f2ec" }} />
              <Bar dataKey="cost" name={isRTL ? "التكلفة" : "Cost"} fill={SERIES[2]} radius={[4, 4, 0, 0]} maxBarSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title={isRTL ? "شدة الإصابات" : "Injury severity"}
          height="h-[220px]"
          isEmpty={!severity.length}
        >
          <ResponsiveContainer>
            <BarChart data={severity} layout="vertical" margin={{ top: 0, right: 28, left: 8, bottom: 0 }}>
              <CartesianGrid horizontal={false} stroke={GRID} />
              <XAxis type="number" allowDecimals={false} tick={axisTick} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={92} tick={axisTick} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#f7f2ec" }} />
              <Bar
                dataKey="value"
                name={isRTL ? "الإصابات" : "Injuries"}
                fill={SERIES[5]}
                radius={[0, 4, 4, 0]}
                maxBarSize={18}
                label={{ position: "right", fontSize: 10, fill: INK }}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard
        title={isRTL ? "الاتجاه الشهري للسجلات" : "Monthly records trend"}
        height="h-[200px]"
        minWidth={trend.length > 6 ? 460 : undefined}
        isEmpty={trend.length < 2}
      >
        <HealthTrendChart data={trend} isRTL={isRTL} />
      </ChartCard>

      <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
        <ChartCard title={isRTL ? "أنواع التطعيمات" : "Vaccination types"} height="" plot={false}>
          <RankedList items={vaccinations} unit={isRTL ? "سجل" : "records"} />
        </ChartCard>
        <ChartCard title={isRTL ? "الأطباء البيطريون" : "Veterinarians"} height="" plot={false}>
          <RankedList items={vets} unit={isRTL ? "سجل" : "records"} />
        </ChartCard>
      </div>
    </div>
  );
}
