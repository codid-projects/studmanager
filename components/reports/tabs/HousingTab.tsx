"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useLocale } from "@/lib/locale-context";
import type { DashboardReport } from "@/lib/api/reports-client";
import { ChartCard, SERIES, StatGrid, StatTile, card, tooltipStyle } from "../report-ui";

export function HousingTab({ housing }: { housing: DashboardReport["housing"] }) {
  const { locale } = useLocale();
  const isRTL = locale === "ar";

  const occupancyRate = Math.round(housing.occupancyRate);
  const donut = [
    { name: isRTL ? "مشغول" : "Occupied", value: housing.occupied, color: SERIES[0] },
    { name: isRTL ? "متاح" : "Available", value: housing.available, color: SERIES[1] },
  ].filter((item) => item.value > 0);

  return (
    <div className="space-y-4">
      <StatGrid>
        <StatTile label={isRTL ? "السعة الكلية" : "Total capacity"} value={housing.totalCapacity} />
        <StatTile label={isRTL ? "مشغول" : "Occupied"} value={housing.occupied} accent={SERIES[0]} />
        <StatTile label={isRTL ? "متاح" : "Available"} value={housing.available} accent={SERIES[1]} />
        <StatTile
          label={isRTL ? "نسبة الإشغال" : "Occupancy rate"}
          value={`${occupancyRate}%`}
          accent={occupancyRate >= 90 ? SERIES[5] : SERIES[0]}
        />
      </StatGrid>

      <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-3">
        <ChartCard title={isRTL ? "الإشغال" : "Occupancy"} height="h-[200px]" isEmpty={!donut.length}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={donut}
                dataKey="value"
                innerRadius={52}
                outerRadius={78}
                paddingAngle={2}
                stroke="#fff"
                strokeWidth={2}
                isAnimationActive={false}
              >
                {donut.map((item) => (
                  <Cell key={item.name} fill={item.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <div className={`${card} lg:col-span-2`}>
          <h3 className="mb-4 text-sm font-bold text-[#3b2b20]">
            {isRTL ? "استخدام السعة" : "Capacity utilisation"}
          </h3>
          <div className="mb-2 flex items-baseline justify-between text-xs font-semibold text-[#6b5a4c]">
            <span>
              {housing.occupied} / {housing.totalCapacity} {isRTL ? "مكان" : "places"}
            </span>
            <span className="text-lg font-bold text-[#3b2b20]">{occupancyRate}%</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-[#f2ece6]">
            <div
              className="h-full rounded-full transition-[width] duration-500"
              style={{
                width: `${Math.min(100, Math.max(0, occupancyRate))}%`,
                background: occupancyRate >= 90 ? SERIES[5] : SERIES[0],
              }}
            />
          </div>
          <dl className="mt-5 grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
            <div className="rounded-lg bg-[#fbf7f3] px-3 py-2">
              <dt className="text-[#8a7a6d]">{isRTL ? "خيول مُسكنة" : "Horses housed"}</dt>
              <dd className="mt-1 text-base font-bold text-[#3b2b20]">{housing.totalHoused}</dd>
            </div>
            <div className="rounded-lg bg-[#fbf7f3] px-3 py-2">
              <dt className="text-[#8a7a6d]">{isRTL ? "أماكن شاغرة" : "Free places"}</dt>
              <dd className="mt-1 text-base font-bold text-[#3b2b20]">{housing.available}</dd>
            </div>
            <div className="rounded-lg bg-[#fbf7f3] px-3 py-2">
              <dt className="text-[#8a7a6d]">{isRTL ? "السعة الكلية" : "Total capacity"}</dt>
              <dd className="mt-1 text-base font-bold text-[#3b2b20]">{housing.totalCapacity}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
