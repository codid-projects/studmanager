"use client";

import { MainLayout } from "@/components/layout/MainLayout";
import { clientApiFetch } from "@/lib/api/client";
import type { ApiResult, CalendarEventDto, CalendarEventPayload, CalendarEventType } from "@/lib/api/types";
import { useLocale, useTranslation } from "@/lib/locale-context";
import { CalendarDays, ChevronLeft, ChevronRight, Edit3, Plus, Trash2, X } from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type ViewMode = "month" | "week" | "day";

const DEFAULT_COLORS = ["#ffe0b2", "#dff3dc", "#dbeafe", "#fce7f3", "#ede9fe", "#fee2e2"];
const EVENT_TYPES: Array<{ value: CalendarEventType; key: string; fallbackEn: string; fallbackAr: string }> = [
  { value: 1, key: "general", fallbackEn: "General", fallbackAr: "عام" },
  { value: 2, key: "nutrition", fallbackEn: "Nutrition", fallbackAr: "تغذية" },
  { value: 3, key: "ovulationExamination", fallbackEn: "Ovulation examination", fallbackAr: "فحص تبويض" },
  { value: 4, key: "mareBreedingSoundness", fallbackEn: "Mare breeding soundness", fallbackAr: "فحص جاهزية الفرس" },
];

const emptyForm = {
  title: "",
  titleAr: "",
  description: "",
  descriptionAr: "",
  eventDate: "",
  endDate: "",
  isAllDay: false,
  eventType: 1 as CalendarEventType,
  color: DEFAULT_COLORS[0],
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getMonthStartOffset(year: number, month: number, isRTL: boolean) {
  const day = new Date(year, month, 1).getDay();
  return isRTL ? (day + 1) % 7 : day;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function toDateInputValue(date: Date) {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
}

function toDateKey(date: Date | string) {
  const resolved = typeof date === "string" ? new Date(date) : date;
  return `${resolved.getFullYear()}-${String(resolved.getMonth() + 1).padStart(2, "0")}-${String(resolved.getDate()).padStart(2, "0")}`;
}

function isDarkColor(hex: string) {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) return false;
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 145;
}

function getEventColor(event: CalendarEventDto) {
  return event.color || DEFAULT_COLORS[event.id % DEFAULT_COLORS.length];
}

function getEventTypeValue(type: string | null | undefined): CalendarEventType {
  const normalized = (type ?? "").toLowerCase();
  if (normalized.includes("nutrition")) return 2;
  if (normalized.includes("ovulation")) return 3;
  if (normalized.includes("marebreedingsoundness")) return 4;
  return 1;
}

function unwrapResult<T>(payload: T | ApiResult<T>): T {
  if (payload && typeof payload === "object" && "data" in payload && "statusCode" in payload) {
    return (payload as ApiResult<T>).data as T;
  }

  return payload as T;
}

export default function CalendarPage() {
  const { locale, direction } = useLocale();
  const { t } = useTranslation();
  const isRTL = direction === "rtl";
  const today = useMemo(() => new Date(), []);
  const [currentDate, setCurrentDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(today));
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [events, setEvents] = useState<CalendarEventDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEventDto | null>(null);
  const [form, setForm] = useState(emptyForm);

  const label = useCallback((key: string, fallbackEn: string, fallbackAr: string) => {
    const value = t(key);
    if (value !== key) return value;
    return locale === "ar" ? fallbackAr : fallbackEn;
  }, [locale, t]);

  const days = useMemo(
    () =>
      isRTL
        ? [t("days.saturday"), t("days.sunday"), t("days.monday"), t("days.tuesday"), t("days.wednesday"), t("days.thursday"), t("days.friday")]
        : [t("days.sunday"), t("days.monday"), t("days.tuesday"), t("days.wednesday"), t("days.thursday"), t("days.friday"), t("days.saturday")],
    [isRTL, t],
  );

  const months = useMemo(
    () => [
      t("months.january"),
      t("months.february"),
      t("months.march"),
      t("months.april"),
      t("months.may"),
      t("months.jun"),
      t("months.july"),
      t("months.august"),
      t("months.september"),
      t("months.october"),
      t("months.november"),
      t("months.december"),
    ],
    [t],
  );

  const range = useMemo(() => {
    const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);
    return { start, end };
  }, [currentDate]);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const payload = await clientApiFetch<ApiResult<CalendarEventDto[]> | CalendarEventDto[]>({
        backendPath: "/api/Calendar",
        nextPath: "/api/calendar",
        query: { from: range.start.toISOString(), to: range.end.toISOString(), locale },
        locale,
      });
      setEvents(unwrapResult(payload) ?? []);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [locale, range.end, range.start]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const eventsByDay = useMemo(() => {
    const grouped = new Map<string, CalendarEventDto[]>();
    events.forEach((event) => {
      const key = toDateKey(event.start);
      grouped.set(key, [...(grouped.get(key) ?? []), event]);
    });
    return grouped;
  }, [events]);

  const monthCells = useMemo(() => {
    const firstDay = getMonthStartOffset(currentDate.getFullYear(), currentDate.getMonth(), isRTL);
    const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
    const cells: Date[] = [];

    for (let i = firstDay; i > 0; i -= 1) cells.push(addDays(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1), -i));
    for (let day = 1; day <= daysInMonth; day += 1) cells.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
    while (cells.length % 7 !== 0) cells.push(addDays(cells[cells.length - 1], 1));

    return cells;
  }, [currentDate, isRTL]);

  const selectedEvents = eventsByDay.get(toDateKey(selectedDate)) ?? [];
  const selectedCellIndex = monthCells.findIndex((date) => toDateKey(date) === toDateKey(selectedDate));
  const selectedWeekStart = selectedCellIndex >= 0 ? Math.floor(selectedCellIndex / 7) * 7 : 0;
  const visibleList = viewMode === "month"
    ? events
    : viewMode === "day"
      ? selectedEvents
      : monthCells
          .slice(selectedWeekStart)
          .slice(0, 7)
          .flatMap((date) => eventsByDay.get(toDateKey(date)) ?? []);

  const openCreateModal = (date = selectedDate) => {
    setEditingEvent(null);
    setForm({ ...emptyForm, eventDate: toDateInputValue(new Date(date.getFullYear(), date.getMonth(), date.getDate(), 9)) });
    setModalOpen(true);
  };

  const openEditModal = (event: CalendarEventDto) => {
    setEditingEvent(event);
    setForm({
      title: event.title,
      titleAr: event.titleAr,
      description: event.description ?? "",
      descriptionAr: event.descriptionAr ?? "",
      eventDate: toDateInputValue(new Date(event.start)),
      endDate: event.end ? toDateInputValue(new Date(event.end)) : "",
      isAllDay: event.allDay,
      eventType: getEventTypeValue(event.type),
      color: getEventColor(event),
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingEvent(null);
    setForm(emptyForm);
  };

  const submitEvent = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);

    const payload: CalendarEventPayload = {
      title: form.title.trim(),
      titleAr: form.titleAr.trim() || form.title.trim(),
      description: form.description.trim() || null,
      descriptionAr: form.descriptionAr.trim() || null,
      eventDate: new Date(form.eventDate).toISOString(),
      endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
      isAllDay: form.isAllDay,
      eventType: form.eventType,
      color: form.color,
      relatedEntityType: editingEvent?.relatedEntityType ?? null,
      relatedEntityId: editingEvent?.relatedEntityId ?? null,
    };

    try {
      await clientApiFetch({
        method: editingEvent ? "PUT" : "POST",
        backendPath: editingEvent ? `/api/Calendar/${editingEvent.id}` : "/api/Calendar",
        nextPath: editingEvent ? `/api/calendar/${editingEvent.id}` : "/api/calendar",
        query: { locale },
        body: payload,
        locale,
      });
      closeModal();
      await loadEvents();
    } finally {
      setSaving(false);
    }
  };

  const deleteEvent = async () => {
    if (!editingEvent) return;
    setSaving(true);
    try {
      await clientApiFetch({
        method: "DELETE",
        backendPath: `/api/Calendar/${editingEvent.id}`,
        nextPath: `/api/calendar/${editingEvent.id}`,
        query: { locale },
        locale,
      });
      closeModal();
      await loadEvents();
    } finally {
      setSaving(false);
    }
  };

  const prevMonth = () => {
    setCurrentDate((date) => {
      const next = new Date(date.getFullYear(), date.getMonth() - 1, 1);
      setSelectedDate(next);
      return next;
    });
  };
  const nextMonth = () => {
    setCurrentDate((date) => {
      const next = new Date(date.getFullYear(), date.getMonth() + 1, 1);
      setSelectedDate(next);
      return next;
    });
  };

  return (
    <MainLayout>
      <div className={`mx-auto max-w-[1400px] p-4 sm:p-6 ${isRTL ? "font-cairo text-right" : "text-left"}`} dir={direction}>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-[#3b2b20]">{t("calendar.title")}</h1>
          <button
            onClick={() => openCreateModal()}
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#3b2b20] px-4 text-sm font-semibold text-white"
          >
            <Plus className="h-4 w-4" />
            {label("calendar.addEvent", "Add event", "إضافة حدث")}
          </button>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_20rem]">
          <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <button onClick={prevMonth} className="rounded-full border border-[#d8d0c8] p-2 text-[#3b2b20] hover:bg-[#f8f4f0]" aria-label={t("common.back")}>
                  {isRTL ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
                </button>
                <button onClick={nextMonth} className="rounded-full border border-[#d8d0c8] p-2 text-[#3b2b20] hover:bg-[#f8f4f0]" aria-label={t("common.next")}>
                  {isRTL ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                </button>
              </div>

              <h2 className="text-xl font-bold text-[#3b2b20]">
                {months[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>

              <div className="flex overflow-hidden rounded-lg border border-[#3b2b20] text-sm font-semibold">
                {(["day", "week", "month"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`min-w-16 px-4 py-2 ${viewMode === mode ? "bg-[#3b2b20] text-white" : "bg-white text-[#3b2b20] hover:bg-[#f8f4f0]"}`}
                  >
                    {mode === "month" ? t("calendar.viewMonth") : mode === "week" ? t("calendar.viewWeek") : t("calendar.viewDay")}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-2 grid grid-cols-7">
              {days.map((day) => (
                <div key={day} className="py-2 text-center text-sm font-semibold text-[#8c847c]">{day}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 overflow-hidden rounded-xl border border-[#e6dfd8]">
              {monthCells.map((date) => {
                const key = toDateKey(date);
                const dayEvents = eventsByDay.get(key) ?? [];
                const outside = date.getMonth() !== currentDate.getMonth();
                const selected = key === toDateKey(selectedDate);

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedDate(startOfDay(date))}
                    onDoubleClick={() => openCreateModal(date)}
                    className={`min-h-[104px] border-b border-e border-[#eee8e1] p-2 text-start transition hover:bg-[#fbf8f4] sm:min-h-[132px] ${outside ? "bg-[#fafafa] text-[#c8c2bd]" : "bg-white text-[#3b2b20]"} ${selected ? "ring-2 ring-inset ring-[#4b2f1a]" : ""}`}
                  >
                    <span className="text-sm font-bold">{date.getDate()}</span>
                    <div className="mt-2 space-y-1">
                      {dayEvents.slice(0, 3).map((event) => {
                        const color = getEventColor(event);
                        return (
                          <div
                            key={event.id}
                            className="truncate rounded-md px-2 py-1 text-[11px] font-semibold"
                            style={{ backgroundColor: color, color: isDarkColor(color) ? "#fff" : "#3b2b20" }}
                          >
                            {locale === "ar" ? event.titleAr || event.title : event.title || event.titleAr}
                          </div>
                        );
                      })}
                      {dayEvents.length > 3 && <div className="text-xs font-semibold text-[#8c847c]">+{dayEvents.length - 3}</div>}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <aside className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-bold text-[#3b2b20]">{viewMode === "month" ? t("calendar.event") : selectedDate.toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" })}</h3>
                <p className="mt-1 text-sm text-[#8c847c]">
                  {loading ? t("common.loading") : `${visibleList.length} ${label("calendar.events", "events", "أحداث")}`}
                </p>
              </div>
              <CalendarDays className="h-6 w-6 text-[#4b2f1a]" />
            </div>

            <div className="space-y-3">
              {visibleList.length === 0 && !loading ? (
                <div className="rounded-xl bg-[#f8f4f0] p-6 text-center text-sm font-semibold text-[#8c847c]">{t("common.noRecordsFound")}</div>
              ) : (
                visibleList.map((event) => {
                  const color = getEventColor(event);
                  return (
                    <button key={event.id} onClick={() => openEditModal(event)} className="w-full rounded-xl border border-[#efe7df] bg-white p-4 text-start shadow-sm transition hover:border-[#4b2f1a]">
                      <div className="mb-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                      <div className="font-bold text-[#3b2b20]">{locale === "ar" ? event.titleAr || event.title : event.title || event.titleAr}</div>
                      <div className="mt-1 text-sm text-[#8c847c]">
                        {event.allDay ? label("calendar.allDay", "All day", "طوال اليوم") : new Date(event.start).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>
        </div>

        {modalOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4" dir={direction}>
            <form onSubmit={submitEvent} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
              <div className="flex items-center justify-between border-b border-[#f1ece8] px-6 py-5">
                <button type="button" onClick={closeModal} className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f8f4f0] text-[#4b2f1a]" aria-label="Close">
                  <X className="h-5 w-5" />
                </button>
                <h2 className="text-xl font-bold text-[#4b2f1a]">{editingEvent ? label("calendar.editEvent", "Edit event", "تعديل حدث") : label("calendar.addEvent", "Add event", "إضافة حدث")}</h2>
              </div>

              <div className="grid gap-4 px-6 py-5 sm:grid-cols-2">
                <input required value={form.title} onChange={(event) => setForm((value) => ({ ...value, title: event.target.value }))} placeholder={label("calendar.titleEn", "English title", "العنوان بالإنجليزية")} className="h-12 rounded-lg border border-[#ded6ce] px-4 outline-none focus:border-[#4b2f1a]" />
                <input required value={form.titleAr} onChange={(event) => setForm((value) => ({ ...value, titleAr: event.target.value }))} placeholder={label("calendar.titleAr", "Arabic title", "العنوان بالعربية")} className="h-12 rounded-lg border border-[#ded6ce] px-4 outline-none focus:border-[#4b2f1a]" />
                <input required type="datetime-local" value={form.eventDate} onChange={(event) => setForm((value) => ({ ...value, eventDate: event.target.value }))} className="h-12 rounded-lg border border-[#ded6ce] px-4 outline-none focus:border-[#4b2f1a]" />
                <input type="datetime-local" value={form.endDate} onChange={(event) => setForm((value) => ({ ...value, endDate: event.target.value }))} className="h-12 rounded-lg border border-[#ded6ce] px-4 outline-none focus:border-[#4b2f1a]" />
                <select value={form.eventType} onChange={(event) => setForm((value) => ({ ...value, eventType: Number(event.target.value) as CalendarEventType }))} className="h-12 rounded-lg border border-[#ded6ce] px-4 outline-none focus:border-[#4b2f1a]">
                  {EVENT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>{label(`calendar.types.${type.key}`, type.fallbackEn, type.fallbackAr)}</option>
                  ))}
                </select>
                <div className="flex items-center gap-3 rounded-lg border border-[#ded6ce] px-4">
                  <input type="color" value={form.color} onChange={(event) => setForm((value) => ({ ...value, color: event.target.value }))} className="h-9 w-12 cursor-pointer border-0 bg-transparent p-0" />
                  <span className="text-sm font-semibold text-[#6f665e]">{label("calendar.color", "Color", "اللون")}</span>
                </div>
                <textarea value={form.description} onChange={(event) => setForm((value) => ({ ...value, description: event.target.value }))} placeholder={label("calendar.descriptionEn", "English description", "الوصف بالإنجليزية")} className="min-h-24 rounded-lg border border-[#ded6ce] px-4 py-3 outline-none focus:border-[#4b2f1a]" />
                <textarea value={form.descriptionAr} onChange={(event) => setForm((value) => ({ ...value, descriptionAr: event.target.value }))} placeholder={label("calendar.descriptionAr", "Arabic description", "الوصف بالعربية")} className="min-h-24 rounded-lg border border-[#ded6ce] px-4 py-3 outline-none focus:border-[#4b2f1a]" />
                <label className="flex items-center gap-3 text-sm font-semibold text-[#4b2f1a]">
                  <input type="checkbox" checked={form.isAllDay} onChange={(event) => setForm((value) => ({ ...value, isAllDay: event.target.checked }))} />
                  {label("calendar.allDay", "All day", "طوال اليوم")}
                </label>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#f1ece8] px-6 py-4">
                {editingEvent ? (
                  <button type="button" disabled={saving} onClick={deleteEvent} className="inline-flex h-11 items-center gap-2 rounded-lg bg-red-50 px-4 text-sm font-semibold text-red-600 disabled:opacity-50">
                    <Trash2 className="h-4 w-4" />
                    {label("common.delete", "Delete", "حذف")}
                  </button>
                ) : <span />}
                <button type="submit" disabled={saving} className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#3b2b20] px-5 text-sm font-semibold text-white disabled:opacity-50">
                  <Edit3 className="h-4 w-4" />
                  {saving ? t("common.loading") : label("common.save", "Save", "حفظ")}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
