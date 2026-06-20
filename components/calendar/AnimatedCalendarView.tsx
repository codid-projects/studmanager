"use client";

import type { CalendarEventDto } from "@/lib/api/types";
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, Layers3 } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";

export type AnimatedCalendarMode = "day" | "week" | "month" | "swipe";

type Props = {
  mode: AnimatedCalendarMode;
  monthDate: Date;
  selectedDate: Date;
  days: string[];
  locale: string;
  isRTL: boolean;
  events: CalendarEventDto[];
  getEventColor: (event: CalendarEventDto) => string;
  getEventTitle: (event: CalendarEventDto) => string;
  getEventDescription: (event: CalendarEventDto) => string | null | undefined;
  getEventTime: (event: CalendarEventDto) => string;
  onDateClick: (date: Date) => void;
  onEventClick?: (event: CalendarEventDto) => void;
  onOpenDay?: (date: Date) => void;
};

function dateKey(date: Date | string) {
  const value = typeof date === "string" ? new Date(date) : date;
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function monthOffset(date: Date, isRTL: boolean) {
  return isRTL ? (date.getDay() + 1) % 7 : date.getDay();
}

function buildMonth(date: Date, isRTL: boolean) {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const cells: Date[] = [];
  for (let offset = monthOffset(first, isRTL); offset > 0; offset -= 1) cells.push(addDays(first, -offset));
  const count = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  for (let day = 1; day <= count; day += 1) cells.push(new Date(date.getFullYear(), date.getMonth(), day));
  while (cells.length % 7) cells.push(addDays(cells[cells.length - 1], 1));
  return cells;
}

export function AnimatedCalendarView(props: Props) {
  const { mode, monthDate, selectedDate, days, locale, isRTL, events, onDateClick, onEventClick } = props;
  const cells = useMemo(() => buildMonth(monthDate, isRTL), [monthDate, isRTL]);
  const byDay = useMemo(() => {
    const map = new Map<string, CalendarEventDto[]>();
    events.forEach((event) => map.set(dateKey(event.start), [...(map.get(dateKey(event.start)) ?? []), event]));
    return map;
  }, [events]);
  const selectedIndex = Math.max(0, cells.findIndex((date) => dateKey(date) === dateKey(selectedDate)));
  const week = cells.slice(Math.floor(selectedIndex / 7) * 7, Math.floor(selectedIndex / 7) * 7 + 7);
  return (
    <div key={`${mode}-${dateKey(monthDate)}-${dateKey(selectedDate)}`} className="calendar-view-enter">
      {mode === "month" && <MonthView {...props} cells={cells} byDay={byDay} />}
      {mode === "week" && <WeekView {...props} week={week} byDay={byDay} />}
      {mode === "day" && <DayView {...props} dayEvents={byDay.get(dateKey(selectedDate)) ?? []} />}
      {mode === "swipe" && <SwipeView {...props} cells={cells.filter((date) => date.getMonth() === monthDate.getMonth())} />}
    </div>
  );
}

function MonthView(props: Props & { cells: Date[]; byDay: Map<string, CalendarEventDto[]> }) {
  return <>
    <div className="mb-2 grid grid-cols-7 gap-1 rounded-2xl bg-[#f5efe9] p-1">
      {props.days.map((day) => <div key={day} className="rounded-xl py-2 text-center text-xs font-bold text-[#8c847c] sm:text-sm">{day}</div>)}
    </div>
    <div className="grid grid-cols-7 gap-1 rounded-[1.4rem] bg-[#f1e9e2] p-1.5 shadow-inner">
      {props.cells.map((date, index) => {
        const dayEvents = props.byDay.get(dateKey(date)) ?? [];
        const selected = dateKey(date) === dateKey(props.selectedDate);
        const outside = date.getMonth() !== props.monthDate.getMonth();
        return <button key={dateKey(date)} type="button" onClick={() => props.onDateClick(date)} style={{ animationDelay: `${Math.min(index, 20) * 15}ms` }}
          className={`calendar-cell-rise group relative min-h-[82px] rounded-xl p-2 text-start transition-all duration-300 sm:min-h-[128px] ${outside ? "bg-white/45 text-[#c5bdb6]" : "bg-white text-[#3b2b20] hover:-translate-y-1 hover:shadow-xl"} ${selected ? "ring-2 ring-[#4b2f1a] ring-offset-1" : ""}`}>
          <span className={`inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-sm font-bold transition-colors ${selected ? "bg-[#4b2f1a] text-white" : "group-hover:bg-[#f1e7df]"}`}>{date.getDate()}</span>
          <div className="mt-2 space-y-1">
            {dayEvents.slice(0, 3).map((event) => {
              return <div key={event.id} role="button" tabIndex={0} onClick={(e) => { e.stopPropagation(); props.onOpenDay?.(new Date(event.start)); }}
                onKeyDown={(key) => { if (key.key === "Enter" || key.key === " ") { key.preventDefault(); key.stopPropagation(); props.onOpenDay?.(new Date(event.start)); } }}
                className="truncate rounded-md px-2 py-1 text-[10px] font-bold shadow-sm transition-all duration-300 hover:scale-[1.03] sm:text-[11px]"
                style={{ backgroundColor: props.getEventColor(event), color: "#3b2b20" }}>
                <div className="truncate">{props.getEventTitle(event)}</div>
              </div>;
            })}
            {dayEvents.length > 3 && <div className="text-[10px] font-bold text-[#8c847c]">+{dayEvents.length - 3}</div>}
          </div>
        </button>;
      })}
    </div>
  </>;
}

function WeekView(props: Props & { week: Date[]; byDay: Map<string, CalendarEventDto[]> }) {
  return <div className="grid min-h-[460px] grid-cols-1 gap-3 sm:grid-cols-7">
    {props.week.map((date, index) => {
      const dayEvents = props.byDay.get(dateKey(date)) ?? [];
      const selected = dateKey(date) === dateKey(props.selectedDate);
      return <button key={dateKey(date)} type="button" onClick={() => props.onDateClick(date)} style={{ animationDelay: `${index * 55}ms` }}
        className={`calendar-cell-rise flex min-h-28 flex-col rounded-2xl border p-3 text-start transition-all duration-300 sm:min-h-[460px] ${selected ? "border-[#4b2f1a] bg-[#fff9f3] shadow-xl" : "border-[#eee5de] bg-white hover:-translate-y-1 hover:shadow-lg"}`}>
        <div className="mb-4 text-center">
          <div className="text-xs font-bold text-[#9b9189]">{props.days[index]}</div>
          <div className={`mx-auto mt-2 flex h-10 w-10 items-center justify-center rounded-full text-lg font-black ${selected ? "bg-[#4b2f1a] text-white" : "bg-[#f6f0eb] text-[#3b2b20]"}`}>{date.getDate()}</div>
        </div>
        <div className="space-y-2">
          {dayEvents.map((event) => {
            return <div key={event.id} role="button" tabIndex={0} onClick={(e) => { e.stopPropagation(); props.onOpenDay?.(new Date(event.start)); }} className="rounded-xl p-2.5 shadow-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-lg" style={{ backgroundColor: props.getEventColor(event) }}>
              <div className="text-[11px] font-black text-[#3b2b20]">{props.getEventTitle(event)}</div>
              <div className="mt-1 flex items-center gap-1 text-[9px] font-bold text-[#6f665e]"><Clock3 className="h-3 w-3" />{props.getEventTime(event)}</div>
            </div>;
          })}
          {!dayEvents.length && <div className="rounded-xl border border-dashed border-[#ddd2c9] py-5 text-center text-[10px] font-bold text-[#b5aaa1]">{props.locale === "ar" ? "لا توجد أحداث" : "No events"}</div>}
        </div>
      </button>;
    })}
  </div>;
}

function DayView(props: Props & { dayEvents: CalendarEventDto[] }) {
  const hours = [8, 10, 12, 14, 16, 18, 20];
  return <div className="rounded-[1.6rem] border border-[#eee5de] bg-white shadow-sm">
    <div className="flex items-center gap-4 bg-gradient-to-l from-[#4b2f1a] to-[#765033] p-5 text-white">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-3xl font-black backdrop-blur">{props.selectedDate.getDate()}</div>
      <div><div className="text-sm font-semibold text-white/70">{props.selectedDate.toLocaleDateString(props.locale, { weekday: "long" })}</div><div className="text-xl font-black">{props.selectedDate.toLocaleDateString(props.locale, { month: "long", year: "numeric" })}</div></div>
    </div>
    <div className="relative min-h-[430px] overflow-hidden p-4 sm:p-6">
      <div className="pointer-events-none absolute inset-x-4 top-4 sm:inset-x-6 sm:top-6" aria-hidden="true">
        {hours.map((hour) => <div key={hour} className="flex h-14 gap-3"><span className="w-12 text-xs font-bold text-[#a1978f]">{new Date(2000, 0, 1, hour).toLocaleTimeString(props.locale, { hour: "numeric" })}</span><div className="mt-2 flex-1 border-t border-dashed border-[#e8dfd7]" /></div>)}
      </div>
      <div className="relative z-10 min-h-[382px] space-y-3 ps-16 sm:ps-20">
        {props.dayEvents.map((event, index) => {
          return <div key={event.id} role="button" tabIndex={0} onClick={() => props.onEventClick?.(event)} style={{ backgroundColor: props.getEventColor(event), animationDelay: `${index * 80}ms` }} className="calendar-cell-rise w-full rounded-2xl border border-white/70 p-4 text-start shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl">
            <div className="whitespace-normal break-words font-black text-[#3b2b20]">{props.getEventTitle(event)}</div>
            <div className="mt-1 text-xs font-bold text-[#6f665e]">{props.getEventTime(event)}</div>
            {props.getEventDescription(event) && <div className="mt-2 whitespace-normal break-words text-xs leading-5 text-[#6f665e]">{props.getEventDescription(event)}</div>}
          </div>;
        })}
        {!props.dayEvents.length && <button onClick={() => props.onDateClick(props.selectedDate)} className="w-full rounded-2xl border-2 border-dashed border-[#ded3ca] bg-[#fbf8f5] p-10 text-center text-sm font-bold text-[#9b9189]">{props.locale === "ar" ? "يوم هادئ — اضغط لإضافة حدث" : "A quiet day — click to add an event"}</button>}
      </div>
    </div>
  </div>;
}

function SwipeView(props: Props & { cells: Date[] }) {
  const items = props.events.length ? props.events.map((event) => ({ id: `e-${event.id}`, date: new Date(event.start), event })) : props.cells.map((date) => ({ id: `d-${dateKey(date)}`, date, event: undefined }));
  const [order, setOrder] = useState(() => items.map((_, index) => index));
  useEffect(() => setOrder(items.map((_, index) => index)), [props.events, props.monthDate]);
  const rotate = (direction: 1 | -1) => setOrder((current) => direction === 1 ? [...current.slice(1), current[0]] : [current[current.length - 1], ...current.slice(0, -1)]);
  if (!items.length) return null;
  const activeItem = items[order[0]] ?? items[0];
  const activeEvent = activeItem.event;
  const slotX = [0, props.isRTL ? -28 : 28, props.isRTL ? -43 : 43, props.isRTL ? -56 : 56, props.isRTL ? -64 : 64];
  const slotY = [0, -10, 1, 12, 20];
  const slotRotate = [props.isRTL ? 2 : -2, props.isRTL ? -2 : 2, props.isRTL ? -4 : 4, props.isRTL ? -6 : 6, props.isRTL ? -7 : 7];
  const slotScale = [1, .92, .865, .815, .78];
  const slotBrightness = [1, .82, .67, .54, .45];

  return <div className="flex min-h-[580px] flex-col items-center justify-center overflow-hidden rounded-[1.8rem] bg-gradient-to-br from-[#f8f2ec] via-white to-[#eee3d9] px-4 py-8">
    <div className="mb-5 flex items-center gap-2 text-sm font-bold text-[#81756c]"><Layers3 className="h-4 w-4" />{props.locale === "ar" ? "اسحب البطاقة لاستعراض المواعيد" : "Swipe a card to browse dates"}</div>
    <div className="relative h-[340px] w-[min(82vw,340px)] touch-none select-none">
      {order.map((itemIndex, rawSlot) => {
        if (rawSlot > 4 && rawSlot !== order.length - 1) return null;
        const item = items[itemIndex];
        if (!item) return null;
        const event = item.event;
        const slot = Math.min(rawSlot, 4);
        return <motion.div key={item.id}
          drag={rawSlot === 0}
          dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
          dragElastic={0.62}
          dragMomentum={false}
          whileDrag={{ cursor: "grabbing", scale: 1.025, zIndex: 100 }}
          onDragEnd={(_, info) => {
            const distance = Math.hypot(info.offset.x, info.offset.y);
            const speed = Math.hypot(info.velocity.x, info.velocity.y);
            if (distance > 52 || speed > 360) rotate(1);
          }}
          onClick={() => rawSlot > 0 && rawSlot < 4 && setOrder((current) => [...current.slice(rawSlot), ...current.slice(0, rawSlot)])}
          animate={{
            x: slotX[slot], y: slotY[slot], rotate: slotRotate[slot], scale: slotScale[slot],
            opacity: rawSlot > 4 ? (rawSlot === order.length - 1 ? .5 : 0) : 1, filter: `brightness(${slotBrightness[slot]})`, zIndex: 50 - rawSlot,
          }}
          transition={{
            zIndex: { delay: .06 }, opacity: { duration: .26 }, filter: { duration: .34, ease: "easeOut" },
            x: { type: "spring", duration: .52, bounce: .12 },
            y: { type: "spring", duration: .46, bounce: .14 },
            rotate: { type: "spring", duration: .48, bounce: .12 },
            scale: { type: "spring", duration: .46, bounce: .12 },
          }}
          className="absolute inset-0 overflow-hidden rounded-[1.6rem] border border-white/80 bg-white shadow-[0_24px_60px_rgba(75,47,26,0.22)]"
          style={{ cursor: rawSlot === 0 ? "grab" : rawSlot < 4 ? "pointer" : "default", pointerEvents: rawSlot < 4 ? "auto" : "none", touchAction: "none" }}>
          <div className="relative h-28 bg-gradient-to-br from-[#4b2f1a] to-[#8a603f] p-5 text-white">
            <CalendarDays className="absolute end-5 top-5 h-7 w-7 text-white/35" />
            <div className="text-xs font-bold text-white/65">{item.date.toLocaleDateString(props.locale, { weekday: "long" })}</div><div className="mt-1 text-3xl font-black">{item.date.getDate()}</div><div className="text-sm font-bold">{item.date.toLocaleDateString(props.locale, { month: "long", year: "numeric" })}</div>
          </div>
          <div className="relative flex h-[212px] flex-col p-6 before:absolute before:-left-3 before:top-0 before:h-6 before:w-6 before:-translate-y-1/2 before:rounded-full before:bg-[#f4ece5] after:absolute after:-right-3 after:top-0 after:h-6 after:w-6 after:-translate-y-1/2 after:rounded-full after:bg-[#f4ece5]">
            <div className="absolute inset-x-5 top-0 border-t-2 border-dashed border-[#ddd1c7]" />
            {event ? <><div className="mb-3 h-2 w-16 rounded-full" style={{ backgroundColor: props.getEventColor(event) }} /><div className="text-xl font-black text-[#3b2b20]">{props.getEventTitle(event)}</div><div className="mt-2 flex items-center gap-2 text-sm font-bold text-[#8c847c]"><Clock3 className="h-4 w-4" />{props.getEventTime(event)}</div><div className="mt-3 line-clamp-2 text-sm leading-6 text-[#6f665e]">{props.getEventDescription(event)}</div></> : <div className="flex flex-1 flex-col items-center justify-center text-center"><div className="text-5xl font-black text-[#4b2f1a]">{item.date.getDate()}</div><div className="mt-2 text-sm font-bold text-[#9b9189]">{props.locale === "ar" ? "لا توجد أحداث في هذا اليوم" : "No events on this day"}</div></div>}
          </div>
        </motion.div>;
      })}
    </div>
    <button
      onClick={() => activeEvent ? props.onEventClick?.(activeEvent) : props.onDateClick(activeItem.date)}
      className="relative z-[60] mt-9 min-w-48 rounded-xl bg-[#4b2f1a] px-7 py-3 text-sm font-black text-white shadow-[0_12px_28px_rgba(75,47,26,.22)] transition-all hover:-translate-y-0.5 hover:bg-[#392114] hover:shadow-xl active:translate-y-0"
    >
      {activeEvent ? (props.locale === "ar" ? "عرض الحدث" : "View event") : (props.locale === "ar" ? "إضافة حدث" : "Add event")}
    </button>
    <div className="mt-5 flex items-center gap-4" dir="ltr">
      <button onClick={() => rotate(-1)} aria-label={props.locale === "ar" ? "السابق" : "Previous"} className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#4b2f1a] shadow-lg transition-transform hover:scale-105">
        <ChevronLeft className="h-5 w-5" />
      </button>
      <span className="min-w-16 text-center text-xs font-black text-[#81756c]">{(order[0] ?? 0) + 1} / {items.length}</span>
      <button onClick={() => rotate(1)} aria-label={props.locale === "ar" ? "التالي" : "Next"} className="flex h-10 w-10 items-center justify-center rounded-full bg-[#4b2f1a] text-white shadow-lg transition-transform hover:scale-105">
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  </div>;
}
