"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useLocale } from "@/lib/locale-context";
import type { HorseReport } from "@/lib/api/reports-client";
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
  tooltipStyle,
} from "../report-ui";

export function useHerdComposition(horses: HorseReport | null, isRTL: boolean) {
  return useMemo(() => {
    if (!horses) return [];
    return [
      { name: isRTL ? "فحول" : "Stallions", value: horses.stallions },
      { name: isRTL ? "أفراس" : "Mares", value: horses.mares },
      { name: isRTL ? "أمهار ذكور" : "Colts", value: horses.colts },
      { name: isRTL ? "أمهار إناث" : "Fillies", value: horses.fillies },
      { name: isRTL ? "مواليد" : "Foals", value: horses.foals },
    ].filter((item) => item.value > 0);
  }, [horses, isRTL]);
}

export function HerdCompositionChart({ data }: { data: Array<{ name: string; value: number }> }) {
  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
      <div className="h-[160px] w-[160px] shrink-0 sm:h-[170px] sm:w-[170px]">
        <ResponsiveContainer>
          <PieChart>
            {/* Entry animation is disabled: the pie re-renders when report data lands and
                recharts leaves the sectors collapsed mid-tween. */}
            <Pie
              data={data}
              dataKey="value"
              innerRadius={45}
              outerRadius={72}
              paddingAngle={2}
              stroke="#fff"
              strokeWidth={2}
              isAnimationActive={false}
            >
              {data.map((_, index) => (
                <Cell key={index} fill={SERIES[index % SERIES.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="w-full min-w-0 flex-1 space-y-1.5 text-xs">
        {data.map((item, index) => (
          <li key={item.name} className="flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-1.5 text-[#6b5a4c]">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: SERIES[index % SERIES.length] }} />
              <span className="truncate">{item.name}</span>
            </span>
            <span className="font-bold text-[#3b2b20]">{item.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function HerdTab({ horses }: { horses: HorseReport }) {
  const { locale } = useLocale();
  const isRTL = locale === "ar";

  const composition = useHerdComposition(horses, isRTL);

  const ageBars = useMemo(() => {
    const distribution = horses.ageDistribution;
    return [
      { name: isRTL ? "أقل من سنة" : "< 1y", value: distribution.underOneYear },
      { name: isRTL ? "1-3 سنوات" : "1–3y", value: distribution.oneToThreeYears },
      { name: isRTL ? "3-5 سنوات" : "3–5y", value: distribution.threeToFiveYears },
      { name: isRTL ? "5-10 سنوات" : "5–10y", value: distribution.fiveToTenYears },
      { name: isRTL ? "أكثر من 10" : "> 10y", value: distribution.overTenYears },
    ];
  }, [horses, isRTL]);

  const birthYears = useMemo(
    () => horses.birthYearDistribution.slice().sort((a, b) => a.year - b.year).slice(-12),
    [horses],
  );

  const colors = useMemo(
    () => horses.colorDistribution.slice(0, 8).map((item) => ({ name: localName(item, isRTL), value: item.count })),
    [horses, isRTL],
  );

  const strains = useMemo(
    () =>
      horses.strainDistribution
        .slice(0, 8)
        .map((item, index) => ({ key: index, label: localName(item, isRTL), value: item.count })),
    [horses, isRTL],
  );

  return (
    <div className="space-y-4">
      <StatGrid>
        <StatTile label={isRTL ? "إجمالي الخيول" : "Total horses"} value={horses.totalHorses} />
        <StatTile label={isRTL ? "متاح" : "Available"} value={horses.available} accent={SERIES[1]} />
        <StatTile label={isRTL ? "مباع" : "Sold"} value={horses.sold} />
        <StatTile label={isRTL ? "زائر" : "Visitors"} value={horses.visitors} />
        <StatTile label={isRTL ? "فحول" : "Stallions"} value={horses.stallions} />
        <StatTile label={isRTL ? "أفراس" : "Mares"} value={horses.mares} />
        <StatTile label={isRTL ? "مواليد" : "Foals"} value={horses.foals} />
        <StatTile label={isRTL ? "نافق" : "Deceased"} value={horses.deceased} />
      </StatGrid>

      <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-3">
        <ChartCard
          title={isRTL ? "تكوين القطيع" : "Herd composition"}
          height=""
          plot={false}
          isEmpty={!composition.length}
        >
          <HerdCompositionChart data={composition} />
        </ChartCard>

        <ChartCard title={isRTL ? "التوزيع العمري" : "Age distribution"} height="h-[180px]">
          <ResponsiveContainer>
            <BarChart data={ageBars} margin={{ top: 4, right: 8, left: isRTL ? 8 : -18, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={GRID} />
              <XAxis dataKey="name" tick={axisTick} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={axisTick} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#f7f2ec" }} />
              <Bar dataKey="value" name={isRTL ? "الخيول" : "Horses"} fill={SERIES[0]} radius={[4, 4, 0, 0]} maxBarSize={34} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title={isRTL ? "المواليد حسب السنة" : "Births by year"}
          height="h-[180px]"
          minWidth={birthYears.length > 6 ? 340 : undefined}
          isEmpty={!birthYears.length}
        >
          <ResponsiveContainer>
            <BarChart data={birthYears} margin={{ top: 4, right: 8, left: isRTL ? 8 : -18, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={GRID} />
              <XAxis dataKey="year" tick={axisTick} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={axisTick} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#f7f2ec" }} />
              <Bar dataKey="count" name={isRTL ? "المواليد" : "Births"} fill={SERIES[1]} radius={[4, 4, 0, 0]} maxBarSize={26} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
        <ChartCard
          title={isRTL ? "توزيع الألوان" : "Colour distribution"}
          height="h-[220px]"
          isEmpty={!colors.length}
        >
          <ResponsiveContainer>
            <BarChart data={colors} layout="vertical" margin={{ top: 0, right: 28, left: 8, bottom: 0 }}>
              <CartesianGrid horizontal={false} stroke={GRID} />
              <XAxis type="number" allowDecimals={false} tick={axisTick} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={86} tick={axisTick} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#f7f2ec" }} />
              <Bar
                dataKey="value"
                name={isRTL ? "الخيول" : "Horses"}
                fill={SERIES[2]}
                radius={[0, 4, 4, 0]}
                maxBarSize={18}
                label={{ position: "right", fontSize: 10, fill: INK }}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={isRTL ? "توزيع الرسن" : "Strain distribution"} height="" plot={false}>
          <RankedList items={strains} unit={isRTL ? "خيل" : "horses"} />
        </ChartCard>
      </div>
    </div>
  );
}
