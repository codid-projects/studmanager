"use client";

import { useCallback, useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import type { LocaleCode } from "@/lib/api/types";
import {
  deleteCycle,
  deleteExamination,
  deleteFoal,
  getExamination,
  getMareDashboard,
  listCycles,
  listExaminations,
  listFoals,
  type EstrusCycle,
  type ExaminationSummary,
  type FoalRegistration,
  type MareDashboard,
  type MareExaminationDetail,
} from "@/lib/api/mare-breeding-client";
import { useBreedingHorse } from "../shared/useBreedingHorse";
import { BreedingHorseCard } from "../shared/BreedingHorseCard";
import { RecordTable, type TableColumn } from "../shared/RecordTable";
import { MareOverview } from "./MareOverview";
import { FoalRegistrationForm } from "./FoalRegistrationForm";
import { OvulationExaminationForm } from "./OvulationExaminationForm";
import { EstrusCycleForm } from "./EstrusCycleForm";
import { MareSoundnessForm } from "./MareSoundnessForm";
import { ExpandableFormCard } from "../shared/ExpandableFormCard";
import { OvulationExaminationEditModal } from "./OvulationExaminationEditModal";

type Tab = "overview" | "foals" | "ovulation" | "cycles" | "soundness";

const tabs: Array<{ key: Tab; ar: string; en: string }> = [
  { key: "overview", ar: "ملخص التناسل", en: "Breeding summary" },
  { key: "foals", ar: "مولود جديد", en: "New foal" },
  { key: "ovulation", ar: "التحكم في التناسل", en: "Breeding control" },
  { key: "cycles", ar: "متابعة دورة الشبق", en: "Estrus Cycle Log" },
  { key: "soundness", ar: "فحص تناسلي", en: "Soundness exam" },
];

const date = (value: string, locale: string) =>
  new Date(value).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-GB");

export default function MareBreedingWorkspace({
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
    gender: "Female",
    initialHorseId,
    initialHorseName,
  });
  const [tab, setTab] = useState<Tab>("overview");
  const [dashboard, setDashboard] = useState<MareDashboard | null>(null);
  const [foals, setFoals] = useState<FoalRegistration[]>([]);
  const [ovulation, setOvulation] = useState<ExaminationSummary[]>([]);
  const [cycles, setCycles] = useState<EstrusCycle[]>([]);
  const [soundness, setSoundness] = useState<ExaminationSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editingOvulation, setEditingOvulation] = useState<MareExaminationDetail | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const load = useCallback(async () => {
    if (!horse.profile) return;
    setLoading(true);
    setError("");
    try {
      const [dash, f, o, c, s] = await Promise.all([
        getMareDashboard(locale, horse.profile.profileId),
        listFoals(locale, horse.profile.profileId),
        listExaminations(locale, horse.profile.profileId, "ovulation"),
        listCycles(locale, horse.profile.profileId),
        listExaminations(locale, horse.profile.profileId, "soundness"),
      ]);
      setDashboard(dash);
      setFoals(f.data ?? []);
      setOvulation(o.data ?? []);
      setCycles(c.data ?? []);
      setSoundness(s.data ?? []);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to load records",
      );
    } finally {
      setLoading(false);
    }
  }, [horse.profile, locale]);
  useEffect(() => {
    void load();
  }, [load]);
  const examColumns: TableColumn<ExaminationSummary>[] = [
    {
      key: "date",
      label: ar ? "التاريخ" : "Date",
      render: (row) => date(row.recordDate, locale),
    },
    {
      key: "vet",
      label: ar ? "الطبيب" : "Veterinarian",
      render: (row) => row.veterinarianName || "—",
    },
    {
      key: "cost",
      label: ar ? "السعر" : "Cost",
      render: (row) => `${row.totalCost ?? 0} EGP`,
    },
    {
      key: "follow",
      label: ar ? "متابعة" : "Follow-up",
      render: (row) =>
        row.hasFollowUp ? (ar ? "نعم" : "Yes") : ar ? "لا" : "No",
    },
  ];
  const foalColumns: TableColumn<FoalRegistration>[] = [
    {
      key: "name",
      label: ar ? "المهر" : "Foal",
      render: (row) => (ar ? row.foalNameAr || row.foalName : row.foalName),
    },
    {
      key: "date",
      label: ar ? "التاريخ" : "Date",
      render: (row) => date(row.birthDate, locale),
    },
    {
      key: "status",
      label: ar ? "النتيجة" : "Status",
      render: (row) => (ar ? row.birthStatusAr : row.birthStatus),
    },
    {
      key: "sire",
      label: ar ? "الفحل" : "Sire",
      render: (row) =>
        ar ? row.stallionNameAr || row.stallionName : row.stallionName,
    },
  ];
  const cycleColumns: TableColumn<EstrusCycle>[] = [
    {
      key: "start",
      label: ar ? "بداية الدورة" : "Start",
      render: (row) => date(row.startDate, locale),
    },
    {
      key: "end",
      label: ar ? "نهاية الدورة" : "End",
      render: (row) => (row.endDate ? date(row.endDate, locale) : "—"),
    },
    {
      key: "duration",
      label: ar ? "المدة" : "Duration",
      render: (row) => `${row.durationDays ?? "—"} ${ar ? "يوم" : "days"}`,
    },
    {
      key: "grade",
      label: ar ? "الشدة" : "Intensity",
      render: (row) => row.intensityLabel || row.intensityGrade || "—",
    },
  ];
  async function remove(kind: Tab, id: number) {
    if (kind === "foals") await deleteFoal(locale, id);
    else if (kind === "cycles") await deleteCycle(locale, id);
    else
      await deleteExamination(
        locale,
        kind === "ovulation" ? "ovulation" : "soundness",
        id,
      );
    await load();
  }
  async function editOvulation(row: ExaminationSummary) {
    setBusyId(row.id);
    setError("");
    try {
      setEditingOvulation(await getExamination(locale, row.id));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load examination");
    } finally {
      setBusyId(null);
    }
  }
  const formMeta = {
    foals: {
      ar: "تسجيل مولود جديد",
      en: "Register new foal",
      subAr: "إضافة بيانات المولود والنسب",
      subEn: "Add birth and parentage details",
    },
    ovulation: {
      ar: "التحكم في التناسل",
      en: "Breeding control",
      subAr: "تسجيل فحص تبويض جديد",
      subEn: "Record a new ovulation examination",
    },
    cycles: {
      ar: "متابعة دورة الشبق",
      en: "Estrus cycle tracking",
      subAr: "تسجيل دورة شبق جديدة",
      subEn: "Record a new estrus cycle",
    },
    soundness: {
      ar: "فحص تناسلي للفرس",
      en: "Mare soundness exam",
      subAr: "تسجيل فحص سريري جديد",
      subEn: "Record a new clinical examination",
    },
  } as const;
  const saved = async () => {
    setCreateOpen(false);
    await load();
  };
  return (
    <div className="space-y-3" dir={direction}>
      <nav className="flex flex-wrap justify-center gap-2">
        {tabs.map((item) => (
          <button
            key={item.key}
            onClick={() => {
              setTab(item.key);
              setCreateOpen(false);
            }}
            className={`h-9 rounded-[7px] border px-5 text-[11px] ${tab === item.key ? "border-[#ad9352] bg-[#fff8c9] text-[#352417]" : "border-transparent bg-white text-[#544a44]"}`}
          >
            {ar ? item.ar : item.en}
          </button>
        ))}
      </nav>
      <BreedingHorseCard
        locale={locale}
        gender="Female"
        onSelect={horse.select}
        profile={horse.profile}
        loading={horse.loading}
      />
      {(horse.error || error) && (
        <div className="rounded-lg bg-red-50 p-3 text-xs text-red-700">
          {horse.error || error}
        </div>
      )}
      {loading && (
        <div className="grid h-32 place-items-center rounded-lg bg-white">
          <LoaderCircle className="h-6 w-6 animate-spin" />
        </div>
      )}
      {horse.profile && !loading && (
        <>
          {tab === "overview" && dashboard && (
            <MareOverview dashboard={dashboard} locale={locale} />
          )}
          {tab === "foals" && (
            <>
              <ExpandableFormCard
                open={createOpen}
                onToggle={() => setCreateOpen((value) => !value)}
                title={ar ? formMeta.foals.ar : formMeta.foals.en}
                subtitle={ar ? formMeta.foals.subAr : formMeta.foals.subEn}
              >
                <FoalRegistrationForm
                  locale={locale}
                  profile={horse.profile}
                  onSaved={saved}
                />
              </ExpandableFormCard>
              <RecordTable
                rows={foals}
                columns={foalColumns}
                emptyLabel={ar ? "لا توجد مواليد مسجلة" : "No foal records"}
                onDelete={(row) => void remove("foals", row.id)}
              />
            </>
          )}
          {tab === "ovulation" && (
            <>
              <ExpandableFormCard
                open={createOpen}
                onToggle={() => setCreateOpen((value) => !value)}
                title={ar ? formMeta.ovulation.ar : formMeta.ovulation.en}
                subtitle={
                  ar ? formMeta.ovulation.subAr : formMeta.ovulation.subEn
                }
              >
                <OvulationExaminationForm
                  locale={locale}
                  profile={horse.profile}
                  onSaved={saved}
                />
              </ExpandableFormCard>
              <RecordTable
                rows={ovulation}
                columns={examColumns}
                emptyLabel={ar ? "لا توجد فحوصات" : "No examinations"}
                onEdit={(row) => void editOvulation(row)}
                onDelete={(row) => void remove("ovulation", row.id)}
                busyId={busyId}
              />
              <OvulationExaminationEditModal
                locale={locale}
                record={editingOvulation}
                onClose={() => setEditingOvulation(null)}
                onSaved={load}
              />
            </>
          )}
          {tab === "cycles" && (
            <>
              <ExpandableFormCard
                open={createOpen}
                onToggle={() => setCreateOpen((value) => !value)}
                title={ar ? formMeta.cycles.ar : formMeta.cycles.en}
                subtitle={ar ? formMeta.cycles.subAr : formMeta.cycles.subEn}
              >
                <EstrusCycleForm
                  locale={locale}
                  profile={horse.profile}
                  cycles={cycles}
                  onSaved={saved}
                />
              </ExpandableFormCard>
              <RecordTable
                rows={cycles}
                columns={cycleColumns}
                emptyLabel={ar ? "لا توجد دورات مسجلة" : "No cycles"}
                onDelete={(row) => void remove("cycles", row.id)}
              />
            </>
          )}
          {tab === "soundness" && (
            <>
              <ExpandableFormCard
                open={createOpen}
                onToggle={() => setCreateOpen((value) => !value)}
                title={ar ? formMeta.soundness.ar : formMeta.soundness.en}
                subtitle={
                  ar ? formMeta.soundness.subAr : formMeta.soundness.subEn
                }
              >
                <MareSoundnessForm
                  locale={locale}
                  profile={horse.profile}
                  onSaved={saved}
                />
              </ExpandableFormCard>
              <RecordTable
                rows={soundness}
                columns={examColumns}
                emptyLabel={ar ? "لا توجد فحوصات" : "No examinations"}
                onDelete={(row) => void remove("soundness", row.id)}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
