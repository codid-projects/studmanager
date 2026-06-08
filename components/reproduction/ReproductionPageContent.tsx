"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale } from "@/lib/locale-context";
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
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      {/* <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-[2.1rem] font-bold text-[#27304a]">
          {active === "overview" ? labels.overview : labels.records}
        </h1>
      </div> */}

      {/* Page tabs:
          - Mobile: stack buttons (already w-full) + remove min width that can overflow
          - Desktop: keep current shape
      */}
      <div className="w-full max-w-full">
        <div
          className={`flex gap-3 rounded-xl p-1 ${
            isRTL ? "flex-row-reverse" : ""
          }`}
        >
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActive(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition w-full ${
                active === tab
                  ? "bg-[#4b2f1a] text-[#ffffff] shadow-[0_6px_16px_rgba(75,47,26,0.12)]"
                  : "bg-white text-[#5a4a42] hover:bg-[#fbf6f2]"
              }`}
            >
              {labels[tab]}
            </button>
          ))}
        </div>
      </div>

      {horseName ? (
        <div className="rounded-2xl border border-[#e7d9cd] bg-[#fbf7f2] px-5 py-4 text-sm font-semibold text-[#4b2f1a]">
          {t("reproductionPage.selectedHorse")}: <span className="font-bold">{horseName}</span>
        </div>
      ) : null}

      <div>
        {active === "overview" && <StallionsTab initialHorseId={horseId} initialHorseName={horseName} />}
        {active === "records" && <MaresTab initialHorseId={horseId} initialHorseName={horseName} />}
      </div>
    </div>
  );
}

export default ReproductionPageContent;
