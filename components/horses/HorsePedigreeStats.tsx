"use client";

import { FC } from "react";
import { useLocale } from "@/lib/locale-context";

interface Horse {
  maleOffspring?: number | null;
  femaleOffspring?: number | null;
  maleResults?: number | null;
  femaleResults?: number | null;
}

interface HorsePedigreeStatsProps {
  horse: Horse;
  loading?: boolean;
}

function StatValue({ value, loading }: { value?: number | null; loading?: boolean }) {
  if (loading || value === null || value === undefined) {
    return <span className="inline-block h-7 w-12 animate-pulse rounded-lg bg-[#eadfd9]" />;
  }

  return <>{value}</>;
}

function totalValue(first?: number | null, second?: number | null) {
  if (first === null || first === undefined || second === null || second === undefined) return null;
  return first + second;
}

export const HorsePedigreeStats: FC<HorsePedigreeStatsProps> = ({ horse, loading = false }) => {
  const { direction } = useLocale();
  const isRTL = direction === "rtl";
  const siblingsTotal = totalValue(horse.femaleResults, horse.maleResults);
  const offspringTotal = totalValue(horse.femaleOffspring, horse.maleOffspring);

  return (
    <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-6">
      {/* الإخوة (Siblings) Section */}
      <div className="flex flex-col items-center justify-center rounded-3xl bg-white p-4 shadow-sm sm:p-8">
        <h2 className="mb-2 text-lg font-bold text-[#3d2a1b] sm:text-2xl">
          {isRTL ? "الإخوة" : "Siblings"}
        </h2>
        <div className="mb-4 text-xl font-bold text-[#1f2937] sm:mb-8 sm:text-2xl">
          <StatValue value={siblingsTotal} loading={loading} />
        </div>

        <div className="flex w-full items-center justify-center">
          <div className="flex-1 flex flex-col items-center">
            <div className="mb-2 text-lg font-bold text-[#1f2937] sm:text-2xl">
              <StatValue value={horse.femaleResults} loading={loading} />
            </div>
            <div className="flex items-center gap-1 text-sm font-medium text-[#3d2a1b] sm:text-xl">
              <span>{isRTL ? "أنثى" : "Female"}</span>
              <span className="text-lg sm:text-2xl">♀</span>
            </div>
          </div>

          <div className="mx-2 h-12 w-px bg-gray-300 sm:mx-4 sm:h-16" />

          <div className="flex-1 flex flex-col items-center">
            <div className="mb-2 text-lg font-bold text-[#1f2937] sm:text-2xl">
              <StatValue value={horse.maleResults} loading={loading} />
            </div>
            <div className="flex items-center gap-1 text-sm font-medium text-[#3d2a1b] sm:text-xl">
              <span>{isRTL ? "ذكر" : "Male"}</span>
              <span className="text-lg sm:text-2xl">♂</span>
            </div>
          </div>
        </div>
      </div>

      {/* الإنتاج (Production) Section */}
      <div className="flex flex-col items-center justify-center rounded-3xl bg-white p-4 shadow-sm sm:p-8">
        <h2 className="mb-2 text-lg font-bold text-[#3d2a1b] sm:text-2xl">
          {isRTL ? "الإنتاج" : "Production"}
        </h2>
        <div className="mb-4 text-xl font-bold text-[#1f2937] sm:mb-8 sm:text-2xl">
          <StatValue value={offspringTotal} loading={loading} />
        </div>

        <div className="flex w-full items-center justify-center">
          <div className="flex-1 flex flex-col items-center">
            <div className="mb-2 text-lg font-bold text-[#1f2937] sm:text-2xl">
              <StatValue value={horse.femaleOffspring} loading={loading} />
            </div>
            <div className="flex items-center gap-1 text-sm font-medium text-[#3d2a1b] sm:text-xl">
              <span>{isRTL ? "أنثى" : "Female"}</span>
              <span className="text-lg sm:text-2xl">♀</span>
            </div>
          </div>

          <div className="mx-2 h-12 w-px bg-gray-300 sm:mx-4 sm:h-16" />

          <div className="flex-1 flex flex-col items-center">
            <div className="mb-2 text-lg font-bold text-[#1f2937] sm:text-2xl">
              <StatValue value={horse.maleOffspring} loading={loading} />
            </div>
            <div className="flex items-center gap-1 text-sm font-medium text-[#3d2a1b] sm:text-xl">
              <span>{isRTL ? "ذكر" : "Male"}</span>
              <span className="text-lg sm:text-2xl">♂</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
