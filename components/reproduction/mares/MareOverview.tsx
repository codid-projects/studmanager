"use client";

import { Baby, CalendarDays, Dna, HeartPulse } from "lucide-react";
import type { MareDashboard } from "@/lib/api/mare-breeding-client";

export function MareOverview({
  dashboard,
  locale,
}: {
  dashboard: MareDashboard;
  locale: "ar" | "en";
}) {
  const ar = locale === "ar";
  const items = [
    [ar ? "عدد الأبناء" : "Foals", dashboard.totalFoals, Baby],
    [
      ar ? "آخر مهر تمت ولادته" : "Last foal",
      ar ? dashboard.lastFoalNameAr : dashboard.lastFoalNameEn,
      Baby,
    ],
    [
      ar ? "عدد حالات الحمل الناجحة" : "Successful pregnancies",
      dashboard.totalPregnanciesCount,
      HeartPulse,
    ],
    [
      ar ? "عدد الأجنة الحالية" : "Current embryos",
      dashboard.currentEmbryosCount,
      Dna,
    ],
    [
      ar ? "نقل الأجنة" : "Embryo transfer",
      dashboard.surrogateStatsDisplay,
      Dna,
    ],
    [ar ? "دورات الشبق" : "Estrus cycles", dashboard.totalCycles, CalendarDays],
  ] as const;
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(([label, value, Icon]) => (
        <article
          key={label}
          className="min-h-28 rounded-[9px] border border-[#ddd5cf] bg-white p-5 shadow-[0_1px_2px_rgba(55,34,22,.05)]"
        >
          <div className="flex items-start justify-between">
            <p className="text-[14px] text-[#403630]">{label}</p>
            <Icon className="h-4 w-4 text-[#6b5140]" />
          </div>
          <p className="mt-4 text-center text-2xl text-[#2d241f]">
            {value || "—"}
          </p>
        </article>
      ))}
    </div>
  );
}
