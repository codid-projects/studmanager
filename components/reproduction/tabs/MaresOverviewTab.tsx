"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/lib/locale-context";
import ReproductionRecordsTable, {
  type RecordItem,
} from "@/components/reproduction/ReproductionRecordsTable";
import { Search } from "lucide-react";
import ReproductionRecordModal from "@/components/reproduction/modals/ReproductionRecordModal";

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

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Top card (search + info) */}
      <div className="rounded-2xl bg-white shadow-sm p-4 sm:p-6 w-full max-w-full overflow-x-hidden">
        <div
          className={`flex flex-col sm:flex-row sm:items-center gap-3 ${
            isRTL ? "sm:flex-row-reverse" : ""
          }`}
        >
          <Link
            href={`/${locale}/horses/${initialHorseId || "1"}`}
            className="flex h-11 w-full max-w-full items-center justify-center rounded-2xl bg-[#4b2f1a] px-4 text-sm font-semibold text-white sm:w-auto"
          >
            {t("reproduction.maresOverview.viewProfile")}
          </Link>

          <div className="relative w-full min-w-0">
            <span
              className={`absolute top-1/2 -translate-y-1/2 text-[#6f625b] ${
                isRTL ? "right-4" : "left-4"
              }`}
            >
              <Search className="h-4 w-4" />
            </span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={`w-full max-w-full h-11 rounded-2xl border border-[#ece2da] bg-white text-sm outline-none ${
                isRTL ? "pr-10 text-right" : "pl-10 text-left"
              }`}
              placeholder={t("reproduction.maresOverview.searchPlaceholder")}
            />
          </div>
        </div>

        {/* Mobile: stack, Desktop: keep same */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6 items-start w-full max-w-full">
          <div className="w-full max-w-full">
            <div className="w-full aspect-[2/2] rounded-2xl overflow-hidden bg-[#f3f1ef]">
              <img
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQfquc1pFNFujzgkuv6_xka95bqkKHoR4jE5w&s"
                alt="mare"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className={`${isRTL ? "text-right" : "text-left"} min-w-0`}>
            <div className="text-sm">
              <div className="flex gap-2 mb-5 min-w-0">
                <span className="font-bold text-[#2c2330] whitespace-nowrap">
                  {t("common.name")} :
                </span>
                <span className="text-[#5f525a] break-words min-w-0">
                  {initialHorseName || (locale === "ar" ? dummyHorse.nameAr : dummyHorse.nameEn)}
                </span>
              </div>

              <div className="flex gap-2 mb-5 min-w-0">
                <span className="font-bold text-[#2c2330] whitespace-nowrap">
                  {t("common.farm")} :
                </span>
                <span className="text-[#5f525a] break-words min-w-0">
                  {locale === "ar" ? dummyHorse.farmAr : dummyHorse.farmEn}
                </span>
              </div>

              <div className="flex gap-2 mb-5 min-w-0">
                <span className="font-bold text-[#2c2330] whitespace-nowrap">
                  {t("common.dob")} :
                </span>
                <span className="text-[#5f525a] break-words min-w-0">
                  {dummyHorse.dob}
                </span>
              </div>

              <div className="flex gap-2 mb-5 min-w-0">
                <span className="font-bold text-[#2c2330] whitespace-nowrap">
                  {t("common.bornIn")} :
                </span>
                <span className="text-[#5f525a] break-words min-w-0">
                  {locale === "ar" ? dummyHorse.bornInAr : dummyHorse.bornInEn}
                </span>
              </div>

              <div className="flex gap-2 mb-5 min-w-0">
                <span className="font-bold text-[#2c2330] whitespace-nowrap">
                  {t("common.currentlyIn")} :
                </span>
                <span className="text-[#5f525a] break-words min-w-0">
                  {locale === "ar"
                    ? dummyHorse.currentInAr
                    : dummyHorse.currentInEn}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {summaryCards.map((c, idx) => (
          <div
            key={idx}
            className="rounded-2xl bg-white shadow-sm p-5 border border-[#f2ece7] text-center"
          >
            <div className="text-sm font-bold text-[#2c2330]">
              {t(c.titleKey)}
            </div>

            {c.sub ? (
              <div className="mt-4 grid grid-cols-2 gap-3 text-center">
                {c.sub.map((s, i) => (
                  <div key={i}>
                    <div className="text-xs text-[#6f625b]">
                      {t(s.labelKey)}
                    </div>
                    <div className="mt-1 text-xl font-extrabold text-[#2c2330]">
                      {s.value}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-3 text-3xl font-extrabold text-[#2c2330]">
                {c.value}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Section header + actions */}
      <div
        className={`flex items-center justify-between gap-3 flex-wrap ${
          isRTL ? "flex-row-reverse" : ""
        }`}
      >
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={openAddModal}
            className="h-11 px-4 rounded-2xl bg-[#4b2f1a] text-white text-sm font-semibold w-full sm:w-auto"
          >
            {t("common.addNewRecord")}
          </button>

          <button
            disabled={selectedIds.length === 0}
            className={`h-11 px-4 rounded-2xl text-sm font-semibold w-full sm:w-auto ${
              selectedIds.length === 0
                ? "bg-[#e7e2de] text-[#9a8f88]"
                : "bg-[#d9534f] text-white"
            }`}
          >
            {t("common.deleteAll")}
          </button>
        </div>

        <div className="text-lg font-bold text-[#2c2330] w-full sm:w-auto">
          {t("reproduction.maresOverview.recordsTitle")}
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
        onDelete={() => {}}
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

      {/* pagination placeholder (responsive) */}
      <div className="flex items-center justify-center gap-2 pt-2">
        <button className="h-9 w-9 rounded-full border bg-white">‹</button>
        <div className="h-9 w-9 rounded-full bg-[#4b2f1a] text-white flex items-center justify-center text-sm">
          1
        </div>
        <button className="h-9 w-9 rounded-full border bg-white">2</button>
        <button className="h-9 w-9 rounded-full border bg-white">3</button>
        <button className="h-9 w-9 rounded-full border bg-white">›</button>
      </div>
    </div>
  );
}
