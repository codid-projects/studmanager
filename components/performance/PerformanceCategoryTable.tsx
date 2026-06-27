"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Edit,
  Phone,
  Search,
  Trash2,
  X,
} from "lucide-react";
import DeleteConfirmModal from "@/components/common/DeleteConfirmModal";
import { HorsePicker } from "@/components/horses/HorsePicker";
import { OptionPicker } from "@/components/common/OptionPicker";
import {
  fetchHaircutTypes,
  fetchPerformance,
  addPerformanceContact,
  fetchPerformanceContacts,
  fetchTrainingTypes,
  removePerformance,
  savePerformance,
} from "@/lib/api/performance-client";
import type {
  CreatePerformancePayload,
  HaircutTypeId,
  HorseListItemDto,
  LocaleCode,
  PerformanceRecordDto,
  PerformanceRecordTypeId,
  SummarizedContactDto,
  TrainingTypeId,
  TypeDto,
} from "@/lib/api/types";
import { useLocale, useTranslation } from "@/lib/locale-context";

interface PerformanceCategoryTableProps {
  categoryId: string;
}

type FormPayload = CreatePerformancePayload;

const PAGE_SIZE = 10;

const CATEGORY_CONFIG: Record<
  string,
  {
    type: PerformanceRecordTypeId;
    titleAr: string;
    titleEn: string;
    icon: string;
  }
> = {
  trainings: {
    type: 1,
    titleAr: "التدريبات",
    titleEn: "Trainings",
    icon: "/performance/التدريبات.svg",
  },
  competitions: {
    type: 2,
    titleAr: "المسابقات",
    titleEn: "Competitions",
    icon: "/performance/المسابقات.svg",
  },
  haircut: {
    type: 3,
    titleAr: "قص الشعر",
    titleEn: "Haircut",
    icon: "/performance/قص الشعر.svg",
  },
};

const enumNameAr: Record<string, string> = {
  Fitness: "تدريب لياقة",
  Endurance: "تدريب تحمل",
  GroundWork: "تدريب أرضي",
  ShowPreparation: "تجهيز للمسابقة",
  Full: "قص كامل",
  Trim: "تهذيب",
  ManeTrim: "تهذيب العرف",
  TailTrim: "تهذيب الذيل",
};

function dateInputValue(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}

function emptyForm(type: PerformanceRecordTypeId): FormPayload {
  return {
    horseId: 0,
    type,
    recordDate: "",
    notifyOnDate: "",
    cost: 0,
    providerContactId: 0,
    providerName: "",
    phoneNumber: "",
    trainingType: null,
    durationMinutes: null,
    competitionName: "",
    location: "",
    rank: null,
    haircutType: null,
  };
}

export const PerformanceCategoryTable = ({
  categoryId,
}: PerformanceCategoryTableProps) => {
  const { locale, direction } = useLocale();
  const { t } = useTranslation();
  const localeCode = locale as LocaleCode;
  const isRTL = direction === "rtl";
  const config = CATEGORY_CONFIG[categoryId] ?? CATEGORY_CONFIG.trainings;
  const title = isRTL ? config.titleAr : config.titleEn;

  const [records, setRecords] = useState<PerformanceRecordDto[]>([]);
  const [trainingTypes, setTrainingTypes] = useState<TypeDto[]>([]);
  const [haircutTypes, setHaircutTypes] = useState<TypeDto[]>([]);
  const [contacts, setContacts] = useState<SummarizedContactDto[]>([]);
  const [selectedHorse, setSelectedHorse] = useState<HorseListItemDto | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PerformanceRecordDto | null>(null);
  const [form, setForm] = useState<FormPayload>(emptyForm(config.type));
  const [deleteTarget, setDeleteTarget] = useState<PerformanceRecordDto | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setForm(emptyForm(config.type));
    setPage(1);
    setSearch("");
    setDebouncedSearch("");
    setEditing(null);
    setSelectedHorse(null);
    setFormOpen(false);
  }, [config.type]);

  useEffect(() => {
    let active = true;

    async function loadLookups() {
      const contactKind = config.type === 1 ? "trainers" : config.type === 3 ? "barbers" : null;
      const results = await Promise.allSettled([
        fetchTrainingTypes(localeCode),
        fetchHaircutTypes(localeCode),
        contactKind ? fetchPerformanceContacts(localeCode, contactKind) : Promise.resolve([]),
      ]);

      if (!active) return;
      setTrainingTypes(results[0].status === "fulfilled" ? results[0].value : []);
      setHaircutTypes(results[1].status === "fulfilled" ? results[1].value : []);
      setContacts(results[2].status === "fulfilled" ? results[2].value : []);
    }

    loadLookups();
    return () => {
      active = false;
    };
  }, [config.type, localeCode]);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await fetchPerformance(localeCode, {
        type: config.type,
        search: debouncedSearch || undefined,
        pageNumber: page,
        pageSize: PAGE_SIZE,
      });
      setRecords(result?.data ?? []);
      setTotalPages(result?.totalPages ?? 0);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t("common.error"));
      setRecords([]);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [config.type, debouncedSearch, localeCode, page, t]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  function optionLabel(option: TypeDto) {
    return isRTL ? enumNameAr[option.name] || option.name : option.name.replace(/([A-Z])/g, " $1").trim();
  }

  function openCreate() {
    setEditing(null);
    setSelectedHorse(null);
    setForm(emptyForm(config.type));
    setFormOpen(true);
  }

  function openEdit(record: PerformanceRecordDto) {
    setEditing(record);
    setSelectedHorse({
      id: record.horseId,
      localId: record.horseId,
      englishName: record.horseEnglishName,
      arabicName: record.horseArabicName,
      knownAs: null,
      dateofBirth: null,
      gender: null,
      color: null,
      horseProfileImage: null,
      strainEn: null,
      strainAr: null,
      specialEn: null,
      specialAr: null,
      isActive: true,
    });
    setForm({
      horseId: record.horseId,
      type: record.type,
      recordDate: dateInputValue(record.recordDate),
      notifyOnDate: dateInputValue(record.notifyOnDate),
      cost: record.cost,
      providerContactId: record.providerContactId ?? 0,
      providerName: record.providerName ?? "",
      phoneNumber: record.phoneNumber ?? "",
      trainingType: record.trainingType,
      durationMinutes: record.durationMinutes,
      competitionName: record.competitionName ?? "",
      location: record.location ?? "",
      rank: record.rank,
      haircutType: record.haircutType,
    });
    setFormOpen(true);
  }

  function validateForm() {
    if (!form.horseId) return isRTL ? "الخيل مطلوب" : "Horse is required";
    if (!form.recordDate) return isRTL ? "التاريخ مطلوب" : "Date is required";
    if (form.cost < 0) return isRTL ? "التكلفة يجب أن تكون صفر أو أكبر" : "Cost must be zero or greater";
    if (config.type === 1) {
      if (!form.trainingType) return isRTL ? "نوع التدريب مطلوب" : "Training type is required";
      if (!form.durationMinutes || form.durationMinutes <= 0) return isRTL ? "مدة التدريب مطلوبة" : "Training duration is required";
      if (!form.providerContactId && !form.providerName?.trim()) return isRTL ? "اسم المدرب مطلوب" : "Trainer name is required";
    }
    if (config.type === 2) {
      if (!form.competitionName?.trim()) return isRTL ? "اسم المسابقة مطلوب" : "Competition name is required";
      if (!form.location?.trim()) return isRTL ? "المكان مطلوب" : "Location is required";
      if (!form.rank || form.rank <= 0) return isRTL ? "المركز مطلوب" : "Rank is required";
    }
    if (config.type === 3) {
      if (!form.haircutType) return isRTL ? "نوع القص مطلوب" : "Haircut type is required";
      if (!form.providerContactId && !form.providerName?.trim()) return isRTL ? "اسم الحلاق مطلوب" : "Barber name is required";
    }
    return "";
  }

  async function submitForm(event: React.FormEvent) {
    event.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError("");
    const payload: FormPayload = {
      ...form,
      type: config.type,
      providerContactId: form.providerContactId || null,
      providerName: form.providerName?.trim() || null,
      phoneNumber: form.phoneNumber?.trim() || null,
      notifyOnDate: form.notifyOnDate || null,
      trainingType: config.type === 1 ? (form.trainingType as TrainingTypeId) : null,
      durationMinutes: config.type === 1 ? Number(form.durationMinutes) : null,
      competitionName: config.type === 2 ? form.competitionName : null,
      location: config.type === 2 ? form.location : null,
      rank: config.type === 2 ? Number(form.rank) : null,
      haircutType: config.type === 3 ? (form.haircutType as HaircutTypeId) : null,
      cost: Number(form.cost || 0),
    };

    try {
      await savePerformance(
        localeCode,
        editing ? { ...payload, id: editing.id } : payload,
        editing?.id,
      );
      setFormOpen(false);
      await loadRecords();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t("common.error"));
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setSaving(true);
    setError("");
    try {
      await removePerformance(localeCode, deleteTarget.id);
      setDeleteTarget(null);
      await loadRecords();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t("common.error"));
    } finally {
      setSaving(false);
    }
  }

  const pageNumbers = useMemo(() => {
    const start = Math.max(1, Math.min(page - 1, totalPages - 2));
    return Array.from({ length: Math.min(3, totalPages) }, (_, index) => start + index);
  }, [page, totalPages]);

  const columns = useMemo(() => {
    if (config.type === 1) {
      return [
        isRTL ? "اسم الخيل" : "Horse",
        isRTL ? "اسم المدرب" : "Trainer",
        isRTL ? "رقم المدرب" : "Trainer phone",
        isRTL ? "نوع التدريب" : "Training type",
        isRTL ? "مدة التدريب" : "Duration",
        isRTL ? "تاريخ التدريب" : "Training date",
        isRTL ? "التكلفة" : "Cost",
      ];
    }
    if (config.type === 2) {
      return [
        isRTL ? "اسم الخيل" : "Horse",
        isRTL ? "اسم المسابقة" : "Competition",
        isRTL ? "المكان" : "Location",
        isRTL ? "المركز" : "Rank",
        isRTL ? "التاريخ" : "Date",
        isRTL ? "التكلفة" : "Cost",
      ];
    }
    return [
      isRTL ? "اسم الخيل" : "Horse",
      isRTL ? "اسم الحلاق" : "Barber",
      isRTL ? "نوع القص" : "Haircut type",
      isRTL ? "التاريخ" : "Date",
      isRTL ? "التكلفة" : "Cost",
    ];
  }, [config.type, isRTL]);

  function renderCells(record: PerformanceRecordDto) {
    const horseName = isRTL
      ? record.horseArabicName || record.horseEnglishName
      : record.horseEnglishName || record.horseArabicName;
    if (config.type === 1) {
      return [
        horseName,
        record.providerName || "-",
        record.phoneNumber || "-",
        isRTL ? record.trainingTypeArabicName || record.trainingTypeName : record.trainingTypeName || record.trainingTypeArabicName,
        record.durationMinutes ? `${record.durationMinutes} ${isRTL ? "دقيقة" : "min"}` : "-",
        dateInputValue(record.recordDate),
        record.cost,
      ];
    }
    if (config.type === 2) {
      return [
        horseName,
        record.competitionName || "-",
        record.location || "-",
        record.rank ?? "-",
        dateInputValue(record.recordDate),
        record.cost,
      ];
    }
    return [
      horseName,
      record.providerName || "-",
      isRTL ? record.haircutTypeArabicName || record.haircutTypeName : record.haircutTypeName || record.haircutTypeArabicName,
      dateInputValue(record.recordDate),
      record.cost,
    ];
  }

  return (
    <>
      <div className="rounded-[2rem] border border-[#f3ece7] bg-white p-4 shadow-sm sm:p-8" dir={direction}>
        <div className="mb-8 flex flex-col items-start justify-between gap-6 xl:flex-row xl:items-center">
          <div className="flex items-center gap-3">
            <Image src={config.icon} alt="" width={34} height={34} className="h-9 w-9 object-contain" />
            <h2 className="text-2xl font-bold text-[#3b2b20]">{title}</h2>
          </div>
          <div className="flex w-full flex-col gap-4 sm:flex-row xl:w-auto">
            <div className="relative flex-1 sm:w-80">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t("common.search")}
                className={`w-full rounded-2xl border border-[#ece2da] bg-[#fdfbf9] px-5 py-3 outline-none ${isRTL ? "pr-12" : "pl-12"}`}
              />
              <Search className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a7a6d] ${isRTL ? "right-4" : "left-4"}`} />
            </div>
            <button onClick={openCreate} className="rounded-2xl bg-[#3b2b20] px-6 py-3 font-bold text-white">
              {t("common.addNewRecord")}
            </button>
          </div>
        </div>

        {error && <div className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-[#4b2f1a] text-white">
              <tr>
                {columns.map((label) => (
                  <th key={label} className="px-4 py-4 text-start">{label}</th>
                ))}
                <th className="px-4 py-4 text-center">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record, index) => (
                <tr key={record.id} className={`border-b ${index % 2 ? "bg-[#fdfbf7]" : "bg-white"}`}>
                  {renderCells(record).map((value, cellIndex) => (
                    <td key={cellIndex} className={`px-4 py-4 ${cellIndex === 0 ? "font-semibold text-[#3b2b20]" : "text-gray-600"}`}>
                      {value || "-"}
                    </td>
                  ))}
                  <td className="px-4 py-4">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => openEdit(record)} className="rounded-lg border p-2 text-[#4b2f1a]" aria-label={t("common.edit")}>
                        <Edit className="h-4 w-4" />
                      </button>
                      <button onClick={() => setDeleteTarget(record)} className="rounded-lg border border-red-100 p-2 text-red-600" aria-label={t("common.delete")}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && !records.length && (
                <tr>
                  <td colSpan={columns.length + 1} className="px-6 py-12 text-center text-gray-400">
                    {t("common.noRecordsFound")}
                  </td>
                </tr>
              )}
              {loading && Array.from({ length: 5 }).map((_, index) => (
                <tr key={index} className="animate-pulse border-b">
                  <td colSpan={columns.length + 1} className="px-4 py-3">
                    <div className="h-8 rounded-lg bg-gray-100" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="flex h-9 w-9 items-center justify-center rounded-full border disabled:opacity-40">
              {isRTL ? <ChevronRight /> : <ChevronLeft />}
            </button>
            {pageNumbers.map((pageNumber) => (
              <button key={pageNumber} onClick={() => setPage(pageNumber)} className={`h-9 w-9 rounded-full ${page === pageNumber ? "bg-[#3b2b20] text-white" : "border"}`}>
                {pageNumber}
              </button>
            ))}
            <button disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)} className="flex h-9 w-9 items-center justify-center rounded-full border disabled:opacity-40">
              {isRTL ? <ChevronLeft /> : <ChevronRight />}
            </button>
          </div>
        )}
      </div>

      {formOpen && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto bg-black/40 p-3 sm:p-4"
          dir={direction}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setFormOpen(false);
          }}
        >
          <form onSubmit={submitForm} className="my-3 flex max-h-[calc(100dvh-1.5rem)] w-full max-w-4xl flex-col overflow-hidden rounded-[28px] bg-white font-cairo shadow-xl sm:my-8 sm:max-h-[calc(100dvh-4rem)] sm:rounded-3xl">
            <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-4 py-4 sm:px-8 sm:py-6">
              <div className="flex min-w-0 items-center gap-3">
                <Image src={config.icon} alt="" width={32} height={32} className="h-8 w-8 shrink-0 object-contain" />
                <h3 className="text-lg font-bold leading-tight text-[#2b2a3f] sm:text-2xl">
                  {editing
                    ? isRTL ? `تعديل سجل ${title}` : `Edit ${title} record`
                    : isRTL ? `إضافة سجل جديد لـ ${title}` : `Add New ${title} Record`}
                </h3>
              </div>
              <button type="button" onClick={() => setFormOpen(false)} className="shrink-0 rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="overflow-y-auto px-4 py-4 sm:px-8 sm:py-6">
              <div className="grid grid-cols-1 items-start gap-x-8 gap-y-4 sm:gap-y-5 md:grid-cols-2">
                <Field label={isRTL ? "الخيل" : "Horse"}>
                  <HorsePicker
                    value={form.horseId || null}
                    selectedLabel={selectedHorse ? (isRTL ? selectedHorse.arabicName || selectedHorse.englishName || "" : selectedHorse.englishName || selectedHorse.arabicName || "") : undefined}
                    disabled={Boolean(editing)}
                    onChange={(horse) => {
                      setSelectedHorse(horse);
                      setForm({ ...form, horseId: horse.localId ?? horse.id });
                    }}
                  />
                </Field>

                <Field label={isRTL ? "التاريخ" : "Date"}>
                  <IconInput icon={<Calendar className="h-5 w-5 text-gray-400" />} isRTL={isRTL}>
                    <input required type="date" value={form.recordDate} onChange={(event) => setForm({ ...form, recordDate: event.target.value })} className="field-input" />
                  </IconInput>
                </Field>

                {(config.type === 1 || config.type === 3) && (
                  <>
                    <Field label={config.type === 1 ? (isRTL ? "المدرب" : "Trainer") : (isRTL ? "الحلاق" : "Barber")}>
                      <OptionPicker
                        value={form.providerContactId || null}
                        options={contacts.map((contact) => ({ id: contact.id, label: contact.name, subtitle: contact.phone ?? undefined }))}
                        onChange={(option) => setForm({ ...form, providerContactId: Number(option.id), providerName: option.label, phoneNumber: option.subtitle ?? "" })}
                        placeholder={config.type === 1 ? (isRTL ? "اختر المدرب" : "Select trainer") : (isRTL ? "اختر الحلاق" : "Select barber")}
                        title={config.type === 1 ? (isRTL ? "اختر المدرب" : "Select trainer") : (isRTL ? "اختر الحلاق" : "Select barber")}
                        searchPlaceholder={config.type === 1 ? (isRTL ? "ابحث عن مدرب" : "Search trainers") : (isRTL ? "ابحث عن حلاق" : "Search barbers")}
                        emptyText={config.type === 1 ? (isRTL ? "لا يوجد مدربون" : "No trainers") : (isRTL ? "لا يوجد حلاقون" : "No barbers")}
                        createLabel={config.type === 1 ? (isRTL ? "إضافة مدرب جديد" : "Add new trainer") : (isRTL ? "إضافة حلاق جديد" : "Add new barber")}
                        createTitle={config.type === 1 ? (isRTL ? "إضافة مدرب" : "Add trainer") : (isRTL ? "إضافة حلاق" : "Add barber")}
                        createFields={[
                          { key: "name", label: isRTL ? "الاسم" : "Name", placeholder: config.type === 1 ? (isRTL ? "اسم المدرب" : "Trainer name") : (isRTL ? "اسم الحلاق" : "Barber name"), required: true },
                          { key: "phone", label: isRTL ? "رقم الهاتف" : "Phone", placeholder: isRTL ? "اختياري" : "Optional", type: "tel" },
                        ]}
                        onCreate={async (values) => {
                          const kind = config.type === 1 ? "trainers" : "barbers";
                          const created = await addPerformanceContact(localeCode, kind, { name: values.name, phone: values.phone || undefined });
                          setContacts((current) => [...current, created]);
                          return { id: created.id, label: created.name, subtitle: created.phone ?? undefined };
                        }}
                      />
                    </Field>
                    <Field label={config.type === 1 ? (isRTL ? "اسم المدرب" : "Trainer name") : (isRTL ? "اسم الحلاق" : "Barber name")}>
                      <input
                        value={form.providerName ?? ""}
                        onChange={(event) => setForm({ ...form, providerContactId: 0, providerName: event.target.value })}
                        placeholder={config.type === 1 ? (isRTL ? "أدخل اسم المدرب" : "Enter trainer name") : (isRTL ? "أدخل اسم الحلاق" : "Enter barber name")}
                        className="field-input"
                      />
                    </Field>
                    <Field label={isRTL ? "رقم المتابعة" : "Follow-up number"}>
                      <IconInput icon={<Phone className="h-5 w-5 text-gray-400" />} isRTL={isRTL}>
                        <input value={form.phoneNumber ?? ""} onChange={(event) => setForm({ ...form, phoneNumber: event.target.value })} placeholder={isRTL ? "رقم المتابعة" : "Follow-up number"} className="field-input" dir="ltr" />
                      </IconInput>
                    </Field>
                  </>
                )}

                {config.type === 1 && (
                  <>
                    <Field label={isRTL ? "نوع التدريب" : "Training type"}>
                      <OptionPicker
                        value={form.trainingType ?? null}
                        options={trainingTypes.map((item) => ({ id: item.id, label: optionLabel(item) }))}
                        onChange={(option) => setForm({ ...form, trainingType: Number(option.id) as TrainingTypeId })}
                        placeholder={isRTL ? "اختر نوع التدريب" : "Select training type"}
                        title={isRTL ? "نوع التدريب" : "Training type"}
                      />
                    </Field>
                    <Field label={isRTL ? "مدة التدريب (دقيقة)" : "Duration (min)"}>
                      <input type="number" min={1} value={form.durationMinutes ?? ""} onChange={(event) => setForm({ ...form, durationMinutes: Number(event.target.value) })} placeholder={isRTL ? "مدة التدريب / دقيقة" : "Training duration / min"} className="field-input" />
                    </Field>
                  </>
                )}

                {config.type === 2 && (
                  <>
                    <Field label={isRTL ? "اسم المسابقة" : "Competition name"}>
                      <input value={form.competitionName ?? ""} onChange={(event) => setForm({ ...form, competitionName: event.target.value })} placeholder={isRTL ? "اسم المسابقة" : "Competition name"} className="field-input" />
                    </Field>
                    <Field label={isRTL ? "المكان" : "Location"}>
                      <input value={form.location ?? ""} onChange={(event) => setForm({ ...form, location: event.target.value })} placeholder={isRTL ? "المكان" : "Location"} className="field-input" />
                    </Field>
                    <Field label={isRTL ? "المركز" : "Rank"}>
                      <input type="number" min={1} value={form.rank ?? ""} onChange={(event) => setForm({ ...form, rank: Number(event.target.value) })} placeholder={isRTL ? "المركز" : "Rank"} className="field-input" />
                    </Field>
                  </>
                )}

                {config.type === 3 && (
                  <Field label={isRTL ? "نوع القص" : "Haircut type"}>
                    <OptionPicker
                      value={form.haircutType ?? null}
                      options={haircutTypes.map((item) => ({ id: item.id, label: optionLabel(item) }))}
                      onChange={(option) => setForm({ ...form, haircutType: Number(option.id) as HaircutTypeId })}
                      placeholder={isRTL ? "اختر نوع القص" : "Select haircut type"}
                      title={isRTL ? "نوع القص" : "Haircut type"}
                    />
                  </Field>
                )}

                <Field label={isRTL ? "التكلفة" : "Cost"}>
                  <div className="relative">
                    <span className={`pointer-events-none absolute top-1/2 z-10 -translate-y-1/2 font-bold text-gray-400 ${isRTL ? "right-4" : "left-4"}`}>$</span>
                    <input type="number" min={0} step="0.01" value={form.cost} onChange={(event) => setForm({ ...form, cost: Number(event.target.value) })} placeholder={isRTL ? "التكلفة" : "Cost"} className={`field-input ${isRTL ? "pr-12" : "pl-12"}`} />
                  </div>
                </Field>

                <Field label={isRTL ? "تاريخ التذكير" : "Reminder date"}>
                  <IconInput icon={<Calendar className="h-5 w-5 text-gray-400" />} isRTL={isRTL}>
                    <input type="date" value={form.notifyOnDate ?? ""} onChange={(event) => setForm({ ...form, notifyOnDate: event.target.value })} className="field-input" />
                  </IconInput>
                </Field>
              </div>

              <div className="mt-8 flex flex-col-reverse gap-3 sm:mt-12 sm:flex-row-reverse sm:items-center sm:gap-4">
                <button type="button" onClick={() => setFormOpen(false)} disabled={saving} className="w-full rounded-xl border border-gray-300 px-6 py-3.5 font-bold text-gray-700 transition-colors hover:bg-gray-50 sm:w-auto sm:px-10">
                  {t("common.cancel")}
                </button>
                <button disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#3b2b20] px-6 py-3.5 font-bold text-white transition-colors hover:bg-[#2e2119] disabled:opacity-60 sm:w-auto sm:px-10">
                  {saving ? t("common.loading") : t("common.save")}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      <DeleteConfirmModal
        open={Boolean(deleteTarget)}
        title={t("common.deleteRecord")}
        description={t("common.deleteRecordMsg")}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={saving}
      />
    </>
  );
};

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-[#58483e]">
      <span>{label}</span>
      {children}
    </label>
  );
}

function IconInput({
  children,
  icon,
  iconEnd = false,
  isRTL,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  iconEnd?: boolean;
  isRTL: boolean;
}) {
  const sideClass = iconEnd
    ? isRTL ? "left-4" : "right-4"
    : isRTL ? "right-4" : "left-4";
  const paddingClass = iconEnd
    ? isRTL ? "[&>.field-input]:pl-12" : "[&>.field-input]:pr-12"
    : isRTL ? "[&>.field-input]:pr-12" : "[&>.field-input]:pl-12";

  return (
    <div className={`relative ${paddingClass}`}>
      <div className={`pointer-events-none absolute top-1/2 z-10 -translate-y-1/2 ${sideClass}`}>
        {icon}
      </div>
      {children}
    </div>
  );
}
