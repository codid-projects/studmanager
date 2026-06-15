"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/lib/locale-context";
import ReproductionRecordsTable, {
  type RecordItem,
} from "@/components/reproduction/ReproductionRecordsTable";
import {
  Baby,
  CalendarDays,
  Dna,
  HeartPulse,
  MapPin,
  Plus,
  Search,
  Trash2,
  Warehouse,
} from "lucide-react";
import ReproductionRecordModal from "@/components/reproduction/modals/ReproductionRecordModal";
import horsePlaceholder from "@/app/assets/imgs/horse-placehodler.png";
import { BreedingPagination } from "@/components/reproduction/BreedingPagination";

type SummaryCard = {
  titleKey: string;
  value: string | number;
  sub?: { labelKey: string; value: string | number }[];
};

const dummyHorse = {
  nameAr: "مداح مهنا",
  nameEn: "Maddah Muhanna",
  farmAr: "اسم المزرعة",
  farmEn: "Farm name",
  dob: "22/4/2015",
  bornInAr: "مصر",
  bornInEn: "Egypt",
  currentInAr: "مصر",
  currentInEn: "Egypt",
};

const summaryCards: SummaryCard[] = [
  { titleKey: "reproduction.maresOverview.summary.offspringCount", value: 5 },
  {
    titleKey: "reproduction.maresOverview.summary.lastBirth",
    value: "مداح مهنا",
  },
  {
    titleKey: "reproduction.maresOverview.summary.successfulPregnancies",
    value: 5,
  },
  {
    titleKey: "reproduction.maresOverview.summary.reproductionService",
    value: "",
    sub: [
      {
        labelKey: "reproduction.maresOverview.summary.embryoCollection",
        value: 5,
      },
      { labelKey: "reproduction.maresOverview.summary.pregnancy", value: 5 },
    ],
  },
  {
    titleKey: "reproduction.maresOverview.summary.embryoTransfer",
    value: "0/0",
  },
  { titleKey: "reproduction.maresOverview.summary.currentEmbryos", value: 5 },
];

const summaryIcons = [Baby, CalendarDays, HeartPulse, Dna, Dna, Baby];

// Table dummy JSON (matches screenshot columns)
const dummyRows: RecordItem[] = [
  {
    id: "1",
    horse: "مداح مهنا",
    dob: "22/4/2025",
    results: "نجح",
    location: "تم الحمل",
    price: "طبيعي",
  },
  {
    id: "2",
    horse: "مداح مهنا",
    dob: "22/4/2025",
    results: "فشل",
    location: "فشل في الإباضة",
    price: "طبيعي",
  },
  {
    id: "3",
    horse: "مداح مهنا",
    dob: "22/4/2025",
    results: "نجح",
    location: "تم الحمل",
    price: "طبيعي",
  },
  {
    id: "4",
    horse: "مداح مهنا",
    dob: "22/4/2025",
    results: "نجح",
    location: "تم الحمل",
    price: "طبيعي",
  },
  {
    id: "5",
    horse: "مداح مهنا",
    dob: "22/4/2025",
    results: "نجح",
    location: "تم الحمل",
    price: "طبيعي",
  },
];

export default function MaresOverviewTab({
  initialHorseId,
  initialHorseName,
}: {
  initialHorseId?: string | null;
  initialHorseName?: string | null;
}) {
  const { locale, direction, t } = useLocale();
  const isRTL = direction === "rtl";

  const [query, setQuery] = useState(initialHorseName ?? "");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [rows, setRows] = useState<RecordItem[]>(dummyRows);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingRow, setEditingRow] = useState<RecordItem | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.horse.toLowerCase().includes(q) ||
        (r.dob || "").toLowerCase().includes(q) ||
        (r.results || "").toLowerCase().includes(q) ||
        (r.location || "").toLowerCase().includes(q) ||
        (r.price || "").toLowerCase().includes(q),
    );
  }, [query, rows]);

  function toggleSelect(id: string) {
    setSelectedIds((cur) =>
      cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id],
    );
  }

  function toggleSelectAll() {
    if (selectedIds.length === filtered.length) setSelectedIds([]);
    else setSelectedIds(filtered.map((r) => r.id));
  }

  function openAddModal() {
    setModalMode("add");
    setEditingRow(null);
    setModalOpen(true);
  }

  function openEditModal(row: RecordItem) {
    setModalMode("edit");
    setEditingRow(row);
    setModalOpen(true);
  }

  function handleModalSubmit(data: RecordItem) {
    if (modalMode === "add") {
      setRows((cur) => [{ ...data, id: String(Date.now()) }, ...cur]);
    } else if (modalMode === "edit" && editingRow) {
      setRows((cur) => cur.map((r) => (r.id === editingRow.id ? data : r)));
    }
    setModalOpen(false);
    setEditingRow(null);
  }

  function deleteSelected() {
    setRows((current) =>
      current.filter((row) => !selectedIds.includes(row.id)),
    );
    setSelectedIds([]);
  }

  function deleteRow(row: RecordItem) {
    setRows((current) => current.filter((item) => item.id !== row.id));
    setSelectedIds((current) => current.filter((id) => id !== row.id));
  }

  return (
    <div className="w-full max-w-full space-y-6 overflow-x-hidden">
      <div className="overflow-hidden rounded-[24px] border border-[#ede3dc] bg-white shadow-[0_14px_40px_rgba(75,47,26,0.055)]">
        <div
          className={`flex flex-col gap-3 border-b border-[#f0e8e2] bg-[#fffdfb] p-4 sm:flex-row sm:items-center sm:p-5 ${
            isRTL ? "sm:flex-row-reverse" : ""
          }`}
        >
          <Link
            href={`/${locale}/horses/${initialHorseId || "1"}`}
            className="order-2 flex h-12 w-full items-center justify-center rounded-[14px] bg-[#4b2f1a] px-6 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(75,47,26,0.16)] hover:bg-[#3c2515] sm:order-none sm:w-auto sm:min-w-[190px]"
          >
            {t("reproduction.maresOverview.viewProfile")}
          </Link>

          <div className="relative w-full min-w-0">
            <span
              className={`absolute top-1/2 -translate-y-1/2 text-[#6f625b] ${
                isRTL ? "right-4" : "left-4"
              }`}
            >
              <Search className="h-[18px] w-[18px]" strokeWidth={1.8} />
            </span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={`h-12 w-full rounded-[14px] border border-[#e9ded6] bg-white text-sm text-[#342720] outline-none placeholder:text-[#b7a9a0] focus:border-[#8b6b52] focus:ring-4 focus:ring-[#8b6b52]/10 ${
                isRTL ? "pr-11 text-right" : "pl-11 text-left"
              }`}
              placeholder={t("reproduction.maresOverview.searchPlaceholder")}
            />
          </div>
        </div>

        <div
          className={`grid gap-6 p-5 sm:p-6 lg:grid-cols-[210px_1fr] ${
            isRTL ? "lg:[direction:rtl]" : ""
          }`}
        >
          <div className="w-full">
            <div className="aspect-[1.08/1] w-full overflow-hidden rounded-[18px] bg-[#f3efeb]">
              <img
                src={horsePlaceholder.src}
                alt={initialHorseName || dummyHorse.nameEn}
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          <div className={`${isRTL ? "text-right" : "text-left"} min-w-0`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-[#2c211c]">
                  {initialHorseName ||
                    (locale === "ar" ? dummyHorse.nameAr : dummyHorse.nameEn)}
                </h2>
                <p className="mt-1 text-sm text-[#9a877b]">
                  {locale === "ar" ? "فرس عربية أصيلة" : "Purebred Arabian mare"}
                </p>
              </div>
              <span className="rounded-full bg-[#f5efbb] px-3 py-1.5 text-xs font-bold text-[#594424]">
                {locale === "ar" ? "نشطة للتكاثر" : "Breeding active"}
              </span>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <div className="flex items-center gap-3 rounded-2xl bg-[#fbf8f5] p-3.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#6a4a34] shadow-sm">
                  <Warehouse className="h-5 w-5" strokeWidth={1.7} />
                </span>
                <div>
                  <p className="text-[11px] text-[#a18f84]">{t("common.farm")}</p>
                  <p className="mt-0.5 text-sm font-semibold text-[#3e3029]">
                    {locale === "ar" ? dummyHorse.farmAr : dummyHorse.farmEn}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl bg-[#fbf8f5] p-3.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#6a4a34] shadow-sm">
                  <CalendarDays className="h-5 w-5" strokeWidth={1.7} />
                </span>
                <div>
                  <p className="text-[11px] text-[#a18f84]">{t("common.dob")}</p>
                  <p className="mt-0.5 text-sm font-semibold text-[#3e3029]">
                    {dummyHorse.dob}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl bg-[#fbf8f5] p-3.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#6a4a34] shadow-sm">
                  <MapPin className="h-5 w-5" strokeWidth={1.7} />
                </span>
                <div>
                  <p className="text-[11px] text-[#a18f84]">
                    {t("common.currentlyIn")}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-[#3e3029]">
                    {locale === "ar"
                      ? dummyHorse.currentInAr
                      : dummyHorse.currentInEn}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {summaryCards.map((c, idx) => {
          const Icon = summaryIcons[idx];
          return (
            <div
              key={c.titleKey}
              className="rounded-[20px] border border-[#ede3dc] bg-white p-5 shadow-[0_10px_30px_rgba(75,47,26,0.045)]"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-bold text-[#3a2c25]">
                  {t(c.titleKey)}
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f7f1ec] text-[#6a4a34]">
                  <Icon className="h-5 w-5" strokeWidth={1.7} />
                </span>
              </div>

              {c.sub ? (
                <div className="mt-5 grid grid-cols-2 gap-3">
                  {c.sub.map((s) => (
                    <div key={s.labelKey} className="rounded-xl bg-[#fbf8f5] p-3">
                      <div className="text-xs text-[#88766b]">
                        {t(s.labelKey)}
                      </div>
                      <div className="mt-1 text-2xl font-bold text-[#2c211c]">
                        {s.value}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-5 text-3xl font-bold text-[#2c211c]">
                  {c.value}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div
        className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${
          isRTL ? "sm:flex-row-reverse" : ""
        }`}
      >
        <div>
          <p className="text-xs font-semibold text-[#9b8779]">
            {locale === "ar" ? "سجل التكاثر" : "Breeding history"}
          </p>
          <h3 className="mt-1 text-xl font-bold text-[#2c211c]">
            {t("reproduction.maresOverview.recordsTitle")}
          </h3>
        </div>

        <div className="flex w-full items-center gap-2 sm:w-auto">
          <button
            disabled={selectedIds.length === 0}
            onClick={deleteSelected}
            className={`flex h-11 flex-1 items-center justify-center gap-2 rounded-[13px] px-4 text-sm font-bold sm:flex-none ${
              selectedIds.length === 0
                ? "cursor-not-allowed bg-[#eee9e5] text-[#b5aaa3]"
                : "bg-[#fff0ed] text-[#b53d32] hover:bg-[#ffe5df]"
            }`}
          >
            <Trash2 className="h-4 w-4" />
            {t("common.deleteAll")}
          </button>
          <button
            onClick={openAddModal}
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-[13px] bg-[#4b2f1a] px-5 text-sm font-bold text-white shadow-[0_8px_18px_rgba(75,47,26,0.15)] hover:bg-[#3c2515] sm:flex-none"
          >
            <Plus className="h-[18px] w-[18px]" />
            {t("common.addNewRecord")}
          </button>
        </div>
      </div>

      {/* Table */}
      <ReproductionRecordsTable
        locale={locale}
        direction={direction}
        rows={filtered}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
        onToggleSelectAll={toggleSelectAll}
        onEdit={openEditModal}
        onDelete={deleteRow}
      />

      {/* NEW: Modal */}
      <ReproductionRecordModal
        open={modalOpen}
        mode={modalMode}
        initialData={editingRow}
        onClose={() => {
          setModalOpen(false);
          setEditingRow(null);
        }}
        onSubmit={handleModalSubmit}
      />

      <BreedingPagination direction={direction} />
    </div>
  );
}
