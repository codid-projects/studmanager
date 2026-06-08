"use client";

import { useState } from "react";
import { useLocale } from "@/lib/locale-context";
import EmbryoTransferTab from "@/components/reproduction/tabs/EmbryoTransferTab";
import ReproductionControlTab from "@/components/reproduction/tabs/ReproductionControlTab";
import MaresOverviewTab from "./tabs/MaresOverviewTab";

type TabKey = "overview" | "transfer" | "control";

export default function MaresTab({
  initialHorseId,
  initialHorseName,
}: {
  initialHorseId?: string | null;
  initialHorseName?: string | null;
}) {
  const { direction, t } = useLocale();
  const isRTL = direction === "rtl";

  const [active, setActive] = useState<TabKey>("overview");

  const tabs: { key: TabKey; label: string }[] = [
    { key: "overview", label: t("reproductionMares.tabs.overview") },
    { key: "transfer", label: t("reproductionMares.tabs.transfer") },
    { key: "control", label: t("reproductionMares.tabs.control") },
  ];

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Tabs header:
          - Mobile: horizontal scroll (no overflow outside screen)
          - Desktop: wrap as before
      */}
      <div className="w-full max-w-full">
        {/* Mobile */}
        <div
          className={`sm:hidden flex gap-2 overflow-x-auto whitespace-nowrap py-1 ${
            isRTL ? "justify-start" : "justify-start"
          }`}
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActive(tab.key)}
              className={`shrink-0 px-5 py-3 rounded-2xl text-sm font-semibold border transition ${
                active === tab.key
                  ? "bg-[#fff6e7] border-[#bfae87] text-[#2c2330]"
                  : "bg-white border-[#e8e2dd] text-[#2c2330]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Desktop */}
        <div
          className={`hidden sm:flex gap-3 justify-end flex-wrap ${
            isRTL ? "flex-row-reverse justify-start" : ""
          }`}
        >
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActive(tab.key)}
              className={`px-5 py-3 rounded-2xl text-sm font-semibold border transition ${
                active === tab.key
                  ? "bg-[#fff6e7] border-[#bfae87] text-[#2c2330]"
                  : "bg-white border-[#e8e2dd] text-[#2c2330]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {active === "overview" && (
        <MaresOverviewTab initialHorseId={initialHorseId} initialHorseName={initialHorseName} />
      )}
      {active === "transfer" && <EmbryoTransferTab />}
      {active === "control" && <ReproductionControlTab />}
    </div>
  );
}
