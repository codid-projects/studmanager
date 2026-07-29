"use client";

import { useEffect, useState } from "react";
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
} from "@/lib/api/reports-client";
import { ReportsTabs, type ReportTabId } from "./ReportsTabs";
import { card } from "./report-ui";
import { OverviewTab } from "./tabs/OverviewTab";
import { HerdTab } from "./tabs/HerdTab";
import { HousingTab } from "./tabs/HousingTab";
import { BreedingTab } from "./tabs/BreedingTab";
import { HealthcareTab } from "./tabs/HealthcareTab";
import { FinanceTab } from "./tabs/FinanceTab";

/** Tabs whose data is narrowed by the date range. */
const DATE_FILTER_TABS: ReportTabId[] = ["overview", "breeding", "healthcare"];
/** Tabs that read the finance year. */
const YEAR_FILTER_TABS: ReportTabId[] = ["overview", "finance"];

const inputClass =
  "h-9 rounded-xl border border-[#e4d9cf] bg-white px-2 text-xs font-semibold text-[#6b5a4c] outline-none focus:border-[#4b2f1a]";

export function ReportsDashboard() {
  const { locale, direction } = useLocale();
  const { t } = useTranslation();
  const localeCode = locale as LocaleCode;
  const isRTL = direction === "rtl";

  const currentYear = new Date().getFullYear();
  const [activeTab, setActiveTab] = useState<ReportTabId>("overview");
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

  const showDateFilter = DATE_FILTER_TABS.includes(activeTab);
  const showYearFilter = YEAR_FILTER_TABS.includes(activeTab);
  const noData = !dashboard && !horses && !breeding && !healthcare && !pnl.length;

  const text = {
    from: isRTL ? "من" : "From",
    to: isRTL ? "إلى" : "To",
    clear: isRTL ? "مسح" : "Clear",
  };

  return (
    <div className="space-y-4 sm:space-y-5" dir={direction}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-xl font-bold text-[#3b2b20] sm:text-2xl">{t("reports.title")}</h1>

        {showDateFilter || showYearFilter ? (
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#6b5a4c]">
            {showDateFilter ? (
              <>
                <label className="flex flex-1 items-center gap-1.5 sm:flex-none">
                  {text.from}
                  <input
                    type="date"
                    value={startDate}
                    onChange={(event) => setStartDate(event.target.value)}
                    className={`${inputClass} min-w-0 flex-1 sm:flex-none`}
                  />
                </label>
                <label className="flex flex-1 items-center gap-1.5 sm:flex-none">
                  {text.to}
                  <input
                    type="date"
                    value={endDate}
                    min={startDate || undefined}
                    onChange={(event) => setEndDate(event.target.value)}
                    className={`${inputClass} min-w-0 flex-1 sm:flex-none`}
                  />
                </label>
                {startDate || endDate ? (
                  <button
                    type="button"
                    onClick={() => {
                      setStartDate("");
                      setEndDate("");
                    }}
                    className={`${inputClass} px-3 transition hover:bg-[#fbf6f2]`}
                  >
                    {text.clear}
                  </button>
                ) : null}
              </>
            ) : null}

            {showYearFilter ? (
              <select
                value={financeYear}
                onChange={(event) => setFinanceYear(Number(event.target.value))}
                className={inputClass}
                aria-label={isRTL ? "السنة المالية" : "Finance year"}
              >
                {Array.from({ length: 6 }, (_, index) => currentYear - index).map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            ) : null}
          </div>
        ) : null}
      </div>

      <ReportsTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {error ? (
        <div className="rounded-xl border border-[#f2c7c7] bg-[#fff3f3] px-4 py-3 text-sm text-[#b04444]">{error}</div>
      ) : null}

      {loading ? (
        <div className={`${card} py-10 text-center text-sm text-[#7a6c63]`}>{t("common.loading")}</div>
      ) : noData ? (
        <div className={`${card} py-10 text-center text-sm text-[#7a6c63]`}>{t("common.noRecordsFound")}</div>
      ) : (
        <div role="tabpanel" id={`reports-panel-${activeTab}`} aria-labelledby={`reports-tab-${activeTab}`}>
          {activeTab === "overview" ? (
            <OverviewTab
              dashboard={dashboard}
              horses={horses}
              breeding={breeding}
              healthcare={healthcare}
              pnl={pnl}
              financeYear={financeYear}
              onOpenTab={setActiveTab}
            />
          ) : null}

          {activeTab === "herd" ? (
            horses ? (
              <HerdTab horses={horses} />
            ) : (
              <div className={`${card} py-10 text-center text-sm text-[#7a6c63]`}>{t("common.noRecordsFound")}</div>
            )
          ) : null}

          {activeTab === "housing" ? (
            dashboard ? (
              <HousingTab housing={dashboard.housing} />
            ) : (
              <div className={`${card} py-10 text-center text-sm text-[#7a6c63]`}>{t("common.noRecordsFound")}</div>
            )
          ) : null}

          {activeTab === "breeding" ? (
            breeding ? (
              <BreedingTab breeding={breeding} dashboardBreeding={dashboard?.breeding ?? null} />
            ) : (
              <div className={`${card} py-10 text-center text-sm text-[#7a6c63]`}>{t("common.noRecordsFound")}</div>
            )
          ) : null}

          {activeTab === "healthcare" ? (
            healthcare ? (
              <HealthcareTab healthcare={healthcare} veterinarians={dashboard?.veterinarians ?? null} />
            ) : (
              <div className={`${card} py-10 text-center text-sm text-[#7a6c63]`}>{t("common.noRecordsFound")}</div>
            )
          ) : null}

          {activeTab === "finance" ? <FinanceTab pnl={pnl} year={financeYear} /> : null}
        </div>
      )}
    </div>
  );
}
