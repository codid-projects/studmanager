"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  Calendar,
  ChevronDown,
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
import {
  fetchInjuries,
  fetchVeterinarians,
  removeInjury,
  saveInjury,
} from "@/lib/api/injury-client";
import type {
  CreateInjuryPayload,
  HorseListItemDto,
  InjuryRecordDto,
  InjurySeverityId,
  LocaleCode,
  SummarizedContactDto,
} from "@/lib/api/types";
import { useLocale, useTranslation } from "@/lib/locale-context";

interface InjuryCategoryTableProps {
  horseId?: number;
  horseName?: string;
}

interface InjuryHorseOption {
  id: number;
  nameAr: string | null;
  nameEn: string | null;
}

type FormPayload = CreateInjuryPayload;

const PAGE_SIZE = 10;
const INJURY_ICON = "/health/الإصابات.svg";

const SEVERITIES: { id: InjurySeverityId; ar: string; en: string }[] = [
  { id: 1, ar: "بسيطة", en: "Minor" },
  { id: 2, ar: "متوسطة", en: "Moderate" },
  { id: 3, ar: "شديدة", en: "Severe" },
  { id: 4, ar: "حرجة", en: "Critical" },
  { id: 5, ar: "تهدد الحياة", en: "Life Threatening" },
];

function dateInputValue(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}

function emptyForm(horseId = 0): FormPayload {
  return {
    horseId,
    veterinarianId: 0,
    veterinarianName: "",
    phoneNumber: "",
    injuryDate: "",
    notifyOnDate: "",
    cost: 0,
    injuryReason: "",
    severity: 1,
  };
}

export const InjuryCategoryTable = ({ horseId, horseName }: InjuryCategoryTableProps) => {
  const { locale, direction } = useLocale();
  const { t } = useTranslation();
  const localeCode = locale as LocaleCode;
  const isRTL = direction === "rtl";
  const fixedHorseId = horseId && horseId > 0 ? horseId : undefined;
  const title = isRTL ? "الإصابات" : "Injuries";

  const [records, setRecords] = useState<InjuryRecordDto[]>([]);
  const [vets, setVets] = useState<SummarizedContactDto[]>([]);
  const [horseOptions, setHorseOptions] = useState<InjuryHorseOption[]>([]);
  const [selectedHorse, setSelectedHorse] = useState<HorseListItemDto | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState<InjurySeverityId | "">("");
  const [horseFilter, setHorseFilter] = useState<number | "">(fixedHorseId ?? "");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<InjuryRecordDto | null>(null);
  const [form, setForm] = useState<FormPayload>(emptyForm(fixedHorseId));
  const [deleteTarget, setDeleteTarget] = useState<InjuryRecordDto | null>(null);

  const activeHorseId = horseFilter === "" ? undefined : horseFilter;

  const horseOptionLabel = useCallback(
    (option: InjuryHorseOption) =>
      (isRTL ? option.nameAr || option.nameEn : option.nameEn || option.nameAr) || `#${option.id}`,
    [isRTL],
  );

  const mergedHorseOptions = useMemo(() => {
    const list = [...horseOptions];
    if (fixedHorseId && !list.some((item) => item.id === fixedHorseId)) {
      list.unshift({ id: fixedHorseId, nameAr: horseName ?? null, nameEn: horseName ?? null });
    }
    return list;
  }, [horseOptions, fixedHorseId, horseName]);

  const resolveHorse = useCallback(
    (id: number): HorseListItemDto => {
      const match = mergedHorseOptions.find((item) => item.id === id);
      return buildFixedHorse(id, match ? horseOptionLabel(match) : horseName);
    },
    [mergedHorseOptions, horseOptionLabel, horseName],
  );

  const selectedFilterHorse = useMemo(
    () => (activeHorseId ? mergedHorseOptions.find((item) => item.id === activeHorseId) : undefined),
    [activeHorseId, mergedHorseOptions],
  );

  function changeHorseFilter(value: number | "") {
    setHorseFilter(value);
    setPage(1);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let active = true;
    fetchVeterinarians(localeCode)
      .then((result) => {
        if (active) setVets(Array.isArray(result) ? result : []);
      })
      .catch(() => {
        if (active) setVets([]);
      });
    return () => {
      active = false;
    };
  }, [localeCode]);

  const loadHorseOptions = useCallback(async () => {
    try {
      const result = await fetchInjuries(localeCode, { pageNumber: 1, pageSize: 500 });
      const unique = new Map<number, InjuryHorseOption>();
      (result?.data ?? []).forEach((record) => {
        if (!unique.has(record.horseId)) {
          unique.set(record.horseId, {
            id: record.horseId,
            nameAr: record.horseNameAr,
            nameEn: record.horseNameEn,
          });
        }
      });
      setHorseOptions(Array.from(unique.values()));
    } catch {
      setHorseOptions([]);
    }
  }, [localeCode]);

  useEffect(() => {
    loadHorseOptions();
  }, [loadHorseOptions]);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await fetchInjuries(localeCode, {
        horseId: activeHorseId,
        severity: severityFilter || undefined,
        search: debouncedSearch || undefined,
        pageNumber: page,
        pageSize: PAGE_SIZE,
      });
      let rows = result?.data ?? [];
      // Defensive client-side scoping in case the backend build predates the horseId filter.
      if (activeHorseId) {
        rows = rows.filter((record) => record.horseId === activeHorseId);
      }
      setRecords(rows);
      setTotalPages(result?.totalPages ?? 0);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t("common.error"));
      setRecords([]);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [activeHorseId, debouncedSearch, localeCode, page, severityFilter, t]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const severityLabel = useCallback(
    (record: InjuryRecordDto) => {
      const fallback = SEVERITIES.find((item) => item.id === record.severity);
      return isRTL
        ? record.severityNameAr || fallback?.ar || "-"
        : record.severityNameEn || fallback?.en || "-";
    },
    [isRTL],
  );

  function openCreate() {
    setEditing(null);
    setForm(emptyForm(activeHorseId ?? 0));
    setSelectedHorse(activeHorseId ? resolveHorse(activeHorseId) : null);
    setFormOpen(true);
  }

  function openEdit(record: InjuryRecordDto) {
    setEditing(record);
    setSelectedHorse({
      id: record.horseId,
      localId: record.horseId,
      englishName: record.horseNameEn,
      arabicName: record.horseNameAr,
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
      veterinarianId: record.veterinarianId ?? 0,
      veterinarianName: record.veterinarianName ?? "",
      phoneNumber: record.phoneNumber ?? "",
      injuryDate: dateInputValue(record.injuryDate),
      notifyOnDate: dateInputValue(record.notifyOnDate),
      cost: record.cost ?? 0,
      injuryReason: record.injuryReason ?? "",
      severity: record.severity,
    });
    setFormOpen(true);
  }

  function validateForm() {
    if (!form.horseId) return isRTL ? "الخيل مطلوب" : "Horse is required";
    if (!form.injuryReason?.trim()) return isRTL ? "نوع الإصابة مطلوب" : "Injury reason is required";
    if (!form.severity) return isRTL ? "درجة الإصابة مطلوبة" : "Severity is required";
    if ((form.cost ?? 0) < 0) return isRTL ? "التكلفة يجب أن تكون صفر أو أكبر" : "Cost must be zero or greater";
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
      horseId: form.horseId,
      veterinarianId: form.veterinarianId || null,
      veterinarianName: form.veterinarianName?.trim() || null,
      phoneNumber: form.phoneNumber?.trim() || null,
      injuryDate: form.injuryDate || null,
      notifyOnDate: form.notifyOnDate || null,
      cost: Number(form.cost || 0),
      injuryReason: form.injuryReason.trim(),
      severity: form.severity,
    };

    try {
      const result = await saveInjury(
        localeCode,
        editing ? { ...payload, id: editing.id } : payload,
        editing?.id,
      );
      if (result && result.succeeded === false) {
        throw new Error(result.message || t("common.error"));
      }
      setFormOpen(false);
      await loadRecords();
      await loadHorseOptions();
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
      await removeInjury(localeCode, deleteTarget.id);
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

  const columns = useMemo(
    () => [
      isRTL ? "اسم الخيل" : "Horse",
      isRTL ? "نوع الإصابة" : "Injury reason",
      isRTL ? "درجة الإصابة" : "Severity",
      isRTL ? "الطبيب البيطري" : "Veterinarian",
      isRTL ? "رقم الهاتف" : "Phone",
      isRTL ? "تاريخ الإصابة" : "Injury date",
      isRTL ? "التكلفة" : "Cost",
    ],
    [isRTL],
  );

  function renderCells(record: InjuryRecordDto) {
    const horse = isRTL
      ? record.horseNameAr || record.horseNameEn
      : record.horseNameEn || record.horseNameAr;
    return [
      horse,
      record.injuryReason || "-",
      severityLabel(record),
      record.veterinarianName || "-",
      record.phoneNumber || "-",
      dateInputValue(record.injuryDate) || "-",
      record.cost ?? "-",
    ];
  }

  return (
    <>
      <div className="rounded-[2rem] border border-[#f3ece7] bg-white p-4 shadow-sm sm:p-8" dir={direction}>
        <div className="mb-8 flex flex-col items-start justify-between gap-6 xl:flex-row xl:items-center">
          <div className="flex items-center gap-3">
            <Image src={INJURY_ICON} alt="" width={34} height={34} className="h-9 w-9 object-contain" />
            <div>
              <h2 className="text-2xl font-bold text-[#3b2b20]">{title}</h2>
              {selectedFilterHorse ? (
                <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-[#efe7df] px-3 py-1 text-sm font-semibold text-[#3b2b20]">
                  <span>{isRTL ? "الخيل: " : "Horse: "}{horseOptionLabel(selectedFilterHorse)}</span>
                  <button
                    type="button"
                    onClick={() => changeHorseFilter("")}
                    className="rounded-full p-0.5 text-[#8a7a6d] transition-colors hover:bg-white hover:text-[#3b2b20]"
                    aria-label={isRTL ? "عرض كل الخيول" : "Show all horses"}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <p className="mt-1 text-sm font-medium text-[#8a7a6d]">
                  {isRTL ? "كل إصابات الخيول" : "All horses' injuries"}
                </p>
              )}
            </div>
          </div>
          <div className="flex w-full flex-col gap-4 sm:flex-row xl:w-auto">
            <div className="relative">
              <select
                value={horseFilter}
                onChange={(event) =>
                  changeHorseFilter(event.target.value ? Number(event.target.value) : "")
                }
                className={`w-full appearance-none rounded-2xl border border-[#ece2da] bg-[#fdfbf9] px-5 py-3 outline-none sm:w-56 ${isRTL ? "pl-10" : "pr-10"}`}
              >
                <option value="">{isRTL ? "كل الخيول" : "All horses"}</option>
                {mergedHorseOptions.map((option) => (
                  <option key={option.id} value={option.id}>{horseOptionLabel(option)}</option>
                ))}
              </select>
              <ChevronDown className={`pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a7a6d] ${isRTL ? "left-4" : "right-4"}`} />
            </div>
            <div className="relative">
              <select
                value={severityFilter}
                onChange={(event) => {
                  setSeverityFilter(event.target.value ? (Number(event.target.value) as InjurySeverityId) : "");
                  setPage(1);
                }}
                className={`w-full appearance-none rounded-2xl border border-[#ece2da] bg-[#fdfbf9] px-5 py-3 outline-none sm:w-48 ${isRTL ? "pl-10" : "pr-10"}`}
              >
                <option value="">{isRTL ? "كل الدرجات" : "All severities"}</option>
                {SEVERITIES.map((item) => (
                  <option key={item.id} value={item.id}>{isRTL ? item.ar : item.en}</option>
                ))}
              </select>
              <ChevronDown className={`pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a7a6d] ${isRTL ? "left-4" : "right-4"}`} />
            </div>
            <div className="relative flex-1 sm:w-72">
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
                <Image src={INJURY_ICON} alt="" width={32} height={32} className="h-8 w-8 shrink-0 object-contain" />
                <h3 className="text-lg font-bold leading-tight text-[#2b2a3f] sm:text-2xl">
                  {editing
                    ? isRTL ? `تعديل سجل ${title}` : `Edit ${title} record`
                    : isRTL ? `إضافة سجل إصابة جديد` : `Add New Injury Record`}
                </h3>
              </div>
              <button type="button" onClick={() => setFormOpen(false)} className="shrink-0 rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="overflow-y-auto px-4 py-4 sm:px-8 sm:py-6">
              <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:gap-y-6 md:grid-cols-2">
                <Field label={isRTL ? "الخيل" : "Horse"}>
                  <HorsePicker
                    value={form.horseId || null}
                    selectedLabel={selectedHorse ? (isRTL ? selectedHorse.arabicName || selectedHorse.englishName || "" : selectedHorse.englishName || selectedHorse.arabicName || "") : undefined}
                    disabled={Boolean(editing) || (Boolean(fixedHorseId) && activeHorseId === fixedHorseId)}
                    onChange={(horse) => {
                      setSelectedHorse(horse);
                      setForm({ ...form, horseId: horse.localId ?? horse.id });
                    }}
                  />
                </Field>

                <Field label={isRTL ? "تاريخ الإصابة" : "Injury date"}>
                  <IconInput icon={<Calendar className="h-5 w-5 text-gray-400" />} isRTL={isRTL}>
                    <input type="date" value={form.injuryDate ?? ""} onChange={(event) => setForm({ ...form, injuryDate: event.target.value })} className="field-input" />
                  </IconInput>
                </Field>

                <Field label={isRTL ? "نوع الإصابة" : "Injury reason"}>
                  <input
                    value={form.injuryReason}
                    onChange={(event) => setForm({ ...form, injuryReason: event.target.value })}
                    placeholder={isRTL ? "نوع الإصابة" : "Injury reason"}
                    className="field-input"
                  />
                </Field>

                <Field label={isRTL ? "درجة الإصابة" : "Injury severity"}>
                  <IconInput icon={<ChevronDown className="h-5 w-5 text-gray-400" />} iconEnd isRTL={isRTL}>
                    <select value={form.severity} onChange={(event) => setForm({ ...form, severity: Number(event.target.value) as InjurySeverityId })} className="field-input appearance-none">
                      {SEVERITIES.map((item) => (
                        <option key={item.id} value={item.id}>{isRTL ? item.ar : item.en}</option>
                      ))}
                    </select>
                  </IconInput>
                </Field>

                <Field label={isRTL ? "الطبيب البيطري" : "Veterinarian"}>
                  <IconInput icon={<ChevronDown className="h-5 w-5 text-gray-400" />} iconEnd isRTL={isRTL}>
                    <select
                      value={form.veterinarianId || ""}
                      onChange={(event) => {
                        const id = Number(event.target.value);
                        const selected = vets.find((vet) => vet.id === id);
                        setForm({
                          ...form,
                          veterinarianId: id || 0,
                          veterinarianName: selected?.name ?? "",
                          phoneNumber: selected?.phone ?? "",
                        });
                      }}
                      className="field-input appearance-none"
                    >
                      <option value="">{isRTL ? "اختر الطبيب أو أدخل يدوياً" : "Select veterinarian or enter manually"}</option>
                      {vets.map((vet) => (
                        <option key={vet.id} value={vet.id}>{vet.name}</option>
                      ))}
                    </select>
                  </IconInput>
                </Field>

                <Field label={isRTL ? "اسم الطبيب البيطري" : "Veterinarian name"}>
                  <input
                    value={form.veterinarianName ?? ""}
                    onChange={(event) => setForm({ ...form, veterinarianId: 0, veterinarianName: event.target.value })}
                    placeholder={isRTL ? "اسم الطبيب البيطري" : "Veterinarian name"}
                    className="field-input"
                  />
                </Field>

                <Field label={isRTL ? "رقم الهاتف" : "Phone number"}>
                  <IconInput icon={<Phone className="h-5 w-5 text-gray-400" />} isRTL={isRTL}>
                    <input value={form.phoneNumber ?? ""} onChange={(event) => setForm({ ...form, phoneNumber: event.target.value })} placeholder={isRTL ? "رقم الهاتف" : "Phone number"} className="field-input" dir="ltr" />
                  </IconInput>
                </Field>

                <Field label={isRTL ? "التكلفة" : "Cost"}>
                  <div className="relative">
                    <span className={`pointer-events-none absolute top-1/2 -translate-y-1/2 font-bold text-gray-400 ${isRTL ? "right-4" : "left-4"}`}>$</span>
                    <input type="number" min={0} step="0.01" value={form.cost ?? 0} onChange={(event) => setForm({ ...form, cost: Number(event.target.value) })} placeholder={isRTL ? "التكلفة" : "Cost"} className={`field-input ${isRTL ? "pr-12" : "pl-12"}`} />
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

function buildFixedHorse(id: number, name?: string): HorseListItemDto {
  return {
    id,
    localId: id,
    englishName: name ?? null,
    arabicName: name ?? null,
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
  };
}

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
