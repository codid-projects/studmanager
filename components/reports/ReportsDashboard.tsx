"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useLocale, useTranslation } from "@/lib/locale-context";
import type { LocaleCode } from "@/lib/api/types";
import {
  getBreedingReport,
  getDashboardReport,
  getHealthcareReport,
  getHorseReport,
  getMonthlyPnL,
  type BreedingReport,
  type DashboardReport,
  type HealthcareReport,
  type HorseReport,
  type MonthlyPnL,
  type NameCount,
} from "@/lib/api/reports-client";

// Validated categorical palette (dataviz slots, fixed order — never cycled).
const SERIES = ["#2a78d6", "#1baf7a", "#eda100", "#008300", "#4a3aa7", "#e34948", "#e87ba4", "#eb6834"];
const INK = "#3b2b20";
const INK_MUTED = "#8a7a6d";
const GRID = "#efe9e3";

const card = "bg-white rounded-2xl p-5 shadow-sm border border-[#f1e9e2]";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-bold text-[#3b2b20]">{children}</h2>;
}

function StatTile({ label, value, accent }: { label: string; value: React.ReactNode; accent?: string }) {
  return (
    <div className={`${card} flex min-h-24 flex-col justify-between`}>
      <p className="text-xs font-semibold text-[#8a7a6d]">{label}</p>
      <p className="mt-2 text-3xl font-bold" style={{ color: accent ?? INK }}>
        {value ?? "—"}
      </p>
    </div>
  );
}

function localName(item: NameCount, isRTL: boolean) {
  return (isRTL ? item.nameAr || item.name : item.name || item.nameAr) || "—";
}

function monthLabel(year: number, month: number, locale: string) {
  return new Date(year, month - 1, 1).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-GB", {
    month: "short",
    year: "2-digit",
  });
}

const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid #ece2da",
  fontSize: 12,
  fontFamily: "inherit",
};

export function ReportsDashboard() {
  const { locale, direction } = useLocale();
  const { t } = useTranslation();
  const localeCode = locale as LocaleCode;
  const isRTL = direction === "rtl";

  const currentYear = new Date().getFullYear();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [financeYear, setFinanceYear] = useState(currentYear);

  const [dashboard, setDashboard] = useState<DashboardReport | null>(null);
  const [horses, setHorses] = useState<HorseReport | null>(null);
  const [breeding, setBreeding] = useState<BreedingReport | null>(null);
  const [healthcare, setHealthcare] = useState<HealthcareReport | null>(null);
  const [pnl, setPnl] = useState<MonthlyPnL[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    Promise.allSettled([
      getDashboardReport(localeCode),
      getHorseReport(localeCode),
      getBreedingReport(localeCode, startDate || undefined, endDate || undefined),
      getHealthcareReport(localeCode, startDate || undefined, endDate || undefined),
      getMonthlyPnL(localeCode, financeYear),
    ]).then(([dash, horse, breed, health, finance]) => {
      if (!active) return;
      if (dash.status === "fulfilled") setDashboard(dash.value);
      if (horse.status === "fulfilled") setHorses(horse.value);
      if (breed.status === "fulfilled") setBreeding(breed.value);
      if (health.status === "fulfilled") setHealthcare(health.value);
      if (finance.status === "fulfilled") setPnl(finance.value);
      const firstError = [dash, horse, breed, health, finance].find(
        (result) => result.status === "rejected",
      ) as PromiseRejectedResult | undefined;
      if (firstError) {
        setError(
          firstError.reason instanceof Error ? firstError.reason.message : t("common.error"),
        );
      }
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [localeCode, startDate, endDate, financeYear, t]);

  const herdPie = useMemo(() => {
    if (!horses) return [];
    return [
      { name: isRTL ? "فحول" : "Stallions", value: horses.stallions },
      { name: isRTL ? "أفراس" : "Mares", value: horses.mares },
      { name: isRTL ? "أمهار ذكور" : "Colts", value: horses.colts },
      { name: isRTL ? "أمهار إناث" : "Fillies", value: horses.fillies },
      { name: isRTL ? "مواليد" : "Foals", value: horses.foals },
    ].filter((item) => item.value > 0);
  }, [horses, isRTL]);

  const ageBars = useMemo(() => {
    if (!horses) return [];
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
    () =>
      (horses?.birthYearDistribution ?? [])
        .slice()
        .sort((a, b) => a.year - b.year)
        .slice(-12),
    [horses],
  );

  const clinicalBars = useMemo(() => {
    const distribution = breeding?.mareSoundnessSummary.clinicalResultDistribution;
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

  const stallionPregnancies = useMemo(
    () =>
      (breeding?.mareSoundnessSummary.pregnanciesByStallion ?? []).map((item) => ({
        name: localName(item, isRTL),
        value: item.count,
      })),
    [breeding, isRTL],
  );

  const healthByCategory = useMemo(
    () =>
      (healthcare?.byCategory ?? []).map((item) => ({
        name: (isRTL ? item.categoryAr || item.category : item.category) || "—",
        count: item.count,
        cost: item.totalCost,
      })),
    [healthcare, isRTL],
  );

  const healthTrend = useMemo(
    () =>
      (healthcare?.monthlyTrend ?? []).map((item) => ({
        name: monthLabel(item.year, item.month, locale),
        value: item.count,
      })),
    [healthcare, locale],
  );

  const pnlData = useMemo(
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

  const text = {
    title: t("reports.title"),
    herd: isRTL ? "القطيع" : "Herd",
    housing: isRTL ? "الإسكان" : "Housing",
    breeding: isRTL ? "التناسل" : "Breeding",
    healthcare: isRTL ? "الرعاية الصحية" : "Healthcare",
    finance: isRTL ? "المالية" : "Finance",
    from: isRTL ? "من" : "From",
    to: isRTL ? "إلى" : "To",
    clear: isRTL ? "مسح" : "Clear",
  };

  return (
    <div className="space-y-6" dir={direction}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-[#3b2b20]">{text.title}</h1>
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#6b5a4c]">
          <label className="flex items-center gap-1.5">
            {text.from}
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="h-9 rounded-xl border border-[#e4d9cf] bg-white px-2 outline-none focus:border-[#4b2f1a]"
            />
          </label>
          <label className="flex items-center gap-1.5">
            {text.to}
            <input
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(event) => setEndDate(event.target.value)}
              className="h-9 rounded-xl border border-[#e4d9cf] bg-white px-2 outline-none focus:border-[#4b2f1a]"
            />
          </label>
          {startDate || endDate ? (
            <button
              onClick={() => {
                setStartDate("");
                setEndDate("");
              }}
              className="h-9 rounded-xl border border-[#e4d9cf] bg-white px-3 transition hover:bg-[#fbf6f2]"
            >
              {text.clear}
            </button>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-[#f2c7c7] bg-[#fff3f3] px-4 py-3 text-sm text-[#b04444]">{error}</div>
      ) : null}
      {loading ? (
        <div className="rounded-2xl bg-white p-10 text-center text-sm text-[#7a6c63]">{t("common.loading")}</div>
      ) : null}

      {/* ===================== Herd ===================== */}
      {horses ? (
        <section className="space-y-4">
          <SectionTitle>{text.herd}</SectionTitle>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatTile label={isRTL ? "إجمالي الخيول" : "Total horses"} value={horses.totalHorses} />
            <StatTile label={isRTL ? "متاح" : "Available"} value={horses.available} />
            <StatTile label={isRTL ? "مباع" : "Sold"} value={horses.sold} />
            <StatTile label={isRTL ? "زائر" : "Visitors"} value={horses.visitors} />
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className={card}>
              <h3 className="mb-3 text-sm font-bold text-[#3b2b20]">{isRTL ? "تكوين القطيع" : "Herd composition"}</h3>
              <div className="flex items-center gap-3">
                <div className="h-[170px] w-[170px] shrink-0">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={herdPie} dataKey="value" innerRadius={45} outerRadius={72} paddingAngle={2} stroke="#fff" strokeWidth={2}>
                        {herdPie.map((_, index) => (
                          <Cell key={index} fill={SERIES[index % SERIES.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="min-w-0 flex-1 space-y-1.5 text-xs">
                  {herdPie.map((item, index) => (
                    <li key={item.name} className="flex items-center justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-1.5 text-[#6b5a4c]">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: SERIES[index] }} />
                        <span className="truncate">{item.name}</span>
                      </span>
                      <span className="font-bold text-[#3b2b20]">{item.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className={card}>
              <h3 className="mb-3 text-sm font-bold text-[#3b2b20]">{isRTL ? "التوزيع العمري" : "Age distribution"}</h3>
              <div className="h-[180px]">
                <ResponsiveContainer>
                  <BarChart data={ageBars} margin={{ top: 4, right: 8, left: isRTL ? 8 : -18, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke={GRID} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: INK_MUTED }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: INK_MUTED }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#f7f2ec" }} />
                    <Bar dataKey="value" name={isRTL ? "الخيول" : "Horses"} fill={SERIES[0]} radius={[4, 4, 0, 0]} maxBarSize={34} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className={card}>
              <h3 className="mb-3 text-sm font-bold text-[#3b2b20]">{isRTL ? "المواليد حسب السنة" : "Births by year"}</h3>
              <div className="h-[180px]">
                <ResponsiveContainer>
                  <BarChart data={birthYears} margin={{ top: 4, right: 8, left: isRTL ? 8 : -18, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke={GRID} />
                    <XAxis dataKey="year" tick={{ fontSize: 10, fill: INK_MUTED }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: INK_MUTED }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#f7f2ec" }} />
                    <Bar dataKey="count" name={isRTL ? "المواليد" : "Births"} fill={SERIES[1]} radius={[4, 4, 0, 0]} maxBarSize={26} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* ===================== Housing ===================== */}
      {dashboard ? (
        <section className="space-y-4">
          <SectionTitle>{text.housing}</SectionTitle>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatTile label={isRTL ? "السعة الكلية" : "Total capacity"} value={dashboard.housing.totalCapacity} />
            <StatTile label={isRTL ? "مشغول" : "Occupied"} value={dashboard.housing.occupied} />
            <StatTile label={isRTL ? "متاح" : "Available"} value={dashboard.housing.available} />
            <StatTile
              label={isRTL ? "نسبة الإشغال" : "Occupancy rate"}
              value={`${Math.round(dashboard.housing.occupancyRate)}%`}
              accent={SERIES[0]}
            />
          </div>
        </section>
      ) : null}

      {/* ===================== Breeding ===================== */}
      {breeding && dashboard ? (
        <section className="space-y-4">
          <SectionTitle>{text.breeding}</SectionTitle>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatTile
              label={isRTL ? "فحوصات التبويض" : "Ovulation exams"}
              value={breeding.mareSoundnessSummary.totalOvulationExaminations}
            />
            <StatTile label={isRTL ? "أفراس حوامل" : "Pregnant mares"} value={dashboard.breeding.pregnantMares} accent={SERIES[1]} />
            <StatTile label={isRTL ? "أفراس غير حوامل" : "Non-pregnant mares"} value={dashboard.breeding.nonPregnantMares} />
            <StatTile
              label={isRTL ? "معدل الولادات الحية" : "Live birth rate"}
              value={`${Math.round(breeding.pregnancyOutcomeSummary.liveBirthRate)}%`}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className={card}>
              <h3 className="mb-3 text-sm font-bold text-[#3b2b20]">
                {isRTL ? "نتائج الفحوصات الإكلينيكية" : "Clinical results"}
              </h3>
              {clinicalBars.length ? (
                <div className="h-[190px]">
                  <ResponsiveContainer>
                    <BarChart data={clinicalBars} layout="vertical" margin={{ top: 0, right: 24, left: 8, bottom: 0 }}>
                      <CartesianGrid horizontal={false} stroke={GRID} />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: INK_MUTED }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" width={78} tick={{ fontSize: 10, fill: INK_MUTED }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#f7f2ec" }} />
                      <Bar dataKey="value" name={isRTL ? "الفحوصات" : "Exams"} fill={SERIES[0]} radius={[0, 4, 4, 0]} maxBarSize={18} label={{ position: "right", fontSize: 10, fill: INK }} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="py-10 text-center text-xs text-[#8a7a6d]">{t("common.noRecordsFound")}</p>
              )}
            </div>
            <div className={card}>
              <h3 className="mb-3 text-sm font-bold text-[#3b2b20]">
                {isRTL ? "حالات الحمل حسب الفحل" : "Pregnancies by stallion"}
              </h3>
              {stallionPregnancies.length ? (
                <div className="h-[190px]">
                  <ResponsiveContainer>
                    <BarChart data={stallionPregnancies} layout="vertical" margin={{ top: 0, right: 24, left: 8, bottom: 0 }}>
                      <CartesianGrid horizontal={false} stroke={GRID} />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: INK_MUTED }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" width={92} tick={{ fontSize: 10, fill: INK_MUTED }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#f7f2ec" }} />
                      <Bar dataKey="value" name={isRTL ? "حالات الحمل" : "Pregnancies"} fill={SERIES[1]} radius={[0, 4, 4, 0]} maxBarSize={18} label={{ position: "right", fontSize: 10, fill: INK }} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="py-10 text-center text-xs text-[#8a7a6d]">{t("common.noRecordsFound")}</p>
              )}
            </div>
            <div className={card}>
              <h3 className="mb-3 text-sm font-bold text-[#3b2b20]">{isRTL ? "المواليد المسجلة حسب السنة" : "Registered foals by year"}</h3>
              {breeding.foalReport.byYear.length ? (
                <div className="h-[190px]">
                  <ResponsiveContainer>
                    <BarChart
                      data={breeding.foalReport.byYear.slice().sort((a, b) => a.year - b.year).slice(-10)}
                      margin={{ top: 4, right: 8, left: isRTL ? 8 : -18, bottom: 0 }}
                    >
                      <CartesianGrid vertical={false} stroke={GRID} />
                      <XAxis dataKey="year" tick={{ fontSize: 10, fill: INK_MUTED }} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: INK_MUTED }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#f7f2ec" }} />
                      <Bar dataKey="count" name={isRTL ? "المواليد" : "Foals"} fill={SERIES[4]} radius={[4, 4, 0, 0]} maxBarSize={26} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="py-10 text-center text-xs text-[#8a7a6d]">{t("common.noRecordsFound")}</p>
              )}
            </div>
          </div>
        </section>
      ) : null}

      {/* ===================== Healthcare ===================== */}
      {healthcare ? (
        <section className="space-y-4">
          <SectionTitle>{text.healthcare}</SectionTitle>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatTile label={isRTL ? "إجمالي السجلات" : "Total records"} value={healthcare.totalRecords} />
            <StatTile label={isRTL ? "خيول عولجت" : "Horses treated"} value={healthcare.horsesTreated} />
            <StatTile label={isRTL ? "إجمالي التكلفة" : "Total cost"} value={healthcare.totalCost.toLocaleString()} />
            <StatTile
              label={isRTL ? "متوسط التكلفة للسجل" : "Avg cost / record"}
              value={Math.round(healthcare.avgCostPerRecord).toLocaleString()}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className={`${card} lg:col-span-2`}>
              <h3 className="mb-3 text-sm font-bold text-[#3b2b20]">{isRTL ? "السجلات حسب القسم" : "Records by category"}</h3>
              {healthByCategory.length ? (
                <div className="h-[220px]">
                  <ResponsiveContainer>
                    <BarChart data={healthByCategory} margin={{ top: 4, right: 8, left: isRTL ? 8 : -18, bottom: 0 }}>
                      <CartesianGrid vertical={false} stroke={GRID} />
                      <XAxis dataKey="name" interval={0} angle={-18} height={52} tick={{ fontSize: 9, fill: INK_MUTED }} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: INK_MUTED }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#f7f2ec" }} />
                      <Bar dataKey="count" name={isRTL ? "السجلات" : "Records"} fill={SERIES[0]} radius={[4, 4, 0, 0]} maxBarSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="py-10 text-center text-xs text-[#8a7a6d]">{t("common.noRecordsFound")}</p>
              )}
            </div>
            <div className={card}>
              <h3 className="mb-3 text-sm font-bold text-[#3b2b20]">{isRTL ? "أكثر الخيول علاجاً" : "Top treated horses"}</h3>
              {healthcare.topTreatedHorses.length ? (
                <ul className="space-y-2 text-xs">
                  {healthcare.topTreatedHorses.slice(0, 7).map((horse) => (
                    <li key={horse.horseId} className="flex items-center justify-between gap-2 rounded-lg bg-[#fbf7f3] px-3 py-2">
                      <span className="min-w-0 truncate font-semibold text-[#3b2b20]">
                        {(isRTL ? horse.horseNameAr || horse.horseName : horse.horseName || horse.horseNameAr) || `#${horse.horseId}`}
                      </span>
                      <span className="shrink-0 rounded-full bg-white px-2 py-0.5 font-bold text-[#6b5a4c]">
                        {horse.visitCount} {isRTL ? "زيارة" : "visits"}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-10 text-center text-xs text-[#8a7a6d]">{t("common.noRecordsFound")}</p>
              )}
            </div>
          </div>
          {healthTrend.length > 1 ? (
            <div className={card}>
              <h3 className="mb-3 text-sm font-bold text-[#3b2b20]">{isRTL ? "الاتجاه الشهري للسجلات" : "Monthly records trend"}</h3>
              <div className="h-[200px]">
                <ResponsiveContainer>
                  <LineChart data={healthTrend} margin={{ top: 4, right: 12, left: isRTL ? 8 : -18, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke={GRID} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: INK_MUTED }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: INK_MUTED }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Line type="monotone" dataKey="value" name={isRTL ? "السجلات" : "Records"} stroke={SERIES[0]} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {/* ===================== Finance ===================== */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <SectionTitle>{text.finance}</SectionTitle>
          <select
            value={financeYear}
            onChange={(event) => setFinanceYear(Number(event.target.value))}
            className="h-9 rounded-xl border border-[#e4d9cf] bg-white px-2 text-xs font-semibold text-[#6b5a4c] outline-none focus:border-[#4b2f1a]"
            aria-label={isRTL ? "السنة" : "Year"}
          >
            {Array.from({ length: 6 }, (_, index) => currentYear - index).map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
        <div className={card}>
          <h3 className="mb-3 text-sm font-bold text-[#3b2b20]">
            {isRTL ? `الإيرادات والمصروفات الشهرية ${financeYear}` : `Monthly revenue & expenses ${financeYear}`}
          </h3>
          {pnlData.length ? (
            <div className="h-[240px]">
              <ResponsiveContainer>
                <BarChart data={pnlData} margin={{ top: 4, right: 12, left: isRTL ? 8 : -8, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke={GRID} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: INK_MUTED }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: INK_MUTED }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#f7f2ec" }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="revenue" name={isRTL ? "الإيرادات" : "Revenue"} fill={SERIES[1]} radius={[4, 4, 0, 0]} maxBarSize={18} />
                  <Bar dataKey="expense" name={isRTL ? "المصروفات" : "Expenses"} fill={SERIES[5]} radius={[4, 4, 0, 0]} maxBarSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="py-10 text-center text-xs text-[#8a7a6d]">{t("common.noRecordsFound")}</p>
          )}
        </div>
      </section>

      {/* ===================== Veterinarians ===================== */}
      {dashboard?.veterinarians.topVeterinarians.length ? (
        <section className="space-y-4">
          <SectionTitle>{isRTL ? "الأطباء البيطريون" : "Veterinarians"}</SectionTitle>
          <div className={card}>
            <ul className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2 lg:grid-cols-3">
              {dashboard.veterinarians.topVeterinarians.slice(0, 9).map((vet) => (
                <li key={vet.name} className="flex items-center justify-between gap-2 rounded-lg bg-[#fbf7f3] px-3 py-2">
                  <span className="min-w-0 truncate font-semibold text-[#3b2b20]">{vet.name}</span>
                  <span className="shrink-0 rounded-full bg-white px-2 py-0.5 font-bold text-[#6b5a4c]">
                    {vet.total} {isRTL ? "سجل" : "records"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </div>
  );
}
