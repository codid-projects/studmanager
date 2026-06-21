"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarRange, Clock3 } from "lucide-react";
import type { ApiResult, CalendarEventDto, LocaleCode } from "@/lib/api/types";
import { calendarEventDate } from "@/lib/calendar-dates";
import { clientApiFetch } from "@/lib/api/client";

const ALERT_WINDOW_DAYS = 20;

function isFoalingAlert(event: CalendarEventDto) {
  const relatedType = (event.relatedEntityType ?? "").toLowerCase();
  const eventType = (event.type ?? "").toLowerCase();
  return relatedType === "foalingexpectedrange" || relatedType === "foalregistration" || eventType === "foalbirth";
}

function endDate(event: CalendarEventDto) {
  return event.end ? new Date(event.end) : calendarEventDate(event);
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function unwrapResult<T>(payload: T | ApiResult<T>): T {
  if (payload && typeof payload === "object" && "data" in payload && "statusCode" in payload) {
    return (payload as ApiResult<T>).data as T;
  }
  return payload as T;
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
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEventDto[]>([]);
  const todayStart = useMemo(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), today.getDate());
  }, []);
  const alertWindowEnd = useMemo(() => addDays(todayStart, ALERT_WINDOW_DAYS), [todayStart]);

  useEffect(() => {
    let active = true;
    clientApiFetch<ApiResult<CalendarEventDto[]> | CalendarEventDto[]>({
      backendPath: "/api/Calendar",
      nextPath: "/api/calendar",
      query: {
        from: todayStart.toISOString(),
        to: new Date(alertWindowEnd.getFullYear(), alertWindowEnd.getMonth(), alertWindowEnd.getDate(), 23, 59, 59).toISOString(),
        locale,
      },
      locale,
    })
      .then((payload) => {
        if (active) setUpcomingEvents(unwrapResult(payload) ?? []);
      })
      .catch(() => {
        if (active) setUpcomingEvents([]);
      });
    return () => {
      active = false;
    };
  }, [alertWindowEnd, locale, todayStart]);

  const alerts = useMemo(() => {
    const unique = new Map<number, CalendarEventDto>();
    [...events, ...upcomingEvents].forEach((event) => unique.set(event.id, event));
    return [...unique.values()]
      .filter(isFoalingAlert)
      .filter((event) => {
        const start = calendarEventDate(event);
        const end = endDate(event);
        return end.getTime() >= todayStart.getTime() && start.getTime() <= alertWindowEnd.getTime();
      })
      .sort((a, b) => calendarEventDate(a).getTime() - calendarEventDate(b).getTime());
  }, [alertWindowEnd, events, todayStart, upcomingEvents]);

  if (!alerts.length) return null;

  const formatDate = (date: Date) => date.toLocaleDateString(ar ? "ar-EG" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    calendar: "gregory",
  });

  return (
    <section className="mb-5 overflow-hidden rounded-2xl border border-[#dfc99f] bg-gradient-to-br from-[#fffaf0] via-[#fff8ea] to-[#f3e4c8] shadow-[0_12px_32px_rgba(109,74,36,0.12)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ead8b8] px-4 py-3 sm:px-5">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#6d4a24] text-white shadow-sm">
            <img src="/sidebar/horse.svg" alt="" className="h-6 w-6 brightness-0 invert" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-[#3b2b20]">{ar ? "ترقّب" : "Foaling watch"}</h2>
              <span className="rounded-full bg-[#b87422] px-2 py-0.5 text-[9px] font-black text-white">
                {formatDate(calendarEventDate(alerts[0]))}
              </span>
            </div>
            <p className="text-[11px] font-medium text-[#8a725a]">
              {ar ? "موعد ولادة قريب يحتاج إلى المتابعة" : "A nearby foaling date needs attention"}
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
          const daysUntil = Math.max(0, Math.ceil((start.getTime() - todayStart.getTime()) / 86_400_000));
          return (
            <button
              key={event.id}
              type="button"
              onClick={() => onSelectDate?.(start)}
              className="group rounded-xl border border-[#e5d3b5] bg-white/90 p-3 text-start shadow-sm transition hover:-translate-y-0.5 hover:border-[#9a7448] hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="line-clamp-1 text-sm font-black text-[#3b2b20]">{title}</p>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#f7ead5] px-2 py-1 text-[10px] font-black text-[#8a561b]">
                  <Clock3 className="h-3 w-3" />
                  {daysUntil === 0 ? (ar ? "اليوم" : "Today") : ar ? `${daysUntil.toLocaleString("ar-EG")} أيام` : `${daysUntil} days`}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2 text-[11px] font-bold text-[#6f5a47]" dir="ltr">
                <CalendarRange className="h-4 w-4 shrink-0 text-[#9a7448]" />
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
