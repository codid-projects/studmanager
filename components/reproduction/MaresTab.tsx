"use client";

import { useState } from "react";
import { useLocale } from "@/lib/locale-context";
import EmbryoTransferTab from "@/components/reproduction/tabs/EmbryoTransferTab";
import ReproductionControlTab from "@/components/reproduction/tabs/ReproductionControlTab";
import MaresOverviewTab from "./tabs/MaresOverviewTab";
import { Activity, Baby, Dna, type LucideIcon } from "lucide-react";

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

  const tabs: { key: TabKey; label: string; icon: LucideIcon }[] = [
    { key: "overview", label: t("reproductionMares.tabs.overview"), icon: Baby },
    { key: "transfer", label: t("reproductionMares.tabs.transfer"), icon: Dna },
    { key: "control", label: t("reproductionMares.tabs.control"), icon: Activity },
  ];

  return (
    <div className="w-full max-w-full space-y-5 overflow-x-hidden">
      <div className="w-full max-w-full overflow-x-auto">
        <div
          className={`flex min-w-max gap-2 rounded-[18px] border border-[#eadfd7] bg-white p-1.5 shadow-[0_8px_24px_rgba(74,47,30,0.05)] sm:min-w-0 ${
            isRTL ? "flex-row-reverse" : ""
          }`}
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActive(tab.key)}
                className={`flex h-11 flex-1 shrink-0 items-center justify-center gap-2 rounded-[13px] px-5 text-sm font-semibold transition ${
                  active === tab.key
                    ? "bg-[#4b2f1a] text-white shadow-[0_7px_18px_rgba(75,47,26,0.16)]"
                    : "text-[#75645b] hover:bg-[#faf5f1]"
                }`}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {active === "overview" && (
        <MaresOverviewTab initialHorseId={initialHorseId} initialHorseName={initialHorseName} />
      )}
      {active === "transfer" && <EmbryoTransferTab />}
      {active === "control" && <ReproductionControlTab />}
    </div>
  );
}
