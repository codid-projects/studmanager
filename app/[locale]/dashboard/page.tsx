'use client';

import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Edit3,
  FileText,
  Info,
  Leaf,
  Mars,
  Plus,
  Venus,
  X,
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { clientApiFetch } from '@/lib/api/client';
import { useLocale, useTranslation } from '@/lib/locale-context';
import type {
  ActivityDto,
  ApiResult,
  CalendarEventDto,
  CalendarEventPayload,
  CalendarEventType,
  DashboardDto,
  DefaultStudDto,
  PagedResponse,
} from '@/lib/api/types';

type ViewMode = 'day' | 'week' | 'month';

const DEFAULT_COLORS = ['#ffe0b2', '#dff3dc', '#dbeafe', '#fce7f3', '#ede9fe', '#fee2e2'];
const EVENT_TYPES: Array<{ value: CalendarEventType; key: string; fallbackEn: string; fallbackAr: string }> = [
  { value: 1, key: 'general', fallbackEn: 'General', fallbackAr: 'عام' },
  { value: 2, key: 'nutrition', fallbackEn: 'Nutrition', fallbackAr: 'تغذية' },
  { value: 3, key: 'ovulationExamination', fallbackEn: 'Ovulation examination', fallbackAr: 'فحص تبويض' },
  { value: 4, key: 'mareBreedingSoundness', fallbackEn: 'Mare breeding soundness', fallbackAr: 'فحص جاهزية الفرس' },
];

const emptyEventForm = {
  title: '',
  titleAr: '',
  description: '',
  descriptionAr: '',
  eventDate: '',
  endDate: '',
  isAllDay: false,
  eventType: 1 as CalendarEventType,
  color: DEFAULT_COLORS[0],
};

const emptyDashboard: DashboardDto = {
  horsesInStud: { male: 0, female: 0, total: 0 },
  birthedThisYear: { male: 0, female: 0, total: 0 },
  bredByStud: { male: 0, female: 0, total: 0 },
  sales: 0,
  expenses: 0,
  profit: 0,
};

const emptyStud: DefaultStudDto = {
  id: 0,
  studbookId: null,
  studName: null,
  studArabicName: null,
  studEmail: null,
  primaryPhoneNumber: null,
  secondryPhoneNumber: null,
  registrationNumber: null,
  studProfileImage: null,
};

function unwrapResult<T>(payload: T | ApiResult<T>): T {
  if (payload && typeof payload === 'object' && 'data' in payload && 'statusCode' in payload) {
    return (payload as ApiResult<T>).data as T;
  }

  return payload as T;
}

function formatNumber(value: number | null | undefined) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value ?? 0);
}

function formatCurrency(value: number | null | undefined) {
  return `${formatNumber(value)}$`;
}

function timeAgo(value: string | null, locale: string) {
  if (!value) return locale === 'ar' ? 'الآن' : 'Now';

  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.round(diff / 60000));
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (minutes < 60) return rtf.format(-minutes, 'minute');

  const hours = Math.round(minutes / 60);
  if (hours < 24) return rtf.format(-hours, 'hour');

  return rtf.format(-Math.round(hours / 24), 'day');
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getMonthStartOffset(year: number, month: number, isRTL: boolean) {
  const day = new Date(year, month, 1).getDay();
  return isRTL ? (day + 1) % 7 : day;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function toDateKey(date: Date | string) {
  const resolved = typeof date === 'string' ? new Date(date) : date;
  return `${resolved.getFullYear()}-${String(resolved.getMonth() + 1).padStart(2, '0')}-${String(resolved.getDate()).padStart(2, '0')}`;
}

function toDateInputValue(date: Date) {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
}

function isDarkColor(hex: string) {
  const normalized = hex.replace('#', '');
  if (normalized.length !== 6) return false;
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 145;
}

function getCalendarEventColor(event: CalendarEventDto) {
  return event.color || '#ffe0b2';
}

function ActivityRow({
  activity,
  locale,
  spacious = false,
}: {
  activity: ActivityDto;
  locale: string;
  spacious?: boolean;
}) {
  return (
  <div
      dir={locale === "ar" ? "rtl" : "ltr"}
      className={`border-b border-[#f1ece8] pb-4 last:border-0 ${
        spacious ? "py-2" : ""
      }`}
    >
      <div className="min-w-0">
        <p
          className={`font-semibold text-[#4b2f1a] ${
            spacious
              ? "text-lg leading-7 break-words whitespace-normal"
              : "text-base break-words whitespace-normal"
          }`}
        >
          {locale === "ar"
            ? activity.descriptionAr || activity.descriptionEn
            : activity.descriptionEn || activity.descriptionAr}
        </p>

        <p className="mt-1 text-sm text-[#8c847c]">
          {timeAgo(activity.createdAt, locale)}
        </p>

        {spacious && activity.createdBy && (
          <p className="mt-1 text-sm text-[#8c847c] break-words">
            {activity.createdBy}
          </p>
        )}
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-[1280px] animate-pulse space-y-6" aria-busy="true" aria-label="Loading dashboard">
      <section className="grid overflow-hidden rounded-2xl bg-[#e3dfd6] md:grid-cols-2">
        {[0, 1].map((item) => (
          <div key={item} className="flex min-h-[185px] flex-col items-center justify-center gap-4 border-white/50 px-7 py-8 first:md:border-e">
            <div className="h-12 w-24 rounded-xl bg-white/55" />
            <div className="h-7 w-44 rounded-lg bg-white/55" />
            <div className="grid w-52 grid-cols-2 gap-5">
              <div className="h-12 rounded-lg bg-white/45" />
              <div className="h-12 rounded-lg bg-white/45" />
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
        <div className="grid gap-4 md:grid-cols-[0.85fr_1fr_1fr]">
          <div className="min-h-[270px] rounded-2xl bg-white p-6 shadow-sm">
            <div className="h-7 w-36 rounded bg-[#eee9e3]" />
            <div className="mt-8 space-y-7">
              {[0, 1, 2].map((item) => <div key={item} className="h-8 rounded-lg bg-[#f2eee9]" />)}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 md:col-span-2">
            {[0, 1, 2, 3, 4].map((item) => (
              <div key={item} className={`min-h-[125px] rounded-2xl bg-white p-6 shadow-sm ${item === 4 ? 'sm:col-span-2' : ''}`}>
                <div className="ms-auto h-6 w-24 rounded bg-[#eee9e3]" />
                <div className="ms-auto mt-4 h-7 w-36 rounded bg-[#f2eee9]" />
              </div>
            ))}
          </div>
        </div>
        <div className="min-h-[370px] rounded-xl border border-[#e2ddd7] bg-white p-7 shadow-sm">
          <div className="ms-auto h-8 w-40 rounded bg-[#eee9e3]" />
          <div className="mt-9 space-y-5">
            {[0, 1, 2, 3, 4].map((item) => <div key={item} className="h-7 rounded bg-[#f2eee9]" />)}
          </div>
        </div>
      </section>
    </div>
  );
}

export default function DashboardPage() {
  const { locale, direction } = useLocale();
  const { t } = useTranslation();
  const [dashboard, setDashboard] = useState<DashboardDto>(emptyDashboard);
  const [stud, setStud] = useState<DefaultStudDto>(emptyStud);
  const [activities, setActivities] = useState<ActivityDto[]>([]);
  const [activityPageInfo, setActivityPageInfo] = useState<PagedResponse<ActivityDto> | null>(null);
  const [activityPage, setActivityPage] = useState(1);
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [activityLoading, setActivityLoading] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [activeView, setActiveView] = useState<ViewMode>('month');
  const [calendarDate, setCalendarDate] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(() => startOfDay(new Date()));
  const [calendarEvents, setCalendarEvents] = useState<CalendarEventDto[]>([]);
  const [calendarRefreshKey, setCalendarRefreshKey] = useState(0);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [eventSaving, setEventSaving] = useState(false);
  const [eventForm, setEventForm] = useState(emptyEventForm);
  const isRTL = direction === 'rtl';

  async function loadActivities(pageNumber: number, pageSize = 6) {
    setActivityLoading(true);

    try {
      const payload = await clientApiFetch<ApiResult<PagedResponse<ActivityDto>> | PagedResponse<ActivityDto>>({
        backendPath: '/api/Dashboard/activities',
        nextPath: '/api/dashboard/activities',
        query: { pageNumber, pageSize, locale },
        locale,
      });
      const result = unwrapResult(payload);
      setActivities(result?.data ?? []);
      setActivityPageInfo(result ?? null);
      setActivityPage(pageNumber);
    } catch {
      setActivities([]);
      setActivityPageInfo(null);
    } finally {
      setActivityLoading(false);
    }
  }

  useEffect(() => {
    let mounted = true;

    async function loadDashboardData() {
      setDashboardLoading(true);
      const [dashboardResult, studResult] = await Promise.allSettled([
        clientApiFetch<ApiResult<DashboardDto> | DashboardDto>({
          backendPath: '/api/Dashboard',
          nextPath: '/api/dashboard',
          locale,
        }),
        clientApiFetch<ApiResult<DefaultStudDto>>({
          backendPath: '/default',
          nextPath: '/api/default',
          query: { locale },
          locale,
        }),
      ]);

      if (!mounted) return;

      if (dashboardResult.status === 'fulfilled') {
        setDashboard(unwrapResult(dashboardResult.value) ?? emptyDashboard);
      }

      if (studResult.status === 'fulfilled') {
        setStud(unwrapResult(studResult.value) ?? emptyStud);
      }

      setDashboardLoading(false);
    }

    loadDashboardData();
    loadActivities(1, 6);

    return () => {
      mounted = false;
    };
  }, [locale]);

  useEffect(() => {
    let mounted = true;
    const from = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1);
    const to = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0, 23, 59, 59);

    async function loadCalendarEvents() {
      try {
        const payload = await clientApiFetch<ApiResult<CalendarEventDto[]> | CalendarEventDto[]>({
          backendPath: '/api/Calendar',
          nextPath: '/api/calendar',
          query: { from: from.toISOString(), to: to.toISOString(), locale },
          locale,
        });

        if (mounted) setCalendarEvents(unwrapResult(payload) ?? []);
      } catch {
        if (mounted) setCalendarEvents([]);
      }
    }

    loadCalendarEvents();

    return () => {
      mounted = false;
    };
  }, [calendarDate, calendarRefreshKey, locale]);

  const displayDays = useMemo(
    () =>
      isRTL
        ? [
            t('days.saturday'),
            t('days.sunday'),
            t('days.monday'),
            t('days.tuesday'),
            t('days.wednesday'),
            t('days.thursday'),
            t('days.friday'),
          ]
        : [
            t('days.sunday'),
            t('days.monday'),
            t('days.tuesday'),
            t('days.wednesday'),
            t('days.thursday'),
            t('days.friday'),
            t('days.saturday'),
          ],
    [isRTL, t],
  );
  const calendarCells = useMemo(() => {
    const firstDay = getMonthStartOffset(calendarDate.getFullYear(), calendarDate.getMonth(), isRTL);
    const daysInMonth = getDaysInMonth(calendarDate.getFullYear(), calendarDate.getMonth());
    const cells: Date[] = [];

    for (let i = firstDay; i > 0; i -= 1) cells.push(addDays(new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1), -i));
    for (let day = 1; day <= daysInMonth; day += 1) cells.push(new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day));
    while (cells.length % 7 !== 0) cells.push(addDays(cells[cells.length - 1], 1));

    return cells;
  }, [calendarDate, isRTL]);
  const calendarEventsByDay = useMemo(
    () =>
      calendarEvents.reduce((map, event) => {
        const key = toDateKey(event.start);
        map.set(key, [...(map.get(key) ?? []), event]);
        return map;
      }, new Map<string, CalendarEventDto[]>()),
    [calendarEvents],
  );

  const selectedCalendarEvents = calendarEventsByDay.get(toDateKey(selectedCalendarDate)) ?? [];
  const selectedCalendarCellIndex = calendarCells.findIndex((date) => toDateKey(date) === toDateKey(selectedCalendarDate));
  const selectedCalendarWeekStart = selectedCalendarCellIndex >= 0 ? Math.floor(selectedCalendarCellIndex / 7) * 7 : 0;
  const visibleCalendarEvents = activeView === 'month'
    ? calendarEvents
    : activeView === 'day'
      ? selectedCalendarEvents
      : calendarCells
          .slice(selectedCalendarWeekStart)
          .slice(0, 7)
          .flatMap((date) => calendarEventsByDay.get(toDateKey(date)) ?? []);

  const viewTabs = [
    { key: 'day' as const, label: t('calendar.viewDay') },
    { key: 'week' as const, label: t('calendar.viewWeek') },
    { key: 'month' as const, label: t('calendar.viewMonth') },
  ];

  const calendarMonths = [
    t('months.january'),
    t('months.february'),
    t('months.march'),
    t('months.april'),
    t('months.may'),
    t('months.jun'),
    t('months.july'),
    t('months.august'),
    t('months.september'),
    t('months.october'),
    t('months.november'),
    t('months.december'),
  ];

  const calendarEventTitle = (event: CalendarEventDto) =>
    locale === 'ar' ? event.titleAr || event.title : event.title || event.titleAr;

  const calendarEventDescription = (event: CalendarEventDto) =>
    locale === 'ar' ? event.descriptionAr || event.description : event.description || event.descriptionAr;

  const calendarEventTime = (event: CalendarEventDto) =>
    event.allDay
      ? t('calendar.allDay')
      : new Date(event.start).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });

  const label = (key: string, fallbackEn: string, fallbackAr: string) => {
    const value = t(key);
    if (value !== key) return value;
    return locale === 'ar' ? fallbackAr : fallbackEn;
  };

  const openCreateEventModal = (date = selectedCalendarDate) => {
    const day = startOfDay(date);
    setSelectedCalendarDate(day);
    setEventForm({
      ...emptyEventForm,
      eventDate: toDateInputValue(new Date(day.getFullYear(), day.getMonth(), day.getDate(), 9)),
    });
    setEventModalOpen(true);
  };

  const closeEventModal = () => {
    setEventModalOpen(false);
    setEventForm(emptyEventForm);
  };

  const submitDashboardEvent = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEventSaving(true);

    const payload: CalendarEventPayload = {
      title: eventForm.title.trim(),
      titleAr: eventForm.titleAr.trim() || eventForm.title.trim(),
      description: eventForm.description.trim() || null,
      descriptionAr: eventForm.descriptionAr.trim() || null,
      eventDate: new Date(eventForm.eventDate).toISOString(),
      endDate: eventForm.endDate ? new Date(eventForm.endDate).toISOString() : null,
      isAllDay: eventForm.isAllDay,
      eventType: eventForm.eventType,
      color: eventForm.color,
      relatedEntityType: null,
      relatedEntityId: null,
    };

    try {
      await clientApiFetch({
        method: 'POST',
        backendPath: '/api/Calendar',
        nextPath: '/api/calendar',
        query: { locale },
        body: payload,
        locale,
      });
      closeEventModal();
      setCalendarRefreshKey((value) => value + 1);
    } finally {
      setEventSaving(false);
    }
  };

  const studName = locale === 'ar' ? stud.studArabicName || stud.studName : stud.studName || stud.studArabicName;
  const activityItems = activities.slice(0, 4);

  if (dashboardLoading) {
    return (
      <MainLayout>
        <DashboardSkeleton />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className={`mx-auto max-w-[1280px] space-y-6 ${isRTL ? '[direction:rtl]' : '[direction:ltr]'}`}>
       <section
  dir={isRTL ? "rtl" : "ltr"}
  className="relative grid overflow-hidden rounded-2xl bg-[linear-gradient(110deg,#202315,#737116_58%,#9f9816)] text-white shadow-[0_18px_40px_rgba(45,36,18,0.16)] md:grid-cols-2"
>
  <div className="pointer-events-none absolute inset-y-0 left-1/2 z-10 hidden w-px -translate-x-1/2 bg-white/40 md:block" />

  {[
    { title: t("dashboard.availableHorses"), data: dashboard.horsesInStud },
    { title: t("dashboard.production"), data: dashboard.bredByStud },
  ].map((item) => (
    <article
      key={item.title}
      className="relative min-h-[185px] overflow-hidden px-7 py-8 text-center sm:px-10"
    >
      <div className="absolute inset-y-0 -start-1 w-2/3 bg-[radial-gradient(ellipse_at_center,rgba(14,16,10,0.42),transparent_62%)]" />

      <div className="relative">
        <div className="text-5xl font-light leading-none sm:text-[3.35rem]">
          {formatNumber(item.data?.total)}
        </div>

        <h2 className="mt-4 text-2xl font-semibold sm:text-[2rem]">
          {item.title}
        </h2>

        <div className="mx-auto mt-4 grid max-w-[220px] grid-cols-2 text-2xl">
          <div
            className={`px-4 ${
              isRTL
                ? "border-l border-white/55"
                : "border-r border-white/55"
            }`}
          >
            <div>{formatNumber(item.data?.male)}</div>

            <div className="mt-1 flex items-center justify-center gap-1 text-base">
              <span>{t("dashboard.males")}</span>
              <Mars className="h-5 w-5" />
            </div>
          </div>

          <div className="px-4">
            <div>{formatNumber(item.data?.female)}</div>

            <div className="mt-1 flex items-center justify-center gap-1 text-base">
              <span>{t("dashboard.females")}</span>
              <Venus className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>
    </article>
  ))}
</section>

        <section className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
          <div className="grid gap-4 md:grid-cols-[0.85fr_1fr_1fr]">
            <article className="rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-[#4b2f1a]">{t('dashboard.costAnalysis')}</h3>
              <div className="mt-7 space-y-5">
                {[
                  { label: t('dashboard.feedCost'), value: 0 },
                  { label: t('dashboard.vetCare'), value: 0 },
                  { label: t('dashboard.operationalExpenses'), value: 0 },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="mb-2 flex items-center justify-between text-base font-semibold text-[#7a7069]">
                      <span>{item.value}%</span>
                      <span>{item.label}</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#e8e1da]">
                      <div className="h-full rounded-full bg-[#4b2f1a]" style={{ width: `${item.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <div className="grid gap-4 sm:grid-cols-2 md:col-span-2">
              {[
                {
                  label: t('dashboard.profit'),
                  value: formatCurrency(dashboard.profit),
                  icon: '/svgs/earning.svg',
                  color: 'text-[#d45b00]',
                },
                {
                  label: t('dashboard.totalExpenses'),
                  value: formatCurrency(dashboard.expenses),
                  icon: '/svgs/مصروفات.svg',
                  color: 'text-[#008f9c]',
                },
                {
                  label: t('dashboard.totalHorses'),
                  value: formatNumber(dashboard.horsesInStud?.total),
                  icon: '/svgs/عدد الخيل.svg',
                  color: 'text-[#7a5b4a]',
                },
                {
                  label: t('dashboard.totalSales'),
                  value: formatCurrency(dashboard.sales),
                  icon: '/svgs/red-horse.svg',
                  color: 'text-[#d81c24]',
                },
                {
                  label: t('dashboard.birthsThisYear'),
                  value: formatNumber(dashboard.birthedThisYear?.total),
                  icon: '/svgs/horse-active.svg',
                  color: 'text-[#6f6d19]',
                  meta: [
                    `${t('dashboard.males')}: ${formatNumber(dashboard.birthedThisYear?.male)}`,
                    `${t('dashboard.females')}: ${formatNumber(dashboard.birthedThisYear?.female)}`,
                  ],
                },
              ].map((item) => (
                <article
                  key={item.label}
                  className={`flex min-h-[125px] items-center justify-between rounded-2xl bg-white px-7 py-5 shadow-sm ${
                    item.meta ? 'sm:col-span-2' : ''
                  }`}
                >
                  <img src={item.icon} alt="" className="h-20 w-20 object-contain" />
                  <div className="text-end">
                    <div className={`text-xl font-black ${item.color}`}>{item.value}</div>
                    <div className="mt-3 text-xl font-bold text-[#22243c]">{item.label}</div>
                    {item.meta && (
                      <div className="mt-2 flex flex-wrap justify-end gap-3 text-sm font-semibold text-[#7a7069]">
                        {item.meta.map((value) => (
                          <span key={value}>{value}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>

          <article className="rounded-xl border border-[#bcc7d6] bg-white px-7 py-6 shadow-sm">
            <div className={`flex items-start ${isRTL ? 'flex-row-reverse' : ''} justify-between gap-3`}>
              <Info className="h-6 w-6 text-[#4b2f1a]" />
              <h3 className="text-2xl font-semibold text-[#4b2f1a]">{t('dashboard.studInformation')}</h3>
            </div>
            <dl
  dir={isRTL ? "rtl" : "ltr"}
  className={`mt-8 space-y-4 text-lg text-[#5c5651] ${
    isRTL ? "text-right" : "text-left"
  }`}
>
  <div className="flex items-center">
    <dt className="w-40 shrink-0 font-semibold text-[#8c847c]">
      {t("dashboard.name")}
    </dt>
    <dd className="flex-1 truncate">{studName || "-"}</dd>
  </div>

  <div className="flex items-center">
    <dt className="w-40 shrink-0 font-semibold text-[#8c847c]">
      {t("dashboard.registrationNumber")}
    </dt>
    <dd className="flex-1">
      {stud.registrationNumber || stud.studbookId || "-"}
    </dd>
  </div>

  <div className="flex items-center">
    <dt className="w-40 shrink-0 font-semibold text-[#8c847c]">
      {t("dashboard.bredHorses")}
    </dt>
    <dd className="flex-1">
      {dashboard.bredByStud?.total ?? 0}
    </dd>
  </div>

  <div className="flex items-center">
    <dt className="w-40 shrink-0 font-semibold text-[#8c847c]">
      {t("dashboard.phoneNumber")}
    </dt>
    <dd className="flex-1">
      {stud.primaryPhoneNumber || "-"}
    </dd>
  </div>

  <div className="flex items-center">
    <dt className="w-40 shrink-0 font-semibold text-[#8c847c]">
      {t("dashboard.email")}
    </dt>
    <dd className="flex-1 truncate">
      {stud.studEmail || "-"}
    </dd>
  </div>
</dl>
          </article>
        </section>

        <section className="grid gap-5 xl:grid-cols-3">
          <article className="rounded-2xl bg-white p-7 shadow-sm">
            <h3 className="text-center text-2xl font-semibold text-[#4b2f1a]">{t('dashboard.healthRecord')}</h3>
            <div className="mt-8 flex min-h-[210px] items-center justify-center rounded-xl border border-dashed border-[#ded6ce] text-lg font-semibold text-[#8c847c]">
              {t('common.noRecordsFound')}
            </div>
            <button className="mt-8 h-12 w-full rounded-lg bg-[#e8e4de] text-base font-semibold text-[#4b2f1a]">
              {t('dashboard.fullVisitLog')}
            </button>
          </article>

        <article
  dir={isRTL ? "rtl" : "ltr"}
  className="rounded-[28px] bg-[#e8e4de] p-7 shadow-sm"
>
  <div
    className={`flex items-start justify-between ${
      isRTL ? "flex-row-reverse" : ""
    }`}
  >
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#6b6b3a] text-white">
      <Leaf className="h-6 w-6" />
    </div>

    <div className={isRTL ? "text-right" : "text-left"}>
      <h3 className="text-2xl font-semibold text-[#4b2f1a]">
        {t("dashboard.currentRation")}
      </h3>

      <p className="text-base text-[#6f665e]">
        {t("dashboard.dailyRation")}
      </p>
    </div>
  </div>

  <div className="mt-8 flex min-h-[220px] items-center justify-center rounded-xl bg-white/65 text-lg font-semibold text-[#8c847c]">
    {t("common.noRecordsFound")}
  </div>

  <button className="mt-6 h-12 w-full rounded-lg bg-white text-base font-semibold text-[#4b2f1a] shadow-sm">
    {t("dashboard.editNutritionPlan")}
  </button>
</article>

         <article
  dir={isRTL ? "rtl" : "ltr"}
  className="rounded-2xl bg-white p-7 shadow-sm"
>
  <div
    className={`mb-5 flex items-center justify-between ${
      isRTL ? "flex-row" : ""
    }`}
  >
    <button
      onClick={() => {
        setActivityModalOpen(true);
        loadActivities(1, 10);
      }}
      className="text-base font-semibold text-[#4b2f1a] underline"
    >
      {t("dashboard.all")}
    </button>

    <h3
      className={`flex-1 text-2xl font-semibold text-[#4b2f1a] ${
        isRTL ? "text-right mr-4" : "text-left ml-4"
      }`}
    >
      {t("dashboard.latestActivities")}
    </h3>
  </div>

  <div className="space-y-4">
    {activityLoading && activityItems.length === 0 ? (
      <div className="rounded-xl bg-[#f8f4f0] p-6 text-center text-base font-semibold text-[#8c847c]">
        {t("common.loading")}
      </div>
    ) : activityItems.length === 0 ? (
      <div className="rounded-xl bg-[#f8f4f0] p-6 text-center text-base font-semibold text-[#8c847c]">
        {t("common.noRecordsFound")}
      </div>
    ) : (
      activityItems.map((activity) => (
        <ActivityRow
          key={activity.id}
          activity={activity}
          locale={locale}
        />
      ))
    )}
  </div>

  <div
    className={`mt-6 rounded-xl bg-[#4a2108] p-6 text-white ${
      isRTL ? "text-left" : "text-left"
    }`}
  >
    <FileText
      className={`mb-3 h-8 w-8 opacity-70 ${
        isRTL ? "mr-auto" : ""
      }`}
    />

    <p className="text-lg font-semibold">
      {t("dashboard.reportNotice")}
    </p>

    <p className="mt-2 text-sm leading-6 text-white/70">
      {t("common.noRecordsFound")}
    </p>
  </div>
</article>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_20rem]">
          <article className="rounded-2xl bg-white p-4 shadow-sm sm:p-6" dir={direction}>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setCalendarDate((date) => {
                      const next = new Date(date.getFullYear(), date.getMonth() - 1, 1);
                      setSelectedCalendarDate(next);
                      return next;
                    });
                  }}
                  className="rounded-full border border-[#d8d0c8] p-2 text-[#3b2b20] hover:bg-[#f8f4f0]"
                  aria-label={t('common.back')}
                >
                  {isRTL ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
                </button>
                <button
                  onClick={() => {
                    setCalendarDate((date) => {
                      const next = new Date(date.getFullYear(), date.getMonth() + 1, 1);
                      setSelectedCalendarDate(next);
                      return next;
                    });
                  }}
                  className="rounded-full border border-[#d8d0c8] p-2 text-[#3b2b20] hover:bg-[#f8f4f0]"
                  aria-label={t('common.next')}
                >
                  {isRTL ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                </button>
              </div>

              <h2 className="text-xl font-bold text-[#3b2b20]">
                {calendarMonths[calendarDate.getMonth()]} {calendarDate.getFullYear()}
              </h2>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => openCreateEventModal()}
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#3b2b20] px-3 text-sm font-semibold text-white"
                >
                  <Plus className="h-4 w-4" />
                  {label('calendar.addEvent', 'Add event', 'إضافة حدث')}
                </button>
                <div className="flex overflow-hidden rounded-lg border border-[#3b2b20] text-sm font-semibold">
                  {viewTabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveView(tab.key)}
                    className={`min-w-16 px-4 py-2 ${
                      activeView === tab.key ? 'bg-[#3b2b20] text-white' : 'bg-white text-[#3b2b20] hover:bg-[#f8f4f0]'
                    }`}
                  >
                    {tab.label}
                  </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mb-2 grid grid-cols-7 gap-px rounded-2xl bg-[#eee4dc] p-px">
              {displayDays.map((day) => (
                <div key={day} className="rounded-xl bg-[#fbf8f4] py-2 text-center text-sm font-semibold text-[#8c847c]">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-px rounded-2xl bg-[#e8ded5] p-px shadow-inner">
              {calendarCells.map((day) => {
                const key = toDateKey(day);
                const dayEvents = calendarEventsByDay.get(key) ?? [];
                const outside = day.getMonth() !== calendarDate.getMonth();
                const selected = key === toDateKey(selectedCalendarDate);

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => openCreateEventModal(day)}
                    className={`relative min-h-[104px] overflow-visible rounded-xl p-2 text-start align-top transition-all duration-200 ease-out hover:z-10 hover:-translate-y-0.5 hover:bg-[#fffaf5] hover:shadow-[0_12px_28px_rgba(75,47,26,0.12)] focus:outline-none sm:min-h-[132px] ${
                      outside ? 'bg-[#fbfaf8] text-[#c8c2bd]' : 'bg-white text-[#3b2b20]'
                    } ${
                      selected
                        ? 'z-[1] bg-[#fffaf2] shadow-[inset_0_0_0_2px_#4b2f1a,0_10px_24px_rgba(75,47,26,0.12)]'
                        : ''
                    }`}
                  >
                    <span
                      className={`inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-sm font-bold ${
                        selected ? 'bg-[#4b2f1a] text-white' : 'text-current'
                      }`}
                    >
                      {day.getDate()}
                    </span>
                    <div className="mt-2 space-y-1">
                      {dayEvents.slice(0, 3).map((event) => {
                        const color = getCalendarEventColor(event);
                        return (
                          <div
                            key={event.id}
                            role="button"
                            tabIndex={0}
                            onClick={(clickEvent) => clickEvent.stopPropagation()}
                            onKeyDown={(keyEvent) => {
                              if (keyEvent.key === 'Enter' || keyEvent.key === ' ') {
                                keyEvent.preventDefault();
                                keyEvent.stopPropagation();
                              }
                            }}
                            className="group/event rounded-md px-2 py-1 text-start text-[11px] font-semibold leading-4 shadow-sm transition-all duration-200 ease-out hover:relative hover:z-20 hover:scale-[1.02] hover:shadow-lg"
                            style={{ backgroundColor: color, color: isDarkColor(color) ? '#fff' : '#3b2b20' }}
                          >
                            <div className="whitespace-normal break-words">{calendarEventTitle(event)}</div>
                            <div className="max-h-0 overflow-hidden opacity-0 transition-all duration-200 ease-out group-hover/event:mt-1 group-hover/event:max-h-24 group-hover/event:opacity-100">
                              <div className="text-[10px] font-semibold opacity-85">{calendarEventTime(event)}</div>
                              {calendarEventDescription(event) ? (
                                <div className="mt-1 line-clamp-3 text-[10px] font-medium leading-4 opacity-80">
                                  {calendarEventDescription(event)}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                      {dayEvents.length > 3 && <div className="text-xs font-semibold text-[#8c847c]">+{dayEvents.length - 3}</div>}
                    </div>
                  </button>
                );
              })}
            </div>
          </article>

          <aside className="rounded-2xl bg-white p-5 shadow-sm" dir={direction}>
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-bold text-[#3b2b20]">
                  {activeView === 'month'
                    ? t('calendar.event')
                    : selectedCalendarDate.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })}
                </h3>
                <p className="mt-1 text-sm text-[#8c847c]">
                  {visibleCalendarEvents.length} {t('calendar.events')}
                </p>
              </div>
              <CalendarDays className="h-6 w-6 text-[#4b2f1a]" />
            </div>

            <div className="space-y-3">
              {visibleCalendarEvents.length === 0 ? (
                <div className="rounded-xl bg-[#f8f4f0] p-6 text-center text-sm font-semibold text-[#8c847c]">{t('common.noRecordsFound')}</div>
              ) : (
                visibleCalendarEvents.map((event) => {
                  const color = getCalendarEventColor(event);
                  return (
                    <div key={event.id} className="w-full rounded-xl border border-[#efe7df] bg-white p-4 text-start shadow-sm">
                      <div className="mb-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                      <div className="font-bold text-[#3b2b20]">{calendarEventTitle(event)}</div>
                      <div className="mt-1 text-sm text-[#8c847c]">
                        {calendarEventTime(event)} · {new Date(event.start).toLocaleDateString(locale, { day: 'numeric', month: 'short' })}
                      </div>
                      {calendarEventDescription(event) ? <div className="mt-2 text-sm leading-6 text-[#6f665e]">{calendarEventDescription(event)}</div> : null}
                    </div>
                  );
                })
              )}
            </div>
          </aside>
        </section>

        {eventModalOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4" dir={direction}>
            <form onSubmit={submitDashboardEvent} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
              <div className="flex items-center justify-between border-b border-[#f1ece8] px-6 py-5">
                <button
                  type="button"
                  onClick={closeEventModal}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f8f4f0] text-[#4b2f1a]"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
                <h2 className="text-xl font-bold text-[#4b2f1a]">{label('calendar.addEvent', 'Add event', 'إضافة حدث')}</h2>
              </div>

              <div className="grid gap-4 px-6 py-5 sm:grid-cols-2">
                <input
                  required
                  value={eventForm.title}
                  onChange={(event) => setEventForm((value) => ({ ...value, title: event.target.value }))}
                  placeholder={label('calendar.titleEn', 'English title', 'العنوان بالإنجليزية')}
                  className="h-12 rounded-lg border border-[#ded6ce] px-4 outline-none focus:border-[#4b2f1a]"
                />
                <input
                  required
                  value={eventForm.titleAr}
                  onChange={(event) => setEventForm((value) => ({ ...value, titleAr: event.target.value }))}
                  placeholder={label('calendar.titleAr', 'Arabic title', 'العنوان بالعربية')}
                  className="h-12 rounded-lg border border-[#ded6ce] px-4 outline-none focus:border-[#4b2f1a]"
                />
                <input
                  required
                  type="datetime-local"
                  value={eventForm.eventDate}
                  onChange={(event) => setEventForm((value) => ({ ...value, eventDate: event.target.value }))}
                  className="h-12 rounded-lg border border-[#ded6ce] px-4 outline-none focus:border-[#4b2f1a]"
                />
                <input
                  type="datetime-local"
                  value={eventForm.endDate}
                  onChange={(event) => setEventForm((value) => ({ ...value, endDate: event.target.value }))}
                  className="h-12 rounded-lg border border-[#ded6ce] px-4 outline-none focus:border-[#4b2f1a]"
                />
                <select
                  value={eventForm.eventType}
                  onChange={(event) => setEventForm((value) => ({ ...value, eventType: Number(event.target.value) as CalendarEventType }))}
                  className="h-12 rounded-lg border border-[#ded6ce] px-4 outline-none focus:border-[#4b2f1a]"
                >
                  {EVENT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {label(`calendar.types.${type.key}`, type.fallbackEn, type.fallbackAr)}
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-3 rounded-lg border border-[#ded6ce] px-4">
                  <input
                    type="color"
                    value={eventForm.color}
                    onChange={(event) => setEventForm((value) => ({ ...value, color: event.target.value }))}
                    className="h-9 w-12 cursor-pointer border-0 bg-transparent p-0"
                  />
                  <span className="text-sm font-semibold text-[#6f665e]">{label('calendar.color', 'Color', 'اللون')}</span>
                </div>
                <textarea
                  value={eventForm.description}
                  onChange={(event) => setEventForm((value) => ({ ...value, description: event.target.value }))}
                  placeholder={label('calendar.descriptionEn', 'English description', 'الوصف بالإنجليزية')}
                  className="min-h-24 rounded-lg border border-[#ded6ce] px-4 py-3 outline-none focus:border-[#4b2f1a]"
                />
                <textarea
                  value={eventForm.descriptionAr}
                  onChange={(event) => setEventForm((value) => ({ ...value, descriptionAr: event.target.value }))}
                  placeholder={label('calendar.descriptionAr', 'Arabic description', 'الوصف بالعربية')}
                  className="min-h-24 rounded-lg border border-[#ded6ce] px-4 py-3 outline-none focus:border-[#4b2f1a]"
                />
                <label className="flex items-center gap-3 text-sm font-semibold text-[#4b2f1a]">
                  <input
                    type="checkbox"
                    checked={eventForm.isAllDay}
                    onChange={(event) => setEventForm((value) => ({ ...value, isAllDay: event.target.checked }))}
                  />
                  {label('calendar.allDay', 'All day', 'طوال اليوم')}
                </label>
              </div>

              <div className="flex items-center justify-end border-t border-[#f1ece8] px-6 py-4">
                <button
                  type="submit"
                  disabled={eventSaving}
                  className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#3b2b20] px-5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  <Edit3 className="h-4 w-4" />
                  {eventSaving ? t('common.loading') : label('common.save', 'Save', 'حفظ')}
                </button>
              </div>
            </form>
          </div>
        )}

        {activityModalOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4" dir={direction}>
            <div className="flex max-h-[86vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
              <div className="flex items-center justify-between border-b border-[#f1ece8] px-6 py-5">
                <button
                  onClick={() => {
                    setActivityModalOpen(false);
                    loadActivities(1, 6);
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f8f4f0] text-[#4b2f1a]"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
                <h2 className="text-2xl font-bold text-[#4b2f1a]">{t('dashboard.latestActivities')}</h2>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                {activityLoading ? (
                  <div className="rounded-xl bg-[#f8f4f0] p-8 text-center text-lg font-semibold text-[#8c847c]">
                    {t('common.loading')}
                  </div>
                ) : activities.length === 0 ? (
                  <div className="rounded-xl bg-[#f8f4f0] p-8 text-center text-lg font-semibold text-[#8c847c]">
                    {t('common.noRecordsFound')}
                  </div>
                ) : (
                  <div className="space-y-5">
                    {activities.map((activity) => (
                      <ActivityRow key={activity.id} activity={activity} locale={locale} spacious />
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-center gap-4 border-t border-[#f1ece8] px-6 py-4">
                <button
                  disabled={!activityPageInfo?.hasPreviousPage || activityLoading}
                  onClick={() => loadActivities(Math.max(1, activityPage - 1), 10)}
                  className="rounded-lg bg-[#f8f4f0] px-5 py-2 text-base font-semibold text-[#4b2f1a] disabled:opacity-40"
                >
                  {t('common.back')}
                </button>
                <span className="text-base font-semibold text-[#6f665e]">
                  {activityPageInfo?.currentPage ?? activityPage} / {activityPageInfo?.totalPages || 1}
                </span>
                <button
                  disabled={!activityPageInfo?.hasNextPage || activityLoading}
                  onClick={() => loadActivities(activityPage + 1, 10)}
                  className="rounded-lg bg-[#f8f4f0] px-5 py-2 text-base font-semibold text-[#4b2f1a] disabled:opacity-40"
                >
                  {t('common.next')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
