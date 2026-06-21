"use client";

import { Baby, CalendarRange } from "lucide-react";
import type { CalendarEventDto, LocaleCode } from "@/lib/api/types";
import { calendarEventDate } from "@/lib/calendar-dates";

function isExpectedFoalingRange(event: CalendarEventDto) {
  return event.relatedEntityType === "FoalingExpectedRange";
}

function endDate(event: CalendarEventDto) {
  return event.end ? new Date(event.end) : calendarEventDate(event);
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
  const ar = locale === "ar";
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const alerts = events
    .filter(isExpectedFoalingRange)
    .filter((event) => endDate(event).getTime() >= todayStart.getTime())
    .sort((a, b) => calendarEventDate(a).getTime() - calendarEventDate(b).getTime());

  if (!alerts.length) return null;

  const formatDate = (date: Date) => date.toLocaleDateString(ar ? "ar-EG" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    calendar: "gregory",
  });

  return (
    <section className="mb-5 overflow-hidden rounded-2xl border border-[#e4d6bd] bg-gradient-to-br from-[#fffaf2] to-[#f5ead8] shadow-[0_10px_28px_rgba(109,74,36,0.09)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eadfcf] px-4 py-3 sm:px-5">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#6d4a24] text-white">
            <Baby className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-sm font-black text-[#3b2b20]">{ar ? "مواعيد الولادة المتوقعة" : "Expected foaling windows"}</h2>
            <p className="text-[11px] font-medium text-[#8a725a]">
              {ar ? "بناءً على نتائج الفحص المسجلة كحامل" : "Based only on examinations marked pregnant"}
            </p>
          </div>
        </div>
        <span className="rounded-full bg-[#6d4a24]/10 px-2.5 py-1 text-[11px] font-bold text-[#6d4a24]">
          {alerts.length.toLocaleString(ar ? "ar-EG" : "en-EG")}
        </span>
      </div>

      <div className="grid gap-2 p-3 sm:grid-cols-2 lg:grid-cols-3 sm:p-4">
        {alerts.map((event) => {
          const start = calendarEventDate(event);
          const end = endDate(event);
          const title = ar ? event.titleAr || event.title : event.title || event.titleAr;
          return (
            <button
              key={event.id}
              type="button"
              onClick={() => onSelectDate?.(start)}
              className="group rounded-xl border border-[#e8dcc9] bg-white/90 p-3 text-start shadow-sm transition hover:border-[#9a7448] hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="line-clamp-1 text-sm font-black text-[#3b2b20]">{title}</p>
                <CalendarRange className="h-4 w-4 shrink-0 text-[#9a7448]" />
              </div>
              <div className="mt-2 flex items-center gap-2 text-[11px] font-bold text-[#6f5a47]" dir="ltr">
                <span className="rounded-md bg-[#f7f0e7] px-2 py-1">{formatDate(start)}</span>
                <span>—</span>
                <span className="rounded-md bg-[#f7f0e7] px-2 py-1">{formatDate(end)}</span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
