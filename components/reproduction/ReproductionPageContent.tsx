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
    <div className="w-full max-w-full space-y-3 overflow-x-hidden">
      <div className={isRTL ? "text-right" : "text-left"}>
        <h1 className="text-[16px] font-medium text-[#3b302a]">
          {t("sidebar.reproduction")}
        </h1>
      </div>
      <div>
        <div className="grid w-full grid-cols-2 gap-2">
          {tabs.map((tab) => {
            const Icon = tab === "overview" ? Mars : Venus;
            return (
              <button
                key={tab}
                onClick={() => setActive(tab)}
                className={`flex h-10 w-full items-center justify-center gap-2 rounded-[5px] px-4 text-[12px] font-semibold transition ${
                  active === tab
                    ? "bg-[#351d10] text-white"
                    : "bg-white text-[#3f342e] hover:bg-[#faf5f1]"
                }`}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
                {labels[tab]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-w-0">
        <div className={active === "overview" ? "block" : "hidden"}>
          <StallionsTab
            initialHorseId={requestedTab === "mares" ? null : horseId}
            initialHorseName={requestedTab === "mares" ? null : horseName}
          />
        </div>
        <div className={active === "records" ? "block" : "hidden"}>
          <MaresTab
            initialHorseId={requestedTab === "mares" ? horseId : null}
            initialHorseName={requestedTab === "mares" ? horseName : null}
          />
        </div>
      </div>
    </div>
  );
}

export default ReproductionPageContent;
