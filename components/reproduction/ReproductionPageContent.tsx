"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale } from "@/lib/locale-context";
import { Venus, Mars } from "lucide-react";
import StallionsTab from "./StalionsTab";
import MaresTab from "./MaresTab";

const tabs = ["overview", "records"] as const;

export function ReproductionPageContent() {
  const { t, direction } = useLocale();
  const isRTL = direction === "rtl";
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const horseId = searchParams.get("horseId");
  const horseName = searchParams.get("horseName");

  const [active, setActive] = useState<(typeof tabs)[number]>(
    requestedTab === "mares" ? "records" : "overview",
  );

  const labels = {
    overview: t("reproductionPage.tabs.stallions"),
    records: t("reproductionPage.tabs.mares"),
  };

  return (
    <div className="w-full max-w-full space-y-5 overflow-x-hidden">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className={isRTL ? "text-right" : "text-left"}>
          <p className="text-xs font-semibold text-[#9b8779]">
            {t("sidebar.reproduction")}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-[#2d211d] sm:text-[1.75rem]">
            {labels[active]}
          </h1>
        </div>

        <div
          className={`grid w-full grid-cols-2 rounded-[18px] border border-[#eadfd7] bg-white p-1.5 shadow-[0_8px_24px_rgba(74,47,30,0.05)] sm:w-auto sm:min-w-[340px] ${
            isRTL ? "flex-row-reverse" : ""
          }`}
        >
          {tabs.map((tab) => {
            const Icon = tab === "overview" ? Mars : Venus;
            return (
              <button
                key={tab}
                onClick={() => setActive(tab)}
                className={`flex h-11 w-full items-center justify-center gap-2 rounded-[13px] px-4 text-sm font-semibold transition ${
                  active === tab
                    ? "bg-[#4b2f1a] text-white shadow-[0_7px_18px_rgba(75,47,26,0.18)]"
                    : "text-[#75645b] hover:bg-[#faf5f1]"
                }`}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
                {labels[tab]}
              </button>
            );
          })}
        </div>
      </div>

      {horseName ? (
        <div className="rounded-2xl border border-[#e7d9cd] bg-[#fbf7f2] px-5 py-3 text-sm font-semibold text-[#4b2f1a]">
          {t("reproductionPage.selectedHorse")}: <span className="font-bold">{horseName}</span>
        </div>
      ) : null}

      <div className="min-w-0">
        {active === "overview" && <StallionsTab initialHorseId={horseId} initialHorseName={horseName} />}
        {active === "records" && <MaresTab initialHorseId={horseId} initialHorseName={horseName} />}
      </div>
    </div>
  );
}

export default ReproductionPageContent;
