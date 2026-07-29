"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useLocale } from "@/lib/locale-context";
import type { MonthlyPnL } from "@/lib/api/reports-client";
import { ChartCard, GRID, SERIES, StatGrid, StatTile, axisTick, monthLabel, tooltipStyle } from "../report-ui";

export interface PnlPoint {
  name: string;
  revenue: number;
  expense: number;
  profit: number;
}

export function usePnlSeries(pnl: MonthlyPnL[], locale: string): PnlPoint[] {
  return useMemo(
    () =>
      pnl
        .slice()
        .sort((a, b) => a.month - b.month)
        .map((item) => ({
          name: monthLabel(item.year, item.month, locale),
          revenue: item.revenue,
          expense: item.expense,
          profit: item.profit,
        })),
    [pnl, locale],
  );
}

export function PnlBarChart({ data, isRTL }: { data: PnlPoint[]; isRTL: boolean }) {
  return (
    <ResponsiveContainer>
      <BarChart data={data} margin={{ top: 4, right: 12, left: isRTL ? 8 : -8, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={GRID} />
        <XAxis dataKey="name" tick={axisTick} axisLine={false} tickLine={false} />
        <YAxis tick={axisTick} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#f7f2ec" }} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="revenue" name={isRTL ? "الإيرادات" : "Revenue"} fill={SERIES[1]} radius={[4, 4, 0, 0]} maxBarSize={18} />
        <Bar dataKey="expense" name={isRTL ? "المصروفات" : "Expenses"} fill={SERIES[5]} radius={[4, 4, 0, 0]} maxBarSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
}

interface FinanceTabProps {
  pnl: MonthlyPnL[];
  year: number;
}

export function FinanceTab({ pnl, year }: FinanceTabProps) {
  const { locale } = useLocale();
  const isRTL = locale === "ar";

  const data = usePnlSeries(pnl, locale);

  const totals = useMemo(
    () =>
      pnl.reduce(
        (accumulator, item) => ({
          revenue: accumulator.revenue + item.revenue,
          expense: accumulator.expense + item.expense,
          profit: accumulator.profit + item.profit,
          transactions: accumulator.transactions + item.transactionCount,
        }),
        { revenue: 0, expense: 0, profit: 0, transactions: 0 },
      ),
    [pnl],
  );

  const bestMonth = useMemo(
    () => data.reduce<PnlPoint | null>((best, item) => (!best || item.profit > best.profit ? item : best), null),
    [data],
  );

  return (
    <div className="space-y-4">
      <StatGrid>
        <StatTile
          label={isRTL ? `إجمالي الإيرادات ${year}` : `Total revenue ${year}`}
          value={Math.round(totals.revenue).toLocaleString()}
          accent={SERIES[1]}
        />
        <StatTile
          label={isRTL ? `إجمالي المصروفات ${year}` : `Total expenses ${year}`}
          value={Math.round(totals.expense).toLocaleString()}
          accent={SERIES[5]}
        />
        <StatTile
          label={isRTL ? "صافي الربح" : "Net profit"}
          value={Math.round(totals.profit).toLocaleString()}
          accent={totals.profit >= 0 ? SERIES[3] : SERIES[5]}
        />
        <StatTile
          label={isRTL ? "عدد المعاملات" : "Transactions"}
          value={totals.transactions}
          hint={bestMonth ? `${isRTL ? "أفضل شهر" : "Best month"}: ${bestMonth.name}` : undefined}
        />
      </StatGrid>

      <ChartCard
        title={isRTL ? `الإيرادات والمصروفات الشهرية ${year}` : `Monthly revenue & expenses ${year}`}
        height="h-[240px]"
        minWidth={data.length > 6 ? 520 : undefined}
        isEmpty={!data.length}
      >
        <PnlBarChart data={data} isRTL={isRTL} />
      </ChartCard>

      <ChartCard
        title={isRTL ? `صافي الربح الشهري ${year}` : `Monthly net profit ${year}`}
        height="h-[220px]"
        minWidth={data.length > 6 ? 520 : undefined}
        isEmpty={!data.length}
      >
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 4, right: 12, left: isRTL ? 8 : -8, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={GRID} />
            <XAxis dataKey="name" tick={axisTick} axisLine={false} tickLine={false} />
            <YAxis tick={axisTick} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <ReferenceLine y={0} stroke={GRID} />
            <Line
              type="monotone"
              dataKey="profit"
              name={isRTL ? "صافي الربح" : "Net profit"}
              stroke={SERIES[3]}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
