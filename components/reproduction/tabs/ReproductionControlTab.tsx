"use client";

import { useMemo, useState } from "react";
import { useLocale } from "@/lib/locale-context";
import { Download, Plus, Search, Trash2 } from "lucide-react";
import ReproductionControlTable, {
  type ReproductionControlRow,
} from "@/components/reproduction/tables/ReproductionControlTable";
import ReproductionControlModal from "@/components/reproduction/modals/ReproductionControlModal";
import { BreedingPagination } from "@/components/reproduction/BreedingPagination";

const dummyReproductionControlRows: ReproductionControlRow[] = Array.from({
  length: 10,
}).map((_, i) => ({
  id: String(i + 1),
  scheduled: i % 4 === 1 ? "لا" : "نعم",
  date: "6 مايو 2025",
  time: "10 صباحا",
  examMethod: "طريقة الفحص",
  doctor: "محمد احمد",
}));

export default function ReproductionControlTab() {
  const { locale, direction, t } = useLocale();
  const isRTL = direction === "rtl";

  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [rows, setRows] = useState<ReproductionControlRow[]>(
    dummyReproductionControlRows,
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingRow, setEditingRow] = useState<ReproductionControlRow | null>(
    null,
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((r) => {
      const haystack = [r.scheduled, r.date, r.time, r.examMethod, r.doctor]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
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

  function openEditModal(row: ReproductionControlRow) {
    setModalMode("edit");
    setEditingRow(row);
    setModalOpen(true);
  }

  function handleModalSubmit(data: ReproductionControlRow) {
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

  function deleteRow(row: ReproductionControlRow) {
    setRows((current) => current.filter((item) => item.id !== row.id));
    setSelectedIds((current) => current.filter((id) => id !== row.id));
  }

  return (
    <div className="space-y-5">
      <div
        className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${
          isRTL ? "sm:flex-row-reverse" : ""
        }`}
      >
        <div className="flex items-center gap-2">
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
            {t("common.delete")}
          </button>
          <button
            onClick={openAddModal}
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-[13px] bg-[#4b2f1a] px-5 text-sm font-bold text-white shadow-[0_8px_18px_rgba(75,47,26,0.15)] hover:bg-[#3c2515] sm:flex-none"
          >
            <Plus className="h-[18px] w-[18px]" />
            {t("common.addNewRecord")}
          </button>

          <button
            disabled={selectedIds.length === 0}
            className="flex h-11 w-11 items-center justify-center rounded-[13px] border border-[#e7dbd3] bg-white text-[#4b2f1a] disabled:cursor-not-allowed disabled:text-[#b5aaa3]"
            aria-label={t("common.download")}
            title={t("common.download")}
          >
            <Download className="h-[18px] w-[18px]" />
          </button>
        </div>

        <div className="relative w-full sm:w-[360px]">
          <span
            className={`absolute top-1/2 -translate-y-1/2 text-[#6f625b] ${
              isRTL ? "right-4" : "left-4"
            }`}
          >
            <Search className="h-[18px] w-[18px]" />
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={`h-11 w-full rounded-[13px] border border-[#e9ded6] bg-white text-sm outline-none placeholder:text-[#b7a9a0] focus:border-[#8b6b52] focus:ring-4 focus:ring-[#8b6b52]/10 ${
              isRTL ? "pr-11 text-right" : "pl-11 text-left"
            }`}
            placeholder={t("common.search")}
          />
        </div>
      </div>

      {/* Table */}
      <ReproductionControlTable
        locale={locale}
        direction={direction}
        rows={filtered}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
        onToggleSelectAll={toggleSelectAll}
        onEdit={openEditModal}
        onDelete={deleteRow}
      />

      {/* NEW: Modal for add/edit */}
      <ReproductionControlModal
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
