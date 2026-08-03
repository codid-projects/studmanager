"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Edit,
  Paperclip,
  Search,
  Trash2,
  X,
} from "lucide-react";
import DeleteConfirmModal from "@/components/common/DeleteConfirmModal";
import { OptionPicker } from "@/components/common/OptionPicker";
import { HorsePicker } from "@/components/horses/HorsePicker";
import {
  createHealthVeterinarian,
  createHealthRecord,
  deleteHealthRecord,
  fetchHealthVeterinarians,
  fetchSettingRecords,
  getHealthRecord,
  listHealthRecords,
  updateHealthRecord,
  type HealthCategorySlug,
  type HealthRecordDetail,
  type HealthRecordSummary,
  type SettingRecord,
} from "@/lib/api/health-care-client";
import {
  removeContact,
  removeSettingRecord,
  saveSettingRecord,
} from "@/lib/api/management-client";
import { SETTING_RECORD_CATEGORY } from "@/lib/settings-record-categories";
import type { LocaleCode, SummarizedContactDto } from "@/lib/api/types";
import { useLocale, useTranslation } from "@/lib/locale-context";

const PAGE_SIZE = 10;

// RecordCategory enum values on the backend (Settings lookup lists).
const LOOKUP = {
  bloodAnalysis: SETTING_RECORD_CATEGORY.bloodTest,
  dewormingDose: SETTING_RECORD_CATEGORY.wormDose,
  injuries: SETTING_RECORD_CATEGORY.injuries,
  medicalCare: SETTING_RECORD_CATEGORY.medicalCare,
  medications: SETTING_RECORD_CATEGORY.medications,
  medicationReasons: SETTING_RECORD_CATEGORY.medicationReasons,
  xRay: SETTING_RECORD_CATEGORY.xRay,
  vaccinations: SETTING_RECORD_CATEGORY.vaccinations,
  vaccinationReasons: SETTING_RECORD_CATEGORY.vaccinationReasons,
  shoeing: SETTING_RECORD_CATEGORY.shoeing,
  hoofTrimming: SETTING_RECORD_CATEGORY.hoofLegCare,
} as const;

const SEVERITIES = [
  { id: 1, ar: "بسيطة", en: "Minor" },
  { id: 2, ar: "متوسطة", en: "Moderate" },
  { id: 3, ar: "شديدة", en: "Severe" },
  { id: 4, ar: "حرجة", en: "Critical" },
  { id: 5, ar: "تهدد الحياة", en: "Life Threatening" },
];

interface SpecificField {
  // FormData key — must match the backend DTO property name.
  name: string;
  kind: "lookup" | "text" | "number" | "bool" | "severity";
  lookupCategory?: number;
  labelAr: string;
  labelEn: string;
  // Key of HealthRecordDetail holding the current value when editing.
  detailKey: keyof HealthRecordDetail;
}

interface CategoryDefinition {
  slug: HealthCategorySlug;
  titleAr: string;
  titleEn: string;
  fields: SpecificField[];
}

// Keyed by the frontend category id used in /health/[category] URLs.
export const HEALTH_CATEGORY_API: Record<string, CategoryDefinition> = {
  injuries: {
    slug: "injuries",
    titleAr: "الإصابات",
    titleEn: "Injuries",
    fields: [
      { name: "InjuryTypeId", kind: "lookup", lookupCategory: LOOKUP.injuries, labelAr: "نوع الإصابة", labelEn: "Injury type", detailKey: "injuryTypeId" },
      { name: "InjuryReason", kind: "text", labelAr: "سبب الإصابة", labelEn: "Injury reason", detailKey: "injuryReason" },
      { name: "Severity", kind: "severity", labelAr: "الشدة", labelEn: "Severity", detailKey: "severity" },
    ],
  },
  "blood-tests": {
    slug: "blood-tests",
    titleAr: "تحاليل الدم",
    titleEn: "Blood Tests",
    fields: [
      { name: "BloodTestTypeId", kind: "lookup", lookupCategory: LOOKUP.bloodAnalysis, labelAr: "نوع التحليل", labelEn: "Test type", detailKey: "bloodTestTypeId" },
      { name: "IsPositive", kind: "bool", labelAr: "النتيجة إيجابية", labelEn: "Positive result", detailKey: "isPositive" },
    ],
  },
  "worm-doses": {
    slug: "worm-doses",
    titleAr: "جرعة الديدان",
    titleEn: "Worming Doses",
    fields: [
      { name: "DoseTypeId", kind: "lookup", lookupCategory: LOOKUP.dewormingDose, labelAr: "نوع الجرعة", labelEn: "Dose type", detailKey: "doseTypeId" },
      { name: "Quantity", kind: "number", labelAr: "الكمية", labelEn: "Quantity", detailKey: "quantity" },
    ],
  },
  "hoof-care": {
    slug: "hoof-care",
    titleAr: "العناية بالحافر والساق",
    titleEn: "Hoof & Leg Care",
    fields: [
      { name: "ShoeingTypeId", kind: "lookup", lookupCategory: LOOKUP.shoeing, labelAr: "نوع التنعيل", labelEn: "Shoeing type", detailKey: "shoeingTypeId" },
      { name: "HoofTrimmingTypeId", kind: "lookup", lookupCategory: LOOKUP.hoofTrimming, labelAr: "نوع تقليم الحوافر", labelEn: "Trimming type", detailKey: "hoofTrimmingTypeId" },
    ],
  },
  "vet-care": {
    slug: "medical-care",
    titleAr: "الرعاية البيطرية",
    titleEn: "Veterinary Care",
    fields: [
      { name: "CareTypeId", kind: "lookup", lookupCategory: LOOKUP.medicalCare, labelAr: "نوع الرعاية", labelEn: "Care type", detailKey: "careTypeId" },
    ],
  },
  medications: {
    slug: "medications",
    titleAr: "الأدوية",
    titleEn: "Medications",
    fields: [
      { name: "TreatmentTypeId", kind: "lookup", lookupCategory: LOOKUP.medications, labelAr: "نوع العلاج", labelEn: "Treatment type", detailKey: "treatmentTypeId" },
      { name: "TreatmentReasonId", kind: "lookup", lookupCategory: LOOKUP.medicationReasons, labelAr: "سبب العلاج", labelEn: "Treatment reason", detailKey: "treatmentReasonId" },
    ],
  },
  "x-rays": {
    slug: "x-rays",
    titleAr: "الأشعة",
    titleEn: "X-Rays",
    fields: [
      { name: "XRayTypeId", kind: "lookup", lookupCategory: LOOKUP.xRay, labelAr: "نوع الأشعة", labelEn: "X-ray type", detailKey: "xRayTypeId" },
    ],
  },
  vaccinations: {
    slug: "vaccinations",
    titleAr: "التطعيمات",
    titleEn: "Vaccinations",
    fields: [
      { name: "VaccineTypeId", kind: "lookup", lookupCategory: LOOKUP.vaccinations, labelAr: "نوع التطعيم", labelEn: "Vaccine type", detailKey: "vaccineTypeId" },
      { name: "ReasonTypeId", kind: "lookup", lookupCategory: LOOKUP.vaccinationReasons, labelAr: "سبب التطعيم", labelEn: "Vaccination reason", detailKey: "reasonTypeId" },
      { name: "Dose", kind: "number", labelAr: "الجرعة", labelEn: "Dose", detailKey: "dose" },
    ],
  },
  "weight-height": {
    slug: "growth",
    titleAr: "الوزن والطول",
    titleEn: "Weight & Height",
    fields: [
      { name: "WeightKg", kind: "number", labelAr: "الوزن (كجم)", labelEn: "Weight (kg)", detailKey: "weightKg" },
      { name: "HeightCm", kind: "number", labelAr: "الطول (سم)", labelEn: "Height (cm)", detailKey: "heightCm" },
    ],
  },
};

function dateInputValue(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}

function formatDate(value: string | null | undefined, locale: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-GB");
}

const inputClass =
  "w-full h-11 rounded-xl border border-[#e4d9cf] bg-[#fdfbf9] px-3 text-sm text-[#2f261f] outline-none transition focus:border-[#4b2f1a] focus:bg-white";

export function HealthRecordsTable({
  categoryId,
  horseId,
  horseName,
}: {
  categoryId: string;
  horseId?: number;
  horseName?: string;
}) {
  const { locale, direction } = useLocale();
  const { t } = useTranslation();
  const localeCode = locale as LocaleCode;
  const isRTL = direction === "rtl";
  const definition = HEALTH_CATEGORY_API[categoryId];

  const [records, setRecords] = useState<HealthRecordSummary[]>([]);
  const [lookups, setLookups] = useState<Record<number, SettingRecord[]>>({});
  const [vets, setVets] = useState<SummarizedContactDto[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<HealthRecordDetail | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<HealthRecordSummary | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  // Form state (shared fields).
  const [formHorseId, setFormHorseId] = useState<number | null>(horseId ?? null);
  const [formHorseLabel, setFormHorseLabel] = useState(horseName ?? "");
  const [formVetId, setFormVetId] = useState<number | "">("");
  const [formVetName, setFormVetName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formNotifyDate, setFormNotifyDate] = useState("");
  const [formCost, setFormCost] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formSpecific, setFormSpecific] = useState<Record<string, string>>({});
  const [formFiles, setFormFiles] = useState<File[]>([]);
  const [keptAttachments, setKeptAttachments] = useState<Array<{ id: number; fileUrl: string | null }>>([]);

  const title = definition ? (isRTL ? definition.titleAr : definition.titleEn) : categoryId;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    if (!definition) return;
    setLoading(true);
    setError("");
    try {
      const result = await listHealthRecords(localeCode, definition.slug, {
        horseId,
        search: debouncedSearch || undefined,
        pageNumber: page,
        pageSize: PAGE_SIZE,
      });
      setRecords(result?.data ?? []);
      setTotalPages(result?.totalPages ?? 0);
      setTotalCount(result?.totalCount ?? 0);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("common.error"));
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [definition, localeCode, horseId, debouncedSearch, page, t]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!definition) return;
    let active = true;

    fetchHealthVeterinarians(localeCode)
      .then((result) => {
        if (active) setVets(Array.isArray(result) ? result : []);
      })
      .catch(() => {
        if (active) setVets([]);
      });

    const categories = definition.fields
      .filter((field) => field.kind === "lookup" && field.lookupCategory)
      .map((field) => field.lookupCategory as number);

    for (const category of categories) {
      fetchSettingRecords(localeCode, category)
        .then((items) => {
          if (active) setLookups((current) => ({ ...current, [category]: items }));
        })
        .catch(() => {
          if (active) setLookups((current) => ({ ...current, [category]: [] }));
        });
    }

    return () => {
      active = false;
    };
  }, [definition, localeCode]);

  const refreshVeterinarians = useCallback(async () => {
    const items = await fetchHealthVeterinarians(localeCode);
    const normalizedItems = Array.isArray(items) ? items : [];
    setVets(normalizedItems);
    return normalizedItems;
  }, [localeCode]);

  const refreshLookupCategory = useCallback(async (category: number) => {
    const items = await fetchSettingRecords(localeCode, category);
    setLookups((current) => ({ ...current, [category]: items }));
    return items;
  }, [localeCode]);

  const lookupNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const items of Object.values(lookups)) {
      for (const item of items) {
        map.set(String(item.id), isRTL ? item.arabicName || item.englishName : item.englishName || item.arabicName);
      }
    }
    return map;
  }, [lookups, isRTL]);

  function resetForm(detail?: HealthRecordDetail | null) {
    setFormError("");
    setFormFiles([]);
    if (detail) {
      setFormHorseId(detail.horseId);
      setFormHorseLabel(
        (isRTL ? detail.horseNameAr || detail.horseNameEn : detail.horseNameEn || detail.horseNameAr) ?? "",
      );
      setFormVetId(detail.veterinarianId ?? "");
      setFormVetName(detail.veterinarianName ?? "");
      setFormPhone(detail.phoneNumber ?? "");
      setFormDate(dateInputValue(detail.recordDate));
      setFormNotifyDate(dateInputValue(detail.notifyOnDate));
      setFormCost(detail.cost == null ? "" : String(detail.cost));
      setFormNotes(detail.notes ?? "");
      setKeptAttachments(detail.attachments ?? []);
      const specific: Record<string, string> = {};
      for (const field of definition?.fields ?? []) {
        const value = detail[field.detailKey];
        specific[field.name] =
          value == null ? "" : typeof value === "boolean" ? (value ? "true" : "false") : String(value);
      }
      setFormSpecific(specific);
    } else {
      setFormHorseId(horseId ?? null);
      setFormHorseLabel(horseName ?? "");
      setFormVetId("");
      setFormVetName("");
      setFormPhone("");
      setFormDate("");
      setFormNotifyDate("");
      setFormCost("");
      setFormNotes("");
      setFormSpecific({});
      setKeptAttachments([]);
    }
  }

  function openAdd() {
    setEditing(null);
    resetForm(null);
    setModalOpen(true);
  }

  async function openEdit(row: HealthRecordSummary) {
    if (!definition) return;
    setBusyId(row.id);
    setError("");
    try {
      const detail = await getHealthRecord(localeCode, definition.slug, row.id);
      setEditing(detail);
      resetForm(detail);
      setModalOpen(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("common.error"));
    } finally {
      setBusyId(null);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!definition) return;

    if (!editing && !formHorseId) {
      setFormError(isRTL ? "يرجى اختيار الخيل" : "Please select a horse");
      return;
    }

    const missingField = definition.fields.find(
      (field) => !(formSpecific[field.name] ?? "").trim(),
    );
    if (missingField) {
      setFormError(isRTL
        ? `يرجى تعبئة حقل ${missingField.labelAr}`
        : `Please complete ${missingField.labelEn}`);
      return;
    }

    setSaving(true);
    setFormError("");
    try {
      const data = new FormData();
      if (!editing) data.set("HorseId", String(formHorseId));
      if (formVetId !== "") data.set("VeterinarianId", String(formVetId));
      if (formVetName.trim()) data.set("VeterinarianName", formVetName.trim());
      if (formPhone.trim()) data.set("PhoneNumber", formPhone.trim());
      if (formDate) data.set("RecordDate", formDate);
      if (formNotifyDate) data.set("NotifyOnDate", formNotifyDate);
      if (formCost.trim()) data.set("Cost", formCost.trim());
      if (formNotes.trim()) data.set("Notes", formNotes.trim());

      for (const field of definition.fields) {
        const value = (formSpecific[field.name] ?? "").trim();
        if (value !== "") data.set(field.name, value);
      }

      if (editing) {
        for (const attachment of keptAttachments) data.append("AttachmentIdsToKeep", String(attachment.id));
        for (const file of formFiles) data.append("NewAttachments", file);
        await updateHealthRecord(localeCode, definition.slug, editing.id, data);
      } else {
        for (const file of formFiles) data.append("Attachments", file);
        await createHealthRecord(localeCode, definition.slug, data);
      }

      setModalOpen(false);
      setEditing(null);
      await load();
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : t("common.error"));
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!definition || !deleteTarget) return;
    setSaving(true);
    try {
      await deleteHealthRecord(localeCode, definition.slug, deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("common.error"));
    } finally {
      setSaving(false);
    }
  }

  if (!definition) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center text-sm text-[#7a6c63]">
        {isRTL ? "قسم غير معروف" : "Unknown category"}
      </div>
    );
  }

  const isGrowth = definition.slug === "growth";
  const hasReasonColumn = definition.fields.some(
    (field) => field.kind === "lookup" && field.name !== definition.fields[0]?.name,
  ) || definition.slug === "injuries";

  const horseLabel = (row: HealthRecordSummary) =>
    (isRTL ? row.horseNameAr || row.horseNameEn : row.horseNameEn || row.horseNameAr) || `#${row.horseId}`;
  const typeLabel = (row: HealthRecordSummary) =>
    (isRTL ? row.procedureTypeNameAr || row.procedureTypeNameEn : row.procedureTypeNameEn || row.procedureTypeNameAr) || "—";
  const reasonLabel = (row: HealthRecordSummary) =>
    (isRTL ? row.procedureReasonNameAr || row.procedureReasonNameEn : row.procedureReasonNameEn || row.procedureReasonNameAr) || "—";

  return (
    <div className="rounded-[2rem] border border-[#f3ece7] bg-white p-4 font-cairo shadow-sm sm:p-8" dir={direction}>
      <div className="mb-6 flex flex-col items-start justify-between gap-4 xl:flex-row xl:items-center">
        <h2 className="whitespace-nowrap text-2xl font-bold text-[#3b2b20]">
          {title}
          {horseName ? <span className="ms-2 text-sm font-semibold text-[#8a7a6d]">— {horseName}</span> : null}
        </h2>

        <div className="flex w-full flex-col items-stretch gap-3 sm:flex-row sm:items-center xl:w-auto">
          <div className="relative flex-1 sm:w-80">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={isRTL ? "البحث" : "Search"}
              className={`w-full rounded-2xl border border-[#ece2da] bg-[#fdfbf9] px-5 py-3 text-sm shadow-sm outline-none transition-all focus:border-[#4b2f1a] ${isRTL ? "pr-11" : "pl-11"}`}
            />
            <Search className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a7a6d] ${isRTL ? "right-4" : "left-4"}`} />
          </div>
          <button
            onClick={openAdd}
            className="flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl bg-[#3b2b20] px-6 py-3 text-[1.02rem] font-bold text-white shadow-md transition-all hover:bg-[#2e2119] active:scale-95"
          >
            <span className="text-xl leading-none">+</span>
            {isRTL ? "إضافة سجل جديد" : "Add New Record"}
          </button>
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-xl border border-[#f2c7c7] bg-[#fff3f3] px-4 py-3 text-sm text-[#b04444]">{error}</div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px]">
          <thead>
            <tr className="bg-[#4b2f1a] text-sm text-white">
              <th className="px-4 py-4 text-start font-semibold">{isRTL ? "اسم الخيل" : "Horse"}</th>
              {isGrowth ? null : (
                <th className="px-4 py-4 text-start font-semibold">{isRTL ? "النوع" : "Type"}</th>
              )}
              {hasReasonColumn && !isGrowth ? (
                <th className="px-4 py-4 text-start font-semibold">{isRTL ? "السبب / التفاصيل" : "Reason / Details"}</th>
              ) : null}
              <th className="px-4 py-4 text-start font-semibold">{isRTL ? "المعالج" : "Veterinarian"}</th>
              <th className="px-4 py-4 text-start font-semibold">{isRTL ? "التاريخ" : "Date"}</th>
              <th className="px-4 py-4 text-start font-semibold">{isRTL ? "التكلفة" : "Cost"}</th>
              <th className="px-4 py-4 text-center font-semibold">{isRTL ? "الإجراءات" : "Actions"}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-[#8a7a6d]">
                  {t("common.loading")}
                </td>
              </tr>
            ) : records.length ? (
              records.map((row, index) => (
                <tr
                  key={row.id}
                  className={`border-b border-gray-100 transition-colors last:border-0 hover:bg-gray-50 ${index % 2 === 0 ? "bg-white" : "bg-[#fdfbf7]"}`}
                >
                  <td className="px-4 py-4 text-start font-medium text-[#3b2b20]">{horseLabel(row)}</td>
                  {isGrowth ? null : <td className="px-4 py-4 text-start text-gray-600">{typeLabel(row)}</td>}
                  {hasReasonColumn && !isGrowth ? (
                    <td className="px-4 py-4 text-start text-gray-600">{reasonLabel(row)}</td>
                  ) : null}
                  <td className="px-4 py-4 text-start text-gray-600">{row.veterinarianName || "—"}</td>
                  <td className="px-4 py-4 text-start text-gray-600">{formatDate(row.recordDate, locale)}</td>
                  <td className="px-4 py-4 text-start text-gray-600">{row.cost == null ? "—" : row.cost}</td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => void openEdit(row)}
                        disabled={busyId === row.id}
                        className="rounded-lg border border-gray-200 p-1.5 text-gray-400 transition-colors hover:bg-gray-100 disabled:opacity-50"
                        aria-label={isRTL ? "تعديل" : "Edit"}
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(row)}
                        className="rounded-lg border border-red-100 p-1.5 text-[#e53e3e] transition-colors hover:bg-red-50"
                        aria-label={isRTL ? "حذف" : "Delete"}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-[#8a7a6d]">
                  {t("common.noRecordsFound")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page <= 1}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-40"
            aria-label={isRTL ? "الصفحة السابقة" : "Previous page"}
          >
            {isRTL ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
          <span className="px-2 text-sm font-bold text-[#3b2b20]">
            {page} / {totalPages}
            <span className="ms-2 text-xs font-semibold text-[#8a7a6d]">
              ({totalCount} {isRTL ? "سجل" : "records"})
            </span>
          </span>
          <button
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page >= totalPages}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-40"
            aria-label={isRTL ? "الصفحة التالية" : "Next page"}
          >
            {isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </div>
      ) : null}

      {modalOpen ? (
        <div className="fixed inset-0 z-[150] grid place-items-center bg-[#25160d]/55 p-4 backdrop-blur-sm" dir={direction}>
          <form
            onSubmit={submit}
            className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
          >
            <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-5 py-4">
              <h3 className="font-bold text-[#3b2b20]">
                {editing
                  ? isRTL ? `تعديل سجل - ${title}` : `Edit record — ${title}`
                  : isRTL ? `سجل جديد - ${title}` : `New record — ${title}`}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-full p-2 hover:bg-gray-100"
                aria-label={t("common.close")}
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-xs font-bold text-[#6b5a4c]">{isRTL ? "الخيل" : "Horse"} *</span>
                {editing ? (
                  <input value={formHorseLabel} disabled className={`${inputClass} bg-[#f3ede8]`} />
                ) : (
                  <HorsePicker
                    value={formHorseId}
                    selectedLabel={formHorseLabel || undefined}
                    onChange={(horse) => {
                      setFormHorseId(horse.localId ?? horse.id);
                      setFormHorseLabel(
                        (isRTL ? horse.arabicName || horse.englishName : horse.englishName || horse.arabicName) ?? "",
                      );
                    }}
                  />
                )}
                {!editing ? (
                  <input
                    className="sr-only"
                    tabIndex={-1}
                    aria-hidden="true"
                    required
                    value={formHorseId ?? ""}
                    onChange={() => undefined}
                  />
                ) : null}
              </label>

              {definition.fields.map((field) => (
                <div key={field.name} className="block">
                  <span className="mb-1 block text-xs font-bold text-[#6b5a4c]">
                    {isRTL ? field.labelAr : field.labelEn}
                  </span>
                  {field.kind === "lookup" ? (
                    <OptionPicker
                      value={formSpecific[field.name] ?? ""}
                      options={(lookups[field.lookupCategory ?? 0] ?? []).map((item) => ({
                        id: item.id,
                        label: isRTL
                          ? item.arabicName || item.englishName
                          : item.englishName || item.arabicName,
                        subtitle: isRTL
                          ? item.englishName || undefined
                          : item.arabicName || undefined,
                      }))}
                      placeholder={isRTL ? "اختر" : "Select"}
                      title={isRTL ? field.labelAr : field.labelEn}
                      searchPlaceholder={isRTL ? "ابحث في الخيارات" : "Search options"}
                      emptyText={isRTL ? "لا توجد خيارات" : "No options"}
                      onChange={(option) =>
                        setFormSpecific((current) => ({ ...current, [field.name]: String(option.id) }))
                      }
                      createLabel={isRTL ? "إضافة خيار جديد" : "Add new option"}
                      createTitle={isRTL
                        ? `إضافة ${field.labelAr}`
                        : `Add ${field.labelEn.toLowerCase()}`}
                      createFields={[
                        {
                          key: "arabicName",
                          label: isRTL ? "الاسم بالعربية" : "Arabic name",
                          required: true,
                        },
                        {
                          key: "englishName",
                          label: isRTL ? "الاسم بالإنجليزية" : "English name",
                          required: true,
                        },
                      ]}
                      onCreate={async (values) => {
                        const category = field.lookupCategory ?? 0;
                        const englishName = values.englishName.trim();
                        const arabicName = values.arabicName.trim();
                        const previousIds = new Set(
                          (lookups[category] ?? []).map((item) => item.id),
                        );

                        const result = await saveSettingRecord(localeCode, {
                          englishName,
                          arabicName,
                          description: "",
                          category,
                        });
                        if (result?.succeeded === false) {
                          throw new Error(result.message || (isRTL
                            ? "تعذر إضافة الخيار"
                            : "Could not add the option"));
                        }
                        const items = await refreshLookupCategory(category);
                        const matchesNames = (item: SettingRecord) =>
                          (item.englishName ?? "").trim().toLowerCase() === englishName.toLowerCase()
                          && (item.arabicName ?? "").trim().toLowerCase() === arabicName.toLowerCase();
                        const created = items.find((item) =>
                          !previousIds.has(item.id) && matchesNames(item),
                        ) ?? items.find(matchesNames);
                        if (!created) {
                          throw new Error(isRTL
                            ? "تمت الإضافة لكن تعذر تحديد الخيار الجديد"
                            : "The option was added but could not be selected");
                        }

                        return {
                          id: created.id,
                          label: isRTL
                            ? created.arabicName || created.englishName
                            : created.englishName || created.arabicName,
                          subtitle: isRTL
                            ? created.englishName || undefined
                            : created.arabicName || undefined,
                        };
                      }}
                      onDelete={async (option) => {
                        const category = field.lookupCategory ?? 0;
                        const result = await removeSettingRecord(localeCode, Number(option.id));
                        if (result?.succeeded === false) {
                          throw new Error(result.message || (isRTL
                            ? "تعذر حذف الخيار"
                            : "Could not delete the option"));
                        }
                        await refreshLookupCategory(category);
                        if (String(option.id) === (formSpecific[field.name] ?? "")) {
                          setFormSpecific((current) => ({ ...current, [field.name]: "" }));
                        }
                      }}
                      deleteLabel={isRTL ? "حذف" : "Delete"}
                      deleteTitle={isRTL ? "حذف الخيار" : "Delete option"}
                      deleteDescription={isRTL
                        ? "سيُحذف هذا الخيار من الإعدادات أيضاً. لا يمكن حذف خيار مستخدم في سجل حالي."
                        : "This also removes the option from Settings. Options used by existing records cannot be deleted."}
                      disabled={!field.lookupCategory}
                    />
                  ) : field.kind === "severity" ? (
                    <select
                      value={formSpecific[field.name] ?? ""}
                      onChange={(event) =>
                        setFormSpecific((current) => ({ ...current, [field.name]: event.target.value }))
                      }
                      className={inputClass}
                      required
                    >
                      <option value="">{isRTL ? "اختر" : "Select"}</option>
                      {SEVERITIES.map((severity) => (
                        <option key={severity.id} value={severity.id}>
                          {isRTL ? severity.ar : severity.en}
                        </option>
                      ))}
                    </select>
                  ) : field.kind === "bool" ? (
                    <select
                      value={formSpecific[field.name] ?? ""}
                      onChange={(event) =>
                        setFormSpecific((current) => ({ ...current, [field.name]: event.target.value }))
                      }
                      className={inputClass}
                      required
                    >
                      <option value="">{isRTL ? "غير محدد" : "Not set"}</option>
                      <option value="true">{isRTL ? "نعم" : "Yes"}</option>
                      <option value="false">{isRTL ? "لا" : "No"}</option>
                    </select>
                  ) : field.kind === "number" ? (
                    <input
                      type="number"
                      step="0.01"
                      value={formSpecific[field.name] ?? ""}
                      onChange={(event) =>
                        setFormSpecific((current) => ({ ...current, [field.name]: event.target.value }))
                      }
                      className={inputClass}
                      required
                    />
                  ) : (
                    <input
                      value={formSpecific[field.name] ?? ""}
                      onChange={(event) =>
                        setFormSpecific((current) => ({ ...current, [field.name]: event.target.value }))
                      }
                      className={inputClass}
                      required
                    />
                  )}
                </div>
              ))}

              <div className="block">
                <span className="mb-1 block text-xs font-bold text-[#6b5a4c]">{isRTL ? "الطبيب البيطري" : "Veterinarian"}</span>
                <OptionPicker
                  value={formVetId}
                  options={vets.map((vet) => ({
                    id: vet.id,
                    label: vet.name,
                    subtitle: vet.phone ?? undefined,
                  }))}
                  onChange={(option) => {
                    const vet = vets.find((item) => item.id === Number(option.id));
                    setFormVetId(Number(option.id));
                    setFormVetName(vet?.name ?? option.label);
                    setFormPhone(vet?.phone ?? option.subtitle ?? "");
                  }}
                  placeholder={isRTL ? "اختر أو اكتب الاسم" : "Select or type a name"}
                  title={isRTL ? "الطبيب البيطري" : "Veterinarian"}
                  searchPlaceholder={isRTL ? "ابحث عن طبيب بيطري" : "Search veterinarians"}
                  emptyText={isRTL ? "لا يوجد أطباء بيطريون" : "No veterinarians"}
                  createLabel={isRTL ? "إضافة طبيب بيطري جديد" : "Add new veterinarian"}
                  createTitle={isRTL ? "إضافة طبيب بيطري" : "Add veterinarian"}
                  createFields={[
                    {
                      key: "name",
                      label: isRTL ? "الاسم" : "Name",
                      required: true,
                    },
                    {
                      key: "phone",
                      label: isRTL ? "رقم الهاتف" : "Phone number",
                      type: "tel",
                    },
                    {
                      key: "email",
                      label: isRTL ? "البريد الإلكتروني" : "Email",
                    },
                  ]}
                  onCreate={async (values) => {
                    const name = (values.name ?? "").trim();
                    const phone = (values.phone ?? "").trim();
                    const email = (values.email ?? "").trim();
                    const created = await createHealthVeterinarian(localeCode, {
                      name,
                      phone: phone || undefined,
                      email: email || undefined,
                    });
                    const items = await refreshVeterinarians();
                    const veterinarian = items.find((item) => item.id === created.id) ?? created;
                    if (!veterinarian?.id) {
                      throw new Error(isRTL
                        ? "تمت الإضافة لكن تعذر تحديد الطبيب الجديد"
                        : "The veterinarian was added but could not be selected");
                    }

                    return {
                      id: veterinarian.id,
                      label: veterinarian.name || name,
                      subtitle: veterinarian.phone ?? undefined,
                    };
                  }}
                  onDelete={async (option) => {
                    const result = await removeContact(localeCode, Number(option.id));
                    if (result?.succeeded === false) {
                      throw new Error(result.message || (isRTL
                        ? "تعذر حذف الطبيب البيطري"
                        : "Could not delete the veterinarian"));
                    }
                    await refreshVeterinarians();
                    if (Number(option.id) === formVetId) {
                      setFormVetId("");
                      setFormVetName("");
                      setFormPhone("");
                    }
                  }}
                  deleteLabel={isRTL ? "حذف" : "Delete"}
                  deleteTitle={isRTL ? "حذف الطبيب البيطري" : "Delete veterinarian"}
                  deleteDescription={isRTL
                    ? "سيُحذف الطبيب من جهات الاتصال أيضاً. لا يمكن حذف طبيب مرتبط بسجل حالي."
                    : "This also removes the veterinarian from Contacts. Veterinarians linked to existing records cannot be deleted."}
                />
              </div>
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-[#6b5a4c]">{isRTL ? "اسم المعالج" : "Veterinarian name"}</span>
                <input
                  value={formVetName}
                  onChange={(event) => {
                    setFormVetName(event.target.value);
                    setFormVetId("");
                  }}
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-[#6b5a4c]">{isRTL ? "رقم الهاتف" : "Phone number"}</span>
                <input value={formPhone} onChange={(event) => setFormPhone(event.target.value)} className={inputClass} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-[#6b5a4c]">{isRTL ? "تاريخ السجل" : "Record date"}</span>
                <input
                  type="date"
                  value={formDate}
                  onChange={(event) => setFormDate(event.target.value)}
                  className={inputClass}
                  required
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-[#6b5a4c]">{isRTL ? "تاريخ التنبيه" : "Reminder date"}</span>
                <input
                  type="date"
                  value={formNotifyDate}
                  onChange={(event) => setFormNotifyDate(event.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-[#6b5a4c]">{isRTL ? "التكلفة" : "Cost"}</span>
                <input
                  type="number"
                  step="0.01"
                  value={formCost}
                  onChange={(event) => setFormCost(event.target.value)}
                  className={inputClass}
                  min="0"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-xs font-bold text-[#6b5a4c]">{isRTL ? "ملاحظات" : "Notes"}</span>
                <textarea
                  value={formNotes}
                  onChange={(event) => setFormNotes(event.target.value)}
                  rows={3}
                  className={`${inputClass} h-auto py-2`}
                />
              </label>

              <div className="sm:col-span-2">
                <span className="mb-1 block text-xs font-bold text-[#6b5a4c]">{isRTL ? "المرفقات" : "Attachments"}</span>
                {keptAttachments.length ? (
                  <ul className="mb-2 space-y-1">
                    {keptAttachments.map((attachment) => (
                      <li
                        key={attachment.id}
                        className="flex items-center justify-between rounded-lg border border-[#ece2da] bg-[#fdfbf9] px-3 py-1.5 text-xs"
                      >
                        <a
                          href={attachment.fileUrl ?? "#"}
                          target="_blank"
                          rel="noreferrer"
                          className="flex min-w-0 items-center gap-2 truncate text-[#4b2f1a] hover:underline"
                        >
                          <Paperclip className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{attachment.fileUrl?.split("/").pop() ?? `#${attachment.id}`}</span>
                        </a>
                        <button
                          type="button"
                          onClick={() =>
                            setKeptAttachments((current) => current.filter((item) => item.id !== attachment.id))
                          }
                          className="ms-2 rounded p-1 text-[#a6423a] hover:bg-red-50"
                          aria-label={isRTL ? "إزالة المرفق" : "Remove attachment"}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
                <input
                  type="file"
                  multiple
                  onChange={(event) => setFormFiles(Array.from(event.target.files ?? []))}
                  className="block w-full text-xs text-[#6b5a4c] file:me-3 file:rounded-lg file:border-0 file:bg-[#3b2b20] file:px-3 file:py-2 file:text-xs file:font-bold file:text-white"
                />
              </div>
            </div>

            {formError ? <p className="px-5 pb-2 text-xs text-red-600">{formError}</p> : null}

            <footer className="sticky bottom-0 flex justify-end gap-2 border-t bg-white px-5 py-4">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                disabled={saving}
                className="rounded-lg border px-5 py-2 text-xs font-bold"
              >
                {isRTL ? "إلغاء" : "Cancel"}
              </button>
              <button
                disabled={saving}
                className="rounded-lg bg-[#3b2b20] px-5 py-2 text-xs font-bold text-white disabled:opacity-50"
              >
                {saving ? t("common.loading") : isRTL ? "حفظ" : "Save"}
              </button>
            </footer>
          </form>
        </div>
      ) : null}

      <DeleteConfirmModal
        open={Boolean(deleteTarget)}
        title={t("common.deleteRecord")}
        description={saving ? t("common.loading") : t("common.deleteRecordMsg")}
        onCancel={() => {
          if (!saving) setDeleteTarget(null);
        }}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
