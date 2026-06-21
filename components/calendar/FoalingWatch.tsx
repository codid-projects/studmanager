"use client";

import { Baby, CalendarClock, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { clientApiFetch } from "@/lib/api/client";
import type { ApiResult, CalendarEventDto, LocaleCode } from "@/lib/api/types";
import { calendarEventDate } from "@/lib/calendar-dates";

export interface FoalingAlert {
  mareProfileId: number;
  horseId: number;
  mareName: string;
  mareNameAr: string;
  expectedFoalingDate: string;
  daysRemaining: number;
  isTwins: boolean;
  isEstimatedFromBreedingDate: boolean;
}

export function FoalingWatch({
  locale,
  onSelectDate,
  events = [],
}: {
  locale: LocaleCode;
  onSelectDate?: (date: Date) => void;
  events?: CalendarEventDto[];
}) {
  const [alerts, setAlerts] = useState<FoalingAlert[]>([]);

  useEffect(() => {
    let active = true;
    clientApiFetch<ApiResult<FoalingAlert[]> | FoalingAlert[]>({
      backendPath: "/api/Calendar/foaling-alerts",
      nextPath: "/api/calendar/foaling-alerts",
      query: { daysAhead: 45, locale },
      locale,
    })
      .then((payload) => {
        if (active) setAlerts(Array.isArray(payload) ? payload : payload.data ?? []);
      })
      .catch(() => {
        if (active) setAlerts([]);
      });
    return () => {
      active = false;
    };
  }, [locale]);

  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const eventAlerts: FoalingAlert[] = events
    .filter((event) => (event.type ?? "").replace(/[^a-z]/gi, "").toLowerCase().includes("foalbirth"))
    .map((event) => {
      const dueDate = calendarEventDate(event);
      const description = `${event.descriptionAr ?? ""} ${event.description ?? ""}`;
      const mareMatch = description.match(/للفرس\s*["']([^"']+)["']/i) ?? description.match(/mare\s*["']([^"']+)["']/i);
      const localizedTitle = locale === "ar" ? event.titleAr || event.title : event.title || event.titleAr;
      return {
        mareProfileId: -(event.id || 1),
        horseId: event.relatedEntityId ?? 0,
        mareName: mareMatch?.[1] || localizedTitle,
        mareNameAr: mareMatch?.[1] || localizedTitle,
        expectedFoalingDate: `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, "0")}-${String(dueDate.getDate()).padStart(2, "0")}`,
        daysRemaining: Math.round((dueDate.getTime() - todayStart.getTime()) / 86_400_000),
        isTwins: /twins|توأم/i.test(description),
        isEstimatedFromBreedingDate: false,
      };
    })
    .filter((alert) => alert.daysRemaining >= 0 && alert.daysRemaining <= 45);

  const visibleAlerts = [...alerts, ...eventAlerts].filter((alert, index, all) =>
    all.findIndex((candidate) => candidate.expectedFoalingDate === alert.expectedFoalingDate && (candidate.horseId === alert.horseId || candidate.mareName === alert.mareName)) === index,
  );

  if (!visibleAlerts.length) return null;

  const ar = locale === "ar";
  const countdown = (days: number) => {
    if (!ar) {
      if (days < 0) return `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} overdue`;
      if (days === 0) return "Expected today";
      return `${days} day${days === 1 ? "" : "s"} remaining`;
    }
    if (days < 0) return `تجاوز الموعد المتوقع بـ ${Math.abs(days)} ${Math.abs(days) === 1 ? "يوم" : "أيام"}`;
    if (days === 0) return "الولادة متوقعة اليوم";
    if (days === 1) return "متبقي يوم واحد";
    return `متبقي ${days.toLocaleString("ar-EG")} أيام`;
  };

  return (
    <section className="mb-6 overflow-hidden rounded-3xl border border-[#e8cfa8] bg-gradient-to-br from-[#fffaf0] via-white to-[#f6ead7] shadow-[0_18px_50px_rgba(109,74,36,0.12)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ead9bd] px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#6d4a24] text-white shadow-lg">
            <Baby className="h-6 w-6" />
          </span>
          <div>
            <h2 className="text-lg font-black text-[#3b2b20]">{ar ? "ترقّب الولادة" : "Foaling watch"}</h2>
            <p className="text-xs font-medium text-[#8a725a]">
              {ar ? "أفراس اقترب موعد ولادتها المتوقع" : "Mares approaching their expected foaling date"}
            </p>
          </div>
        </div>
        <span className="rounded-full bg-[#6d4a24]/10 px-3 py-1 text-xs font-bold text-[#6d4a24]">
          {visibleAlerts.length.toLocaleString(ar ? "ar-EG" : "en-EG")} {ar ? "حالة" : visibleAlerts.length === 1 ? "mare" : "mares"}
        </span>
      </div>
      <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3">
        {visibleAlerts.map((alert) => {
          const mareName = ar ? alert.mareNameAr || alert.mareName : alert.mareName || alert.mareNameAr;
          const dueDate = new Date(`${alert.expectedFoalingDate}T12:00:00`);
          return (
            <button
              key={`${alert.mareProfileId}-${alert.expectedFoalingDate}`}
              type="button"
              onClick={() => onSelectDate?.(dueDate)}
              className="group rounded-2xl border border-[#eadcc7] bg-white p-4 text-start shadow-sm transition hover:-translate-y-1 hover:border-[#9a7448] hover:shadow-xl"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-base font-black text-[#3b2b20]">{mareName}</div>
                  <div className={`mt-1 text-sm font-bold ${alert.daysRemaining <= 7 ? "text-[#b64b3b]" : "text-[#6d4a24]"}`}>
                    {countdown(alert.daysRemaining)}
                  </div>
                </div>
                <CalendarClock className="h-6 w-6 text-[#9a7448] transition group-hover:scale-110" />
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-lg bg-[#f7f0e7] px-3 py-2 font-semibold text-[#6f5a47]">
                  {ar ? "الموعد المتوقع:" : "Expected:"}{" "}
                  {dueDate.toLocaleDateString(ar ? "ar-EG" : "en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    calendar: "gregory",
                  })}
                </span>
                {alert.isTwins && (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-[#f2e6f5] px-3 py-2 font-bold text-[#744c7b]">
                    <Sparkles className="h-3.5 w-3.5" />
                    {ar ? "حمل بتوأم" : "Twins"}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
