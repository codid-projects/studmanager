'use client';

import React, { useEffect, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Info,
  Leaf,
  Mars,
  MoreHorizontal,
  Venus,
  X,
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { clientApiFetch } from '@/lib/api/client';
import { useLocale, useTranslation } from '@/lib/locale-context';
import type {
  ActivityDto,
  ApiResult,
  DashboardDto,
  DefaultStudDto,
  PagedResponse,
} from '@/lib/api/types';

type ViewMode = 'day' | 'week' | 'month';

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

function getActivityTone(type: string | null) {
  const normalized = (type ?? '').toLowerCase();
  if (normalized.includes('health')) return 'bg-[#fff1f2] text-[#dc2626]';
  if (normalized.includes('expense') || normalized.includes('sale')) return 'bg-[#fff7ed] text-[#b45309]';
  if (normalized.includes('birth') || normalized.includes('horse')) return 'bg-[#eef2d5] text-[#6b6b33]';
  return 'bg-[#f1eef6] text-[#6b5a75]';
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
    <div className={`grid grid-cols-[2.75rem_1fr] gap-4 border-b border-[#f1ece8] pb-4 last:border-0 ${spacious ? 'items-start' : ''}`}>
      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${getActivityTone(activity.type)}`}>
        <MoreHorizontal className="h-5 w-5" />
      </div>
      <div className="text-end">
        <p className={`${spacious ? 'text-lg leading-7' : 'line-clamp-1 text-base'} font-semibold text-[#4b2f1a]`}>
          {locale === 'ar' ? activity.descriptionAr || activity.descriptionEn : activity.descriptionEn || activity.descriptionAr}
        </p>
        <p className="mt-1 text-sm text-[#8c847c]">{timeAgo(activity.createdAt, locale)}</p>
        {spacious && activity.createdBy && (
          <p className="mt-1 text-sm text-[#8c847c]">{activity.createdBy}</p>
        )}
      </div>
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
  const [activeView, setActiveView] = useState<ViewMode>('month');
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
    }

    loadDashboardData();
    loadActivities(1, 6);

    return () => {
      mounted = false;
    };
  }, [locale]);

  const days = [
    t('days.saturday'),
    t('days.sunday'),
    t('days.monday'),
    t('days.tuesday'),
    t('days.wednesday'),
    t('days.thursday'),
    t('days.friday'),
  ];

  const calendarWeeks = [
    [1, 2, 3, 4, 5, 6, 7],
    [8, 9, 10, 11, 12, 13, 14],
    [15, 16, 17, 18, 19, 20, 21],
    [22, 23, 24, 25, 26, 27, 28],
    [29, 30, 31, `1 ${t('months.february')}`, 2, 3, 4],
  ];
  const displayDays = isRTL ? [...days].reverse() : days;
  const displayCalendarWeeks = isRTL ? calendarWeeks.map((week) => [...week].reverse()) : calendarWeeks;

  const viewTabs = [
    { key: 'day' as const, label: t('calendar.viewDay') },
    { key: 'week' as const, label: t('calendar.viewWeek') },
    { key: 'month' as const, label: t('calendar.viewMonth') },
  ];

  const studName = locale === 'ar' ? stud.studArabicName || stud.studName : stud.studName || stud.studArabicName;
  const activityItems = activities.slice(0, 4);

  return (
    <MainLayout>
      <div className={`mx-auto max-w-[1280px] space-y-6 ${isRTL ? '[direction:rtl]' : '[direction:ltr]'}`}>
        <section className="grid overflow-hidden rounded-2xl bg-[linear-gradient(110deg,#202315,#737116_58%,#9f9816)] text-white shadow-[0_18px_40px_rgba(45,36,18,0.16)] md:grid-cols-2">
          {[
            { title: t('dashboard.availableHorses'), data: dashboard.horsesInStud },
            { title: t('dashboard.production'), data: dashboard.birthedThisYear },
          ].map((item, index) => (
            <article
              key={item.title}
              className={`relative min-h-[185px] overflow-hidden px-7 py-8 text-center sm:px-10 ${
                index === 0 ? 'md:border-e md:border-white/40' : ''
              }`}
            >
              <div className="absolute inset-y-0 -start-10 w-2/3 bg-[radial-gradient(ellipse_at_center,rgba(14,16,10,0.42),transparent_62%)]" />
              <div className="absolute -end-20 top-10 h-16 w-48 rotate-[-7deg] rounded-[100%] bg-[#b3a91b]/45" />
              <div className="relative">
                <div className="text-5xl font-light leading-none sm:text-[3.35rem]">
                  {formatNumber(item.data?.total)}
                </div>
                <h2 className="mt-4 text-2xl font-semibold sm:text-[2rem]">{item.title}</h2>
                <div className="mx-auto mt-4 grid max-w-[220px] grid-cols-2 divide-x divide-white/55 text-2xl">
                  <div className="px-4">
                    <div>{formatNumber(item.data?.male)}</div>
                    <div className="mt-1 flex items-center justify-center gap-1 text-base">
                      <span>{t('dashboard.males')}</span>
                      <Mars className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="px-4">
                    <div>{formatNumber(item.data?.female)}</div>
                    <div className="mt-1 flex items-center justify-center gap-1 text-base">
                      <span>{t('dashboard.females')}</span>
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
              ].map((item) => (
                <article key={item.label} className="flex min-h-[125px] items-center justify-between rounded-2xl bg-white px-7 py-5 shadow-sm">
                  <img src={item.icon} alt="" className="h-20 w-20 object-contain" />
                  <div className="text-end">
                    <div className={`text-xl font-black ${item.color}`}>{item.value}</div>
                    <div className="mt-3 text-xl font-bold text-[#22243c]">{item.label}</div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <article className="rounded-xl border border-[#bcc7d6] bg-white px-7 py-6 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <Info className="h-6 w-6 text-[#4b2f1a]" />
              <h3 className="text-2xl font-semibold text-[#4b2f1a]">{t('dashboard.studInformation')}</h3>
            </div>
            <dl className="mt-8 space-y-4 text-lg text-[#5c5651]">
              <div className="grid grid-cols-[1fr_10rem] items-center gap-4 text-right">
                <dd className="truncate">{studName || '-'}</dd>
                <dt className="font-semibold text-[#8c847c]">{t('dashboard.name')}</dt>
              </div>
              <div className="grid grid-cols-[1fr_10rem] items-center gap-4 text-right">
                <dd>{stud.registrationNumber || stud.studbookId || '-'}</dd>
                <dt className="font-semibold text-[#8c847c]">{t('dashboard.registrationNumber')}</dt>
              </div>
              <div className="grid grid-cols-[1fr_10rem] items-center gap-4 text-right">
                <dd>{dashboard.bredByStud?.total ?? 0}</dd>
                <dt className="font-semibold text-[#8c847c]">{t('dashboard.bredHorses')}</dt>
              </div>
              <div className="grid grid-cols-[1fr_10rem] items-center gap-4 text-right">
                <dd>{stud.primaryPhoneNumber || '-'}</dd>
                <dt className="font-semibold text-[#8c847c]">{t('dashboard.phoneNumber')}</dt>
              </div>
              <div className="grid grid-cols-[1fr_10rem] items-center gap-4 text-right">
                <dd className="truncate">{stud.studEmail || '-'}</dd>
                <dt className="font-semibold text-[#8c847c]">{t('dashboard.email')}</dt>
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

          <article className="rounded-[28px] bg-[#e8e4de] p-7 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#6b6b3a] text-white">
                <Leaf className="h-6 w-6" />
              </div>
              <div className="text-end">
                <h3 className="text-2xl font-semibold text-[#4b2f1a]">{t('dashboard.currentRation')}</h3>
                <p className="text-base text-[#6f665e]">{t('dashboard.dailyRation')}</p>
              </div>
            </div>
            <div className="mt-8 flex min-h-[220px] items-center justify-center rounded-xl bg-white/65 text-lg font-semibold text-[#8c847c]">
              {t('common.noRecordsFound')}
            </div>
            <button className="mt-6 h-12 w-full rounded-lg bg-white text-base font-semibold text-[#4b2f1a] shadow-sm">
              {t('dashboard.editNutritionPlan')}
            </button>
          </article>

          <article className="rounded-2xl bg-white p-7 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <button
                onClick={() => {
                  setActivityModalOpen(true);
                  loadActivities(1, 10);
                }}
                className="text-base font-semibold text-[#4b2f1a] underline"
              >
                {t('dashboard.all')}
              </button>
              <h3 className="text-2xl font-semibold text-[#4b2f1a]">{t('dashboard.latestActivities')}</h3>
            </div>
            <div className="space-y-4">
              {activityLoading && activityItems.length === 0 ? (
                <div className="rounded-xl bg-[#f8f4f0] p-6 text-center text-base font-semibold text-[#8c847c]">
                  {t('common.loading')}
                </div>
              ) : activityItems.length === 0 ? (
                <div className="rounded-xl bg-[#f8f4f0] p-6 text-center text-base font-semibold text-[#8c847c]">
                  {t('common.noRecordsFound')}
                </div>
              ) : (
                activityItems.map((activity) => (
                  <ActivityRow key={activity.id} activity={activity} locale={locale} />
                ))
              )}
            </div>
            <div className="mt-6 rounded-xl bg-[#4a2108] p-6 text-white">
              <FileText className="mb-3 h-8 w-8 opacity-70" />
              <p className="text-lg font-semibold">{t('dashboard.reportNotice')}</p>
              <p className="mt-2 text-sm leading-6 text-white/70">{t('common.noRecordsFound')}</p>
            </div>
          </article>
        </section>

        <section className="grid gap-5 xl:grid-cols-[1fr_17rem] [direction:ltr]">
          <article className="rounded-2xl bg-white p-5 shadow-sm sm:p-7" dir={direction}>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-[#4b2f1a]">
                <button className="flex h-10 w-10 items-center justify-center rounded-full border border-[#4b2f1a] text-xl">
                  <ChevronRight className="h-5 w-5" />
                </button>
                <button className="flex h-10 w-10 items-center justify-center rounded-full border border-[#4b2f1a] text-xl">
                  <ChevronLeft className="h-5 w-5" />
                </button>
              </div>
              <div className="text-3xl font-semibold text-[#20203c]">
                2025 <span className="font-bold">{t('months.january')}</span>
              </div>
              <div className="flex overflow-hidden rounded-md border border-[#4b2f1a] text-base font-semibold">
                {viewTabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveView(tab.key)}
                    className={`min-w-[4.3rem] px-4 py-2 ${
                      activeView === tab.key ? 'bg-[#4b2f1a] text-white' : 'bg-white text-[#4b2f1a]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-7 border-t border-[#d6d0ca] text-[#20203c]">
              {displayDays.map((day) => (
                <div key={day} className="border-b border-s border-[#d6d0ca] px-2 py-4 text-center text-lg font-semibold text-[#c5beb7]">
                  {day}
                </div>
              ))}
              {displayCalendarWeeks.flatMap((week, weekIndex) =>
                week.map((day, dayIndex) => {
                  return (
                    <div key={`${weekIndex}-${dayIndex}`} className="relative min-h-[105px] border-b border-s border-[#d6d0ca] p-3 sm:min-h-[145px]">
                      <div className={`text-lg font-bold ${typeof day === 'string' ? 'text-[#c8c2bd]' : 'text-[#20203c]'}`}>{day}</div>
                    </div>
                  );
                }),
              )}
            </div>
          </article>

          <aside className="rounded-2xl bg-white p-7 shadow-sm" dir={direction}>
            <div className="mb-6 text-end">
              <h3 className="text-3xl font-bold text-[#4b2f1a]">{t('dashboard.event')}</h3>
              <p className="text-base text-[#c8c2bd]">{t('dashboard.dragAndDrop')}</p>
            </div>
            <div className="flex min-h-[420px] items-center justify-center rounded-xl border border-dashed border-[#ded6ce] text-center text-lg font-semibold text-[#8c847c]">
              {t('common.noRecordsFound')}
            </div>
          </aside>
        </section>

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
