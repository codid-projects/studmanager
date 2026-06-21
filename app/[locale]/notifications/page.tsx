"use client";

import { MainLayout } from "@/components/layout/MainLayout";
import { clientApiFetch } from "@/lib/api/client";
import type { ActivityDto, ApiResult, PagedResponse } from "@/lib/api/types";
import { useLocale, useTranslation } from "@/lib/locale-context";
import { AlertCircle, Bell, CheckCircle, Info, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const ICON_MAP = {
  success: { icon: CheckCircle, color: "text-green-500", bg: "bg-green-50" },
  warning: { icon: AlertCircle, color: "text-amber-500", bg: "bg-amber-50" },
  info: { icon: Info, color: "text-blue-500", bg: "bg-blue-50" },
};

const ACTIVITY_TYPE_KEYS: Record<string, string> = {
  horseadded: "horseAdded",
  horseupdated: "horseUpdated",
  horsedeleted: "horseDeleted",
  nutritionrecordadded: "nutritionRecordAdded",
  nutritionrecordupdated: "nutritionRecordUpdated",
  nutritionrecorddeleted: "nutritionRecordDeleted",
  nutritionnotification: "nutritionNotification",
  ovulationexaminationadded: "ovulationExaminationAdded",
  ovulationexaminationupdated: "ovulationExaminationUpdated",
  ovulationexaminationdeleted: "ovulationExaminationDeleted",
  marebreedingsoundnessadded: "mareBreedingSoundnessAdded",
  marebreedingsoundnessupdated: "mareBreedingSoundnessUpdated",
  marebreedingsoundnessdeleted: "mareBreedingSoundnessDeleted",
  foalregistered: "foalRegistered",
  foalregistrationadded: "foalRegistered",
  foalregistrationupdated: "foalRegistrationUpdated",
  foalregistrationdeleted: "foalRegistrationDeleted",
  newcyclestarted: "newCycleStarted",
  estruscycleadded: "newCycleStarted",
  cycleupdated: "cycleUpdated",
  estruscycleupdated: "cycleUpdated",
  cycledeleted: "cycleDeleted",
  estruscycledeleted: "cycleDeleted",
  injuryexaminationadded: "injuryExaminationAdded",
  injuryexaminationupdated: "injuryExaminationUpdated",
  injuryexaminationdeleted: "injuryExaminationDeleted",
  stallionbreedingeventadded: "stallionBreedingEventAdded",
  stallionbreedingeventupdated: "stallionBreedingEventUpdated",
  stallionbreedingeventdeleted: "stallionBreedingEventDeleted",
  naturalbreedingadded: "stallionBreedingEventAdded",
  naturalbreedingupdated: "stallionBreedingEventUpdated",
  naturalbreedingdeleted: "stallionBreedingEventDeleted",
  semencollectionadded: "semenCollectionAdded",
  semencollectionupdated: "semenCollectionUpdated",
  semencollectiondeleted: "semenCollectionDeleted",
  semenshipmentadded: "semenShipmentAdded",
  semenshipmentupdated: "semenShipmentUpdated",
  semenshipmentdeleted: "semenShipmentDeleted",
  stallionbreedingsoundnessadded: "stallionBreedingSoundnessAdded",
  stallionbreedingsoundnessupdated: "stallionBreedingSoundnessUpdated",
  stallionbreedingsoundnessdeleted: "stallionBreedingSoundnessDeleted",
};

const ENTITY_TYPE_KEYS: Record<string, string> = {
  horse: "horse",
  nutritionrecord: "nutritionRecord",
  ovulationexamination: "ovulationExamination",
  marebreedingexamination: "mareBreedingSoundness",
  marebreedingsoundness: "mareBreedingSoundness",
  foalregistration: "foalRegistration",
  foalbirth: "foalRegistration",
  estruscycle: "estrusCycle",
  injuryexamination: "injuryExamination",
  stallionbreedingevent: "stallionBreedingEvent",
  naturalbreeding: "stallionBreedingEvent",
  semencollection: "semenCollection",
  semenshipment: "semenShipment",
  stallionbreedingsoundness: "stallionBreedingSoundness",
};

function unwrapResult<T>(payload: T | ApiResult<T>): T {
  if (payload && typeof payload === "object" && "data" in payload && "statusCode" in payload) {
    return (payload as ApiResult<T>).data as T;
  }

  return payload as T;
}

function getTone(type: string | null): keyof typeof ICON_MAP {
  const normalized = (type ?? "").toLowerCase();
  if (normalized.includes("delete") || normalized.includes("warning") || normalized.includes("expense")) return "warning";
  if (normalized.includes("create") || normalized.includes("add") || normalized.includes("horse")) return "success";
  return "info";
}

function formatTime(value: string | null, locale: string) {
  if (!value) return locale === "ar" ? "الآن" : "Now";
  return new Date(value).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
}

function formatDate(value: string | null, locale: string) {
  if (!value) return locale === "ar" ? "اليوم" : "Today";

  const created = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (created.toDateString() === today.toDateString()) return locale === "ar" ? "اليوم" : "Today";
  if (created.toDateString() === yesterday.toDateString()) return locale === "ar" ? "أمس" : "Yesterday";

  return created.toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });
}

function normalizeKey(value: string | null | undefined) {
  return (value ?? "").replace(/[^a-z0-9]/gi, "").toLowerCase();
}

function humanize(value: string | null | undefined) {
  if (!value) return "";
  return value.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").trim();
}

export default function NotificationsPage() {
  const { locale, direction } = useLocale();
  const { t } = useTranslation();
  const isRTL = direction === "rtl";
  const [activities, setActivities] = useState<ActivityDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [readIds, setReadIds] = useState<Set<number>>(new Set());
  const [hiddenIds, setHiddenIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    let mounted = true;

    async function loadNotifications() {
      setLoading(true);
      try {
        const payload = await clientApiFetch<ApiResult<PagedResponse<ActivityDto>> | PagedResponse<ActivityDto>>({
          backendPath: "/api/Dashboard/activities",
          nextPath: "/api/dashboard/activities",
          query: { pageNumber: 1, pageSize: 30, locale },
          locale,
        });
        const result = unwrapResult(payload);
        if (mounted) setActivities(result?.data ?? []);
      } catch {
        if (mounted) setActivities([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadNotifications();

    return () => {
      mounted = false;
    };
  }, [locale]);

  const visibleActivities = useMemo(
    () => activities.filter((activity) => !hiddenIds.has(activity.id)),
    [activities, hiddenIds],
  );
  const unreadCount = visibleActivities.filter((activity) => !readIds.has(activity.id)).length;

  const label = (key: string, fallbackEn: string, fallbackAr: string) => {
    const value = t(key);
    if (value !== key) return value;
    return isRTL ? fallbackAr : fallbackEn;
  };

  const activityTypeLabel = (type: string | null) => {
    const mapped = ACTIVITY_TYPE_KEYS[normalizeKey(type)];
    if (mapped) return label(`notifications.types.${mapped}`, humanize(type), humanize(type));
    // Do not leak an untranslated backend enum into the Arabic interface.
    return (isRTL ? "" : humanize(type)) || label("notifications.newActivity", "New activity", "نشاط جديد");
  };

  const entityTypeLabel = (entityType: string | null) => {
    const mapped = ENTITY_TYPE_KEYS[normalizeKey(entityType)];
    if (mapped) return label(`notifications.entities.${mapped}`, humanize(entityType), humanize(entityType));
    return isRTL ? "" : humanize(entityType);
  };

  return (
    <MainLayout>
      <div className={`mx-auto p-3 sm:p-6 ${isRTL ? "font-cairo" : ""}`} dir={direction}>
        <div className="mb-6 flex items-center justify-between">
          <div className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
            <div className="relative">
              <Bell className="h-6 w-6 text-[#3b2b20]" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-[#3b2b20] sm:text-2xl">
              {label("notifications.title", "Notifications", "الإشعارات")}
            </h1>
          </div>
          <button
            onClick={() => setReadIds(new Set(visibleActivities.map((activity) => activity.id)))}
            className="text-sm font-semibold text-[#3b2b20] hover:underline"
          >
            {label("notifications.markAllRead", "Mark all as read", "تحديد الكل كمقروء")}
          </button>
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="rounded-2xl bg-white p-8 text-center text-sm font-semibold text-gray-500 shadow-sm">
              {t("common.loading")}
            </div>
          ) : visibleActivities.length === 0 ? (
            <div className="rounded-2xl bg-white p-8 text-center text-sm font-semibold text-gray-500 shadow-sm">
              {label("notifications.empty", "No notifications", "لا توجد إشعارات")}
            </div>
          ) : (
            visibleActivities.map((activity) => {
              const read = readIds.has(activity.id);
              const iconConfig = ICON_MAP[getTone(activity.type)];
              const IconComponent = iconConfig.icon;
              const body = isRTL
                ? activity.descriptionAr || activity.descriptionEn
                : activity.descriptionEn || activity.descriptionAr;
              const entityLabel = entityTypeLabel(activity.entityType);

              return (
                <div
                  key={activity.id}
                  onClick={() => setReadIds((ids) => new Set(ids).add(activity.id))}
                  className={`rounded-2xl border bg-white p-4 shadow-sm transition-all hover:shadow-md sm:p-5 ${
                    read ? "border-gray-100" : "border-[#f5efbb] bg-[#fffdf5]"
                  }`}
                >
                  <div className={`flex gap-3 sm:gap-4 ${isRTL ? "flex-row-reverse" : ""}`}>
                    <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full sm:h-11 sm:w-11 ${iconConfig.bg}`}>
                      <IconComponent className={`h-5 w-5 ${iconConfig.color}`} />
                    </div>

                    <div className={`min-w-0 flex-1 ${isRTL ? "text-right" : "text-left"}`}>
                      <div className={`flex items-start justify-between gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                        <h3 className={`text-sm font-bold text-[#3b2b20] sm:text-[15px] ${read ? "font-semibold" : ""}`}>
                          {activityTypeLabel(activity.type)}
                        </h3>
                        <div className={`flex flex-shrink-0 items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                          <span className="text-xs text-gray-400">{formatTime(activity.createdAt, locale)}</span>
                          {!read && <span className="h-2 w-2 rounded-full bg-[#3b2b20]" />}
                        </div>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-gray-500 sm:text-sm">
                        {body || label("notifications.defaultBody", "A new activity was recorded.", "تم تسجيل نشاط جديد.")}
                      </p>
                      <div className={`mt-2 flex flex-wrap items-center gap-2 text-[11px] text-gray-400 ${isRTL ? "flex-row-reverse" : ""}`}>
                        {entityLabel ? <span className="rounded-full bg-[#f8f4f0] px-2 py-1 text-[#7c6b5d]">{entityLabel}</span> : null}
                        <span>{formatDate(activity.createdAt, locale)}</span>
                      </div>
                    </div>

                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        setHiddenIds((ids) => new Set(ids).add(activity.id));
                      }}
                      className="self-start rounded-lg p-1.5 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-400"
                      aria-label={t("common.delete")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </MainLayout>
  );
}
