"use client";

import { useMemo, useState } from "react";
import { useLocale } from "@/lib/locale-context";
import DeleteConfirmModal from "../common/DeleteConfirmModal";
import { NaturalModal } from "./modals/NaturalModal";
import { FreshModal } from "./modals/FreshModal";
import { FrozenModal } from "./modals/FrozenModal";
import { VetModal } from "./modals/VetModal";
import ReproductionRecordsTable, {
  type RecordItem,
} from "./ReproductionRecordsTable";
import { dummyByType, type StallionType } from "./stallions/dummy";
import { StallionProfileCard } from "./stallions/StallionProfileCard";
import { StallionToolbar } from "./stallions/StallionToolbar";

function tagToType(tag: string): StallionType {
  // store Arabic-only keys as "stable ids" for mapping
  // and render labels via t() in UI (below)
  if (tag === "natural") return "natural";
  if (tag === "fresh") return "fresh";
  if (tag === "frozen") return "frozen";
  return "vet";
}

export default function StallionsTab({
  initialHorseId,
  initialHorseName,
}: {
  initialHorseId?: string | null;
  initialHorseName?: string | null;
}) {
  const { locale, direction, t } = useLocale();

  const [query, setQuery] = useState(initialHorseName ?? "");

  // Use stable ids for tab keys, translate labels via JSON
  const tags: { key: "natural" | "fresh" | "frozen" | "vet"; label: string }[] =
    [
      {
        key: "natural",
        label:
          locale === "ar"
            ? t("reports.naturalBreeding")
            : t("reports.naturalBreeding"),
      },
      {
        key: "fresh",
        label:
          locale === "ar" ? t("reports.freshSemen") : t("reports.freshSemen"),
      },
      {
        key: "frozen",
        label:
          locale === "ar" ? t("reports.frozenSemen") : t("reports.frozenSemen"),
      },
      {
        key: "vet",
        label: locale === "ar" ? t("reports.vetCheck") : t("reports.vetCheck"),
      },
    ];

  const [activeTag, setActiveTag] = useState<
    "natural" | "fresh" | "frozen" | "vet"
  >("natural");
  const activeType = tagToType(activeTag);

  const [itemsByType, setItemsByType] = useState(dummyByType);

  const [toDelete, setToDelete] = useState<RecordItem | null>(null);
  const [confirmingMultiple, setConfirmingMultiple] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [editingRow, setEditingRow] = useState<RecordItem | null>(null);

  const currentItems = itemsByType[activeType];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return currentItems;
    return currentItems.filter(
      (it) =>
        it.horse.toLowerCase().includes(q) ||
        (it.location || "").toLowerCase().includes(q) ||
        (it.results || "").toLowerCase().includes(q) ||
        (it.price || "").toLowerCase().includes(q),
    );
  }, [currentItems, query]);

  function toggleSelect(id: string) {
    setSelectedIds((cur) =>
      cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id],
    );
  }

  function toggleSelectAll() {
    if (selectedIds.length === filtered.length) setSelectedIds([]);
    else setSelectedIds(filtered.map((r) => r.id));
  }

  function handleTagChange(tagKey: "natural" | "fresh" | "frozen" | "vet") {
    setActiveTag(tagKey);
    setSelectedIds([]);
    setToDelete(null);
    setConfirmingMultiple(false);
    setQuery("");
  }

  function confirmDeleteSingle() {
    if (!toDelete) return;
    setItemsByType((cur) => ({
      ...cur,
      [activeType]: cur[activeType].filter((i) => i.id !== toDelete.id),
    }));
    setSelectedIds((cur) => cur.filter((id) => id !== toDelete.id));
    setToDelete(null);
  }

  function confirmDeleteMultiple() {
    if (selectedIds.length === 0) {
      setConfirmingMultiple(false);
      return;
    }
    setItemsByType((cur) => ({
      ...cur,
      [activeType]: cur[activeType].filter((i) => !selectedIds.includes(i.id)),
    }));
    setSelectedIds([]);
    setConfirmingMultiple(false);
  }

  function handleAddClick() {
    setFormMode("add");
    setEditingRow(null);
    setFormOpen(true);
  }

  function handleEdit(row: RecordItem) {
    setFormMode("edit");
    setEditingRow(row);
    setFormOpen(true);
  }

  function handleFormSubmit(data: Partial<RecordItem>) {
    if (formMode === "add") {
      const newItem: RecordItem = {
        id: `${activeType}-${Date.now()}`,
        horse: data.horse || (locale === "ar" ? "فرس جديد" : "New Horse"),
        dob: data.dob || "",
        results: (data as any).results || "",
        location: data.location || "",
        price: data.price || "",
      };

      setItemsByType((cur) => ({
        ...cur,
        [activeType]: [newItem, ...cur[activeType]],
      }));
    } else if (formMode === "edit" && editingRow) {
      setItemsByType((cur) => ({
        ...cur,
        [activeType]: cur[activeType].map((r) =>
          r.id === editingRow.id ? { ...r, ...data } : r,
        ),
      }));
    }

    setFormOpen(false);
    setEditingRow(null);
  }

  const modalOpen = !!toDelete || confirmingMultiple;
  const modalTitle = toDelete
    ? t("common.deleteRecord")
    : t("common.deleteSelected");
  const modalDesc = toDelete
    ? t("common.deleteRecordMsg")
    : t("common.deleteSelectedMsg");

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      <div className="w-full max-w-full">
        <StallionProfileCard
          locale={locale}
          direction={direction}
          query={query}
          onQueryChange={setQuery}
          horseId={initialHorseId}
          horseName={initialHorseName}
        />

        <StallionToolbar
          locale={locale}
          direction={direction}
          tags={tags.map((x) => x.label)}
          activeTag={
            tags.find((x) => x.key === activeTag)?.label ?? tags[0].label
          }
          selectedCount={selectedIds.length}
          onAdd={handleAddClick}
          onDeleteSelected={() => setConfirmingMultiple(true)}
          onTagChange={(label) => {
            const found = tags.find((x) => x.label === label);
            if (found) handleTagChange(found.key);
          }}
        />

        <ReproductionRecordsTable
          locale={locale}
          direction={direction}
          rows={filtered}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
          onEdit={handleEdit}
          onDelete={(row) => setToDelete(row)}
        />
      </div>

      <DeleteConfirmModal
        open={modalOpen}
        title={modalTitle}
        description={modalDesc}
        onCancel={() => {
          setToDelete(null);
          setConfirmingMultiple(false);
        }}
        onConfirm={() => {
          if (toDelete) confirmDeleteSingle();
          else confirmDeleteMultiple();
        }}
      />

      {activeType === "natural" && (
        <NaturalModal
          open={formOpen}
          mode={formMode}
          initialData={editingRow || undefined}
          onClose={() => setFormOpen(false)}
          onSubmit={handleFormSubmit}
        />
      )}
      {activeType === "fresh" && (
        <FreshModal
          open={formOpen}
          mode={formMode}
          initialData={editingRow || undefined}
          onClose={() => setFormOpen(false)}
          onSubmit={handleFormSubmit}
        />
      )}
      {activeType === "frozen" && (
        <FrozenModal
          open={formOpen}
          mode={formMode}
          initialData={editingRow || undefined}
          onClose={() => setFormOpen(false)}
          onSubmit={handleFormSubmit}
        />
      )}
      {activeType === "vet" && (
        <VetModal
          open={formOpen}
          mode={formMode}
          initialData={editingRow || undefined}
          onClose={() => setFormOpen(false)}
          onSubmit={handleFormSubmit}
        />
      )}
    </div>
  );
}
