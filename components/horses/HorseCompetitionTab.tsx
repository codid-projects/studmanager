"use client";

import { FC, useEffect, useState } from "react";
import { useLocale } from "@/lib/locale-context";
import { getHorseAwards, getHorseChampionships, getHorseEvents } from "@/lib/api/external-horses";
import { formatDate } from "@/lib/api/horse-formatters";
import { getLocalizedName } from "@/lib/api/localization";
import type { HorseAwardHistory, HorseChampionHistory, HorseEventHistory } from "@/lib/api/types";

interface HorseCompetitionTabProps {
  horse?: any;
}

export const HorseCompetitionTab: FC<HorseCompetitionTabProps> = ({ horse }) => {
  const { direction, locale } = useLocale();
  const isRTL = direction === "rtl";
  const [activeSubTab, setActiveSubTab] = useState("competition");
  const [events, setEvents] = useState<HorseEventHistory[]>([]);
  const [championships, setChampionships] = useState<HorseChampionHistory[]>([]);
  const [awards, setAwards] = useState<HorseAwardHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const localHorseId = Number(horse?.id);

  useEffect(() => {
    if (!Number.isFinite(localHorseId)) return;

    let mounted = true;

    async function load() {
      setLoading(true);
      setError("");

      try {
        if (activeSubTab === "competition" && !events.length) {
          const result = await getHorseEvents({ localHorseId, pageNumber: 1, pageSize: 20 });
          if (mounted) setEvents(result.data?.data ?? []);
        }

        if (activeSubTab === "championships" && !championships.length) {
          const result = await getHorseChampionships({ localHorseId, pageNumber: 1, pageSize: 20 });
          if (mounted) setChampionships(result.data?.data ?? []);
        }

        if (activeSubTab === "awards" && !awards.length) {
          const result = await getHorseAwards({ localHorseId, pageNumber: 1, pageSize: 20 });
          if (mounted) setAwards(result.data?.data ?? []);
        }
      } catch (requestError) {
        if (mounted) setError(requestError instanceof Error ? requestError.message : isRTL ? "تعذر تحميل البيانات" : "Failed to load data");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [activeSubTab, localHorseId]);

  const rows = activeSubTab === "competition" ? events : activeSubTab === "championships" ? championships : awards;

  return (
    <div className={`mb-12 ${isRTL ? "text-right" : "text-left"}`}>
      
      <div className={`flex mb-6`}>
        <h2 className="text-2xl font-bold text-[#2a2a2a]">
          {isRTL ? "المنافسة" : "Competition"}
        </h2>
      </div>

      <div className={`flex flex-col ${isRTL ? "md:flex-row-reverse" : "md:flex-row"} justify-between items-center gap-4 mb-6`}>
        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <input 
            type="text" 
            className={`w-full border border-gray-200 rounded-xl py-2 px-4 outline-none focus:border-amber-900 ${isRTL ? "pl-10" : "pr-10"}`}
            placeholder={isRTL ? "البحث" : "Search"}
          />
          <div className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? "left-3" : "right-3"}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="gray" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex gap-2">
          <button 
            onClick={() => setActiveSubTab("awards")}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              activeSubTab === "awards" ? "bg-[#d8c3a5] text-[#3d2a1b] border border-[#d8c3a5]" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {isRTL ? "الجوائز" : "Awards"}
          </button>
          <button 
            onClick={() => setActiveSubTab("championships")}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              activeSubTab === "championships" ? "bg-[#d8c3a5] text-[#3d2a1b] border border-[#d8c3a5]" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {isRTL ? "نتائج البطولات" : "Championships"}
          </button>
          <button 
            onClick={() => setActiveSubTab("competition")}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              activeSubTab === "competition" ? "bg-[#d8c3a5] text-[#3d2a1b] border border-[#d8c3a5]" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {isRTL ? "نتائج المسابقة" : "Competition Results"}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-center">
            <thead className="bg-[#3d2a1b] text-white">
              <tr>
                <th className="py-4 px-6 font-semibold">{isRTL ? "اسم المنافسة" : "Competition Name"}</th>
                <th className="py-4 px-6 font-semibold">{isRTL ? "تاريخ المنافسة" : "Date"}</th>
                <th className="py-4 px-6 font-semibold">{isRTL ? "الفئة" : "Category"}</th>
                <th className="py-4 px-6 font-semibold">{isRTL ? "الترتيب" : "Rank"}</th>
                <th className="py-4 px-6 font-semibold">{isRTL ? "إجمالي النقاط" : "Total Points"}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-10 text-[#7a6c63]">{isRTL ? "جارٍ التحميل" : "Loading"}</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="py-10 text-[#b04444]">{error}</td>
                </tr>
              ) : rows.length ? (
                rows.map((res, idx) => {
                  const event = res as HorseEventHistory & HorseChampionHistory & HorseAwardHistory;
                  return (
                    <tr key={`${event.eventId}-${idx}`} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                      <td className="py-4 px-6 border-b border-gray-100">{getLocalizedName(event.eventNameEn, event.eventNameAr, locale === "ar")}</td>
                      <td className="py-4 px-6 border-b border-gray-100">{formatDate(event.eventStartDate)}</td>
                      <td className="py-4 px-6 border-b border-gray-100">{activeSubTab === "awards" ? event.award ?? "-" : event.className ?? event.eventType ?? "-"}</td>
                      <td className="py-4 px-6 border-b border-gray-100">{event.rank ?? "-"}</td>
                      <td className="py-4 px-6 border-b border-gray-100">{event.totalPoint ?? event.score ?? "-"}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-10 text-[#7a6c63]">{isRTL ? "لا توجد سجلات" : "No records found"}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex justify-center mt-8 gap-2">
        <button className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 text-gray-500 hover:bg-gray-50">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isRTL ? "rotate-180" : ""}>
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <button className="w-8 h-8 flex items-center justify-center rounded-full bg-[#3d2a1b] text-white">1</button>
        <button className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50">2</button>
        <button className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50">3</button>
        <button className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50">4</button>
        <button className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50">5</button>
        <span className="flex items-center justify-center w-8 h-8 text-gray-500">...</span>
        <button className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50">32</button>
        <button className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 text-gray-500 hover:bg-gray-50">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isRTL ? "rotate-180" : ""}>
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

    </div>
  );
};
