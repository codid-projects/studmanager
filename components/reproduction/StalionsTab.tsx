"use client";

import { useCallback, useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import DeleteConfirmModal from "@/components/common/DeleteConfirmModal";
import { useLocale } from "@/lib/locale-context";
import type { LocaleCode } from "@/lib/api/types";
import {
  deleteStallionRecord,
  getStallionDashboard,
  getStallionRecord,
  listStallionRecords,
  type StallionDashboard,
  type StallionRecord,
  type StallionRecordDetail,
  type StallionSection,
} from "@/lib/api/stallion-breeding-client";
import { useBreedingHorse } from "./shared/useBreedingHorse";
import { BreedingHorseCard } from "./shared/BreedingHorseCard";
import { RecordTable, type TableColumn } from "./shared/RecordTable";
import { NaturalBreedingForm } from "./stallions/NaturalBreedingForm";
import { SemenCollectionForm } from "./stallions/SemenCollectionForm";
import { SemenShipmentForm } from "./stallions/SemenShipmentForm";
import { StallionSoundnessForm } from "./stallions/StallionSoundnessForm";
import { StallionEditModal } from "./stallions/StallionEditModal";
import { ExpandableFormCard } from "./shared/ExpandableFormCard";

const sections: Array<{ key: StallionSection; ar: string; en: string }> = [
  { key: "breeding-events", ar: "الطلوقة الطبيعية", en: "Natural breeding" },
  { key: "semen-collections", ar: "جمع سائل منوي", en: "Semen collection" },
  { key: "semen-shipments", ar: "شحنة سائل منوي", en: "Semen shipment" },
  { key: "soundness-examinations", ar: "الفحص البيطري", en: "Soundness exam" },
];

export default function StallionsTab({
  initialHorseId,
  initialHorseName,
}: {
  initialHorseId?: string | null;
  initialHorseName?: string | null;
}) {
  const { locale: rawLocale, direction } = useLocale();
  const locale = (rawLocale === "en" ? "en" : "ar") as LocaleCode;
  const ar = locale === "ar";
  const horse = useBreedingHorse({
    locale,
    gender: "Male",
    initialHorseId,
    initialHorseName,
  });
  const [section, setSection] = useState<StallionSection>("breeding-events");
  const [dashboard, setDashboard] = useState<StallionDashboard | null>(null);
  const [records, setRecords] = useState<
    Record<StallionSection, StallionRecord[]>
  >({
    "breeding-events": [],
    "semen-collections": [],
    "semen-shipments": [],
    "soundness-examinations": [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<StallionRecord | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [editing, setEditing] = useState<StallionRecordDetail | null>(null);
  const load = useCallback(async () => {
    if (!horse.profile) return;
    setLoading(true);
    setError("");
    try {
      const [dash, ...lists] = await Promise.all([
        getStallionDashboard(locale, horse.profile.profileId),
        ...sections.map((item) =>
          listStallionRecords(locale, horse.profile!.profileId, item.key),
        ),
      ]);
      setDashboard(dash);
      setRecords({
        "breeding-events": lists[0].data ?? [],
        "semen-collections": lists[1].data ?? [],
        "semen-shipments": lists[2].data ?? [],
        "soundness-examinations": lists[3].data ?? [],
      });
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to load stallion records",
      );
    } finally {
      setLoading(false);
    }
  }, [horse.profile, locale]);
  useEffect(() => {
    void load();
  }, [load]);
  const columns: TableColumn<StallionRecord>[] = [
    {
      key: "related",
      label:
        section === "breeding-events"
          ? ar
            ? "الفرس المستقبلة"
            : "Mare"
          : ar
            ? "الفحل"
            : "Stallion",
      render: (row) =>
        section === "breeding-events"
          ? (ar
              ? row.relatedHorseNameAr || row.relatedHorseName
              : row.relatedHorseName) || "—"
          : ar
            ? horse.profile?.arabicName || horse.profile?.englishName
            : horse.profile?.englishName || horse.profile?.arabicName,
    },
    {
      key: "date",
      label: ar ? "التاريخ" : "Date",
      render: (row) =>
        new Date(row.recordDate).toLocaleDateString(ar ? "ar-EG" : "en-GB"),
    },
    {
      key: "vet",
      label: ar ? "المنفذ / الطبيب" : "Responsible person",
      render: (row) => row.veterinarianName || "—",
    },
    {
      key: "result",
      label:
        section === "semen-shipments"
          ? ar
            ? "المحطة"
            : "Destination"
          : ar
            ? "النتائج الأولية"
            : "Result",
      render: (row) =>
        row.destination ||
        (row.motilityPercent != null ? `${row.motilityPercent}%` : "—"),
    },
    {
      key: "price",
      label: ar ? "السعر" : "Cost",
      render: (row) => `${row.totalCost || 0} EGP`,
    },
  ];
  async function remove() {
    if (!deleteTarget) return;
    setBusyId(deleteTarget.id);
    try {
      await deleteStallionRecord(locale, section, deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Delete failed");
    } finally {
      setBusyId(null);
    }
  }
  async function edit(row: StallionRecord) {
    setBusyId(row.id);
    setError("");
    try {
      setEditing(await getStallionRecord(locale, section, row.id));
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to load record",
      );
    } finally {
      setBusyId(null);
    }
  }
  const meta = {
    "breeding-events": {
      ar: "تسجيل طلوقة جديدة",
      en: "New breeding service",
      subAr: "إضافة بيانات التلقيح والفرس",
      subEn: "Add breeding and mare details",
    },
    "semen-collections": {
      ar: "جمع سائل منوي جديد",
      en: "New semen collection",
      subAr: "تسجيل الجمع والتقييم المعملي",
      subEn: "Record collection and lab evaluation",
    },
    "semen-shipments": {
      ar: "إنشاء شحنة سائل منوي جديدة",
      en: "Create semen shipment",
      subAr: "إضافة بيانات الشحنة والتسليم",
      subEn: "Add shipment and delivery details",
    },
    "soundness-examinations": {
      ar: "فحص تناسلي للفحول",
      en: "Stallion soundness exam",
      subAr: "إضافة فحص سريري جديد",
      subEn: "Add a new clinical examination",
    },
  }[section];
  const save = async () => {
    setCreateOpen(false);
    await load();
  };
  return (
    <div className="space-y-3" dir={direction}>
      <nav className="flex flex-wrap justify-center gap-2">
        {sections.map((item) => (
          <button
            key={item.key}
            onClick={() => {
              setSection(item.key);
              setCreateOpen(false);
              setEditing(null);
            }}
            className={`h-9 rounded-[7px] border px-5 text-[11px] ${section === item.key ? "border-[#ad9352] bg-[#fff8c9]" : "border-transparent bg-white"}`}
          >
            {ar ? item.ar : item.en}
          </button>
        ))}
      </nav>
      <BreedingHorseCard
        locale={locale}
        gender="Male"
        onSelect={horse.select}
        profile={horse.profile}
        loading={horse.loading}
      />
      {(horse.error || error) && (
        <div className="rounded-lg bg-red-50 p-3 text-xs text-red-700">
          {horse.error || error}
        </div>
      )}
      {horse.profile && (
        <>
          <ExpandableFormCard
            open={createOpen}
            onToggle={() => setCreateOpen((v) => !v)}
            title={ar ? meta.ar : meta.en}
            subtitle={ar ? meta.subAr : meta.subEn}
          >
            {section === "breeding-events" && (
              <NaturalBreedingForm
                locale={locale}
                profile={horse.profile}
                onSaved={save}
              />
            )}
            {section === "semen-collections" && (
              <SemenCollectionForm
                locale={locale}
                profile={horse.profile}
                onSaved={save}
              />
            )}
            {section === "semen-shipments" && (
              <SemenShipmentForm
                locale={locale}
                profile={horse.profile}
                onSaved={save}
              />
            )}
            {section === "soundness-examinations" && (
              <StallionSoundnessForm
                locale={locale}
                profile={horse.profile}
                onSaved={save}
              />
            )}
          </ExpandableFormCard>
          {loading ? (
            <div className="grid h-28 place-items-center rounded-lg bg-white">
              <LoaderCircle className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <RecordTable
              rows={records[section]}
              columns={columns}
              emptyLabel={ar ? "لا توجد سجلات" : "No records"}
              onEdit={edit}
              onDelete={setDeleteTarget}
              busyId={busyId}
            />
          )}
          {dashboard && (
            <p className="text-center text-[10px] text-[#91847d]">
              {ar ? "إجمالي سجلات الفحل" : "Total stallion records"}:{" "}
              {dashboard.totalBreedingEvents +
                dashboard.totalCollections +
                dashboard.totalShipments +
                dashboard.totalSoundnessExams}
            </p>
          )}
          <StallionEditModal
            locale={locale}
            section={section}
            record={editing}
            onClose={() => setEditing(null)}
            onSaved={load}
          />
          <DeleteConfirmModal
            open={Boolean(deleteTarget)}
            title={ar ? "حذف سجل التربية؟" : "Delete breeding record?"}
            description={
              ar
                ? "لا يمكن التراجع عن هذا الإجراء."
                : "This action cannot be undone."
            }
            onCancel={() => !busyId && setDeleteTarget(null)}
            onConfirm={() => void remove()}
            loading={Boolean(busyId)}
          />
        </>
      )}
    </div>
  );
}
