import type { CalendarEventDto } from "@/lib/api/types";

const DATE_PREFIX = /^(\d{4})-(\d{2})-(\d{2})/;

/** Keep an all-day event on the calendar date returned by the API. */
export function calendarDate(value: Date | string, allDay = false) {
  if (typeof value === "string" && allDay) {
    const match = value.match(DATE_PREFIX);
    if (match) return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }
  return typeof value === "string" ? new Date(value) : new Date(value);
}

export function calendarDateKey(value: Date | string, allDay = false) {
  const date = calendarDate(value, allDay);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function calendarEventDate(event: CalendarEventDto) {
  return calendarDate(event.start, event.allDay);
}

export function calendarEventDateKey(event: CalendarEventDto) {
  return calendarDateKey(event.start, event.allDay);
}
