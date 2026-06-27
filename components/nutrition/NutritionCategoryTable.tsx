"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Edit,
  Search,
  Trash2,
  X,
} from "lucide-react";
import DeleteConfirmModal from "@/components/common/DeleteConfirmModal";
import { HorsePicker } from "@/components/horses/HorsePicker";
import { OptionPicker } from "@/components/common/OptionPicker";
import { isClientApiNotFound } from "@/lib/api/client";
import { fetchSupplements, saveSupplement } from "@/lib/api/management-client";
import {
  fetchNutrition,
  fetchNutritionTypes,
  removeNutrition,
  saveNutrition,
} from "@/lib/api/nutrition-client";
import type {
  CreateNutritionPayload,
  HorseListItemDto,
  LocaleCode,
  NutritionRecordDto,
  NutritionTypeDto,
  NutritionTypeId,
  SupplementDto,
} from "@/lib/api/types";
import { useLocale, useTranslation } from "@/lib/locale-context";

interface NutritionCategoryTableProps {
  categoryId: string;
}

const CATEGORY_TYPE: Record<string, NutritionTypeId> = {
  "feed-changes": 1,
  "monthly-supplements": 2,
  "tournament-supplements": 3,
};

const TYPE_NAMES: Record<string, string> = {
  "feed-changes": "FeedChanges",
  "monthly-supplements": "MonthlySuppliments",
  "tournament-supplements": "TournamentSuppliments",
};

// SupplementType enum on the backend: Food=1, Monthly=2, Tournament=3.
// Inferred from the current category when quick-adding a supplement/feed.
const SUPPLEMENT_TYPE_BY_CATEGORY: Record<string, number> = {
  "feed-changes": 1,
  "monthly-supplements": 2,
  "tournament-supplements": 3,
};

const PAGE_SIZE = 10;

function dateInputValue(value?: string | null) {
  if (!value) return "";
  return value.slice(0, 10);
}

function emptyForm(type: NutritionTypeId): CreateNutritionPayload {
  return {
    horseId: 0,
    supplementId: 0,
    supplierId: 0,
    supplierName: "",
    phoneNumber: "",
    quantity: 0,
    cost: 0,
    type,
    changeDate: "",
    notifyOnDate: "",
  };
}

export const NutritionCategoryTable = ({
  categoryId,
}: NutritionCategoryTableProps) => {
  const { locale, direction } = useLocale();
  const { t } = useTranslation();
  const localeCode = locale as LocaleCode;
  const isRTL = direction === "rtl";
  const fallbackType = CATEGORY_TYPE[categoryId];
  const [types, setTypes] = useState<NutritionTypeDto[]>([]);
  const [records, setRecords] = useState<NutritionRecordDto[]>([]);
  const [selectedHorse, setSelectedHorse] = useState<HorseListItemDto | null>(
    null,
  );
  const [supplements, setSupplements] = useState<SupplementDto[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<NutritionRecordDto | null>(null);
  const [form, setForm] = useState<CreateNutritionPayload>(
    emptyForm(fallbackType ?? 1),
  );
  const [deleteTarget, setDeleteTarget] = useState<NutritionRecordDto | null>(
    null,
  );

  const nutritionType = useMemo(() => {
    const expectedName = TYPE_NAMES[categoryId];
    return types.find((item) => item.name === expectedName)?.id ?? fallbackType;
  }, [categoryId, fallbackType, types]);

  const title = isRTL
    ? categoryId === "feed-changes"
      ? "تغييرات الأعلاف"
      : categoryId === "monthly-supplements"
        ? "المكملات الشهرية"
        : categoryId === "tournament-supplements"
          ? "مكملات المهرجانات"
          : "مساعد التغذية"
    : categoryId === "feed-changes"
      ? "Feed Changes"
      : categoryId === "monthly-supplements"
        ? "Monthly Supplements"
        : categoryId === "tournament-supplements"
          ? "Tournament Supplements"
          : "Nutrition Assistant";

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let active = true;

    async function loadLookups() {
      const results = await Promise.allSettled([
        fetchNutritionTypes(localeCode),
        fetchSupplements(localeCode, 1, 100),
      ]);

      if (!active) return;
      setTypes(results[0].status === "fulfilled" ? results[0].value : []);
      setSupplements(
        results[1].status === "fulfilled" ? (results[1].value.data ?? []) : [],
      );
    }

    loadLookups();
    return () => {
      active = false;
    };
  }, [locale, localeCode]);

  const loadRecords = useCallback(async () => {
    if (!nutritionType) {
      setRecords([]);
      setTotalPages(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const result = await fetchNutrition(localeCode, {
        type: nutritionType,
        search: debouncedSearch || undefined,
        pageNumber: page,
        pageSize: PAGE_SIZE,
      });
      setRecords(result?.data ?? []);
      setTotalPages(result?.totalPages ?? 0);
    } catch (requestError) {
      if (isClientApiNotFound(requestError)) {
        setRecords([]);
        setTotalPages(0);
      } else {
        setError(
          requestError instanceof Error
            ? requestError.message
            : t("common.error"),
        );
      }
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, localeCode, nutritionType, page, t]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  function openCreate() {
    if (!nutritionType) return;
    setEditing(null);
    setSelectedHorse(null);
    setForm(emptyForm(nutritionType));
    setFormOpen(true);
  }

  function openEdit(record: NutritionRecordDto) {
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
      supplementId: record.supplementId,
      supplierId: record.supplierId ?? 0,
      supplierName: record.supplierName ?? "",
      phoneNumber: record.phoneNumber ?? "",
      quantity: record.quantity,
      cost: record.cost,
      type: record.type,
      changeDate: dateInputValue(record.changeDate),
      notifyOnDate: dateInputValue(record.notifyOnDate),
    });
    setFormOpen(true);
  }

  async function submitForm(event: React.FormEvent) {
    event.preventDefault();
    if (!form.horseId || !form.supplementId || !nutritionType) return;

    setSaving(true);
    setError("");
    try {
      if (editing) {
        await saveNutrition(
          localeCode,
          {
            id: editing.id,
            supplementId: form.supplementId,
            supplierId: form.supplierId,
            supplierName: form.supplierName,
            phoneNumber: form.phoneNumber,
            quantity: form.quantity,
            cost: form.cost,
            changeDate: form.changeDate,
            notifyOnDate: form.notifyOnDate,
          },
          editing.id,
        );
      } else {
        await saveNutrition(localeCode, { ...form, type: nutritionType });
      }
      setFormOpen(false);
      await loadRecords();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : t("common.error"),
      );
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setSaving(true);
    setError("");
    try {
      await removeNutrition(localeCode, deleteTarget.id);
      setDeleteTarget(null);
      await loadRecords();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : t("common.error"),
      );
    } finally {
      setSaving(false);
    }
  }

  const pageNumbers = useMemo(() => {
    const start = Math.max(1, Math.min(page - 1, totalPages - 2));
    return Array.from(
      { length: Math.min(3, totalPages) },
      (_, index) => start + index,
    );
  }, [page, totalPages]);

  return (
    <>
      <div
        className="rounded-[2rem] border border-[#f3ece7] bg-white p-4 shadow-sm sm:p-8"
        dir={direction}
      >
        <div className="mb-8 flex flex-col items-start justify-between gap-6 xl:flex-row xl:items-center">
          <h2 className="text-2xl font-bold text-[#3b2b20]">{title}</h2>
          <div className="flex w-full flex-col gap-4 sm:flex-row xl:w-auto">
            <div className="relative flex-1 sm:w-80">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t("common.search")}
                className={`w-full rounded-2xl border border-[#ece2da] bg-[#fdfbf9] px-5 py-3 outline-none ${isRTL ? "pr-12" : "pl-12"}`}
              />
              <Search
                className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a7a6d] ${isRTL ? "right-4" : "left-4"}`}
              />
            </div>
            <button
              onClick={openCreate}
              disabled={!nutritionType}
              className="rounded-2xl bg-[#3b2b20] px-6 py-3 font-bold text-white disabled:opacity-50"
            >
              {t("common.addNewRecord")}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px]">
            <thead className="bg-[#4b2f1a] text-white">
              <tr>
                {[
                  isRTL ? "اسم الخيل" : "Horse",
                  isRTL ? "المكمل / العلف" : "Supplement / Feed",
                  isRTL ? "المورد" : "Supplier",
                  isRTL ? "الهاتف" : "Phone",
                  isRTL ? "الكمية" : "Quantity",
                  isRTL ? "التكلفة" : "Cost",
                  isRTL ? "تاريخ التغيير" : "Change date",
                  isRTL ? "تاريخ التنبيه" : "Notify date",
                ].map((label) => (
                  <th key={label} className="px-4 py-4 text-start">
                    {label}
                  </th>
                ))}
                <th className="px-4 py-4 text-center">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record, index) => (
                <tr
                  key={record.id}
                  className={`border-b ${index % 2 ? "bg-[#fdfbf7]" : "bg-white"}`}
                >
                  <td className="px-4 py-4 font-semibold text-[#3b2b20]">
                    {isRTL
                      ? record.horseArabicName || record.horseEnglishName
                      : record.horseEnglishName || record.horseArabicName}
                  </td>
                  <td className="px-4 py-4">
                    {isRTL
                      ? record.supplementArabicName || record.supplementName
                      : record.supplementName || record.supplementArabicName}
                  </td>
                  <td className="px-4 py-4">{record.supplierName || "-"}</td>
                  <td className="px-4 py-4">{record.phoneNumber || "-"}</td>
                  <td className="px-4 py-4">{record.quantity}</td>
                  <td className="px-4 py-4">{record.cost}</td>
                  <td className="px-4 py-4">
                    {dateInputValue(record.changeDate) || "-"}
                  </td>
                  <td className="px-4 py-4">
                    {dateInputValue(record.notifyOnDate) || "-"}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => openEdit(record)}
                        className="rounded-lg border p-2 text-[#4b2f1a]"
                        aria-label={t("common.edit")}
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(record)}
                        className="rounded-lg border border-red-100 p-2 text-red-600"
                        aria-label={t("common.delete")}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && !records.length && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-6 py-12 text-center text-gray-400"
                  >
                    {t("common.noRecordsFound")}
                  </td>
                </tr>
              )}
              {loading &&
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="animate-pulse border-b">
                    <td colSpan={9} className="px-4 py-3">
                      <div className="h-8 rounded-lg bg-gray-100" />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((value) => value - 1)}
              className="flex h-9 w-9 items-center justify-center rounded-full border disabled:opacity-40"
            >
              {isRTL ? <ChevronRight /> : <ChevronLeft />}
            </button>
            {pageNumbers.map((pageNumber) => (
              <button
                key={pageNumber}
                onClick={() => setPage(pageNumber)}
                className={`h-9 w-9 rounded-full ${page === pageNumber ? "bg-[#3b2b20] text-white" : "border"}`}
              >
                {pageNumber}
              </button>
            ))}
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((value) => value + 1)}
              className="flex h-9 w-9 items-center justify-center rounded-full border disabled:opacity-40"
            >
              {isRTL ? <ChevronLeft /> : <ChevronRight />}
            </button>
          </div>
        )}
      </div>

      {formOpen && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-4"
          dir={direction}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setFormOpen(false);
          }}
        >
          <form
            onSubmit={submitForm}
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-xl"
          >
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-[#3b2b20]">
                {editing
                  ? isRTL
                    ? "تعديل سجل التغذية"
                    : "Edit nutrition record"
                  : isRTL
                    ? "إضافة سجل تغذية"
                    : "Add nutrition record"}
              </h3>
              <button type="button" onClick={() => setFormOpen(false)}>
                <X />
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium text-[#58483e]">
                <span>{isRTL ? "الخيل" : "Horse"}</span>
                <HorsePicker
                  value={form.horseId || null}
                  selectedLabel={
                    selectedHorse
                      ? isRTL
                        ? selectedHorse.arabicName ||
                          selectedHorse.englishName ||
                          ""
                        : selectedHorse.englishName ||
                          selectedHorse.arabicName ||
                          ""
                      : undefined
                  }
                  disabled={Boolean(editing)}
                  onChange={(horse) => {
                    setSelectedHorse(horse);
                    setForm({ ...form, horseId: horse.localId ?? horse.id });
                  }}
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-[#58483e]">
                <span>{isRTL ? "المكمل أو العلف" : "Supplement or feed"}</span>
                <OptionPicker
                  value={form.supplementId || null}
                  options={supplements.map((supplement) => ({
                    id: supplement.id,
                    label: isRTL
                      ? supplement.arabicName || supplement.englishName
                      : supplement.englishName || supplement.arabicName,
                  }))}
                  onChange={(option) => setForm({ ...form, supplementId: Number(option.id) })}
                  placeholder={isRTL ? "اختر المكمل أو العلف" : "Select supplement or feed"}
                  title={isRTL ? "المكمل أو العلف" : "Supplement or feed"}
                  searchPlaceholder={isRTL ? "ابحث عن مكمل أو علف" : "Search supplements or feed"}
                  emptyText={isRTL ? "لا توجد عناصر" : "No items"}
                  createLabel={isRTL ? "إضافة مكمل / علف جديد" : "Add new supplement / feed"}
                  createTitle={isRTL ? "إضافة مكمل / علف" : "Add supplement / feed"}
                  createFields={[
                    { key: "arabicName", label: isRTL ? "الاسم بالعربية" : "Arabic name", required: true },
                    { key: "englishName", label: isRTL ? "الاسم بالإنجليزية" : "English name" },
                  ]}
                  onCreate={async (values) => {
                    const ar = values.arabicName?.trim() || values.englishName?.trim() || "";
                    const en = values.englishName?.trim() || values.arabicName?.trim() || "";
                    const type = SUPPLEMENT_TYPE_BY_CATEGORY[categoryId] ?? 1;
                    await saveSupplement(localeCode, { arabicName: ar, englishName: en, description: "", type });
                    const refreshed = await fetchSupplements(localeCode, 1, 100);
                    const list = refreshed.data ?? [];
                    setSupplements(list);
                    const created = list.find((item) => item.arabicName === ar || item.englishName === en);
                    if (!created) throw new Error(isRTL ? "تعذر إيجاد العنصر المضاف" : "Could not find the created item");
                    return {
                      id: created.id,
                      label: isRTL ? created.arabicName || created.englishName : created.englishName || created.arabicName,
                    };
                  }}
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-[#58483e]">
                <span>{isRTL ? "اسم المورد" : "Supplier name"}</span>
                <input
                  value={form.supplierName}
                  onChange={(event) =>
                    setForm({ ...form, supplierName: event.target.value })
                  }
                  placeholder={
                    isRTL ? "أدخل اسم المورد" : "Enter supplier name"
                  }
                  className="rounded-xl border px-4 py-3"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-[#58483e]">
                <span>{isRTL ? "رقم المورد" : "Supplier phone"}</span>
                <input
                  value={form.phoneNumber}
                  onChange={(event) =>
                    setForm({ ...form, phoneNumber: event.target.value })
                  }
                  placeholder={
                    isRTL ? "أدخل رقم المورد" : "Enter supplier phone"
                  }
                  className="rounded-xl border px-4 py-3"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-[#58483e]">
                <span>{isRTL ? "الكمية" : "Quantity"}</span>
                <input
                  required
                  min={0}
                  step="any"
                  type="number"
                  value={form.quantity}
                  onChange={(event) =>
                    setForm({ ...form, quantity: Number(event.target.value) })
                  }
                  className="rounded-xl border px-4 py-3"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-[#58483e]">
                <span>{isRTL ? "التكلفة بالجنيه المصري" : "Cost (EGP)"}</span>
                <div className="relative">
                  <input
                    required
                    min={0}
                    step="any"
                    type="number"
                    value={form.cost}
                    onChange={(event) =>
                      setForm({ ...form, cost: Number(event.target.value) })
                    }
                    className="w-full rounded-xl border px-4 py-3 pe-16"
                  />
                  <span className="absolute end-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[#806e63]">
                    EGP
                  </span>
                </div>
              </label>
              <label className="flex flex-col gap-2 text-sm text-gray-600">
                <span>{isRTL ? "تاريخ التغيير" : "Change date"}</span>
                <input
                  required
                  type="date"
                  value={form.changeDate}
                  onChange={(event) =>
                    setForm({ ...form, changeDate: event.target.value })
                  }
                  className="rounded-xl border px-4 py-3"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-gray-600">
                <span>{isRTL ? "تاريخ التنبيه" : "Notify date"}</span>
                <input
                  required
                  type="date"
                  value={form.notifyOnDate}
                  onChange={(event) =>
                    setForm({ ...form, notifyOnDate: event.target.value })
                  }
                  className="rounded-xl border px-4 py-3"
                />
              </label>
            </div>
            <div className="mt-7 flex gap-3">
              <button
                disabled={saving}
                className="rounded-xl bg-[#3b2b20] px-8 py-3 font-bold text-white disabled:opacity-50"
              >
                {t("common.save")}
              </button>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="rounded-xl border px-8 py-3"
              >
                {t("common.cancel")}
              </button>
            </div>
          </form>
        </div>
      )}

      <DeleteConfirmModal
        open={Boolean(deleteTarget)}
        title={t("common.deleteRecord")}
        description={
          deleteTarget
            ? isRTL
              ? deleteTarget.horseArabicName || deleteTarget.horseEnglishName
              : deleteTarget.horseEnglishName || deleteTarget.horseArabicName
            : undefined
        }
        onCancel={() => !saving && setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </>
  );
};
