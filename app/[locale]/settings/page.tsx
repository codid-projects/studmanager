"use client";

import { useCallback, useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import DeleteConfirmModal from "@/components/common/DeleteConfirmModal";
import {
  fetchContactGroups,
  fetchSupplements,
  removeContactGroup,
  removeSupplement,
  saveContactGroup,
  saveSupplement,
} from "@/lib/api/management-client";
import { isClientApiNotFound } from "@/lib/api/client";
import type {
  ContactGroupDto,
  ContactGroupPayload,
  LocaleCode,
  SupplementDto,
  SupplementPayload,
} from "@/lib/api/types";
import { useLocale, useTranslation } from "@/lib/locale-context";
import { Edit2, Plus, Trash2 } from "lucide-react";

type SettingsTab = "contactGroups" | "supplements";
const emptyGroup: ContactGroupPayload = { englishName: "", arabicName: "" };
const emptySupplement: SupplementPayload = {
  englishName: "",
  arabicName: "",
  description: "",
  type: 1,
};

export default function SettingsPage() {
  const { locale, direction } = useLocale();
  const { t } = useTranslation();
  const localeCode = locale as LocaleCode;
  const isRTL = direction === "rtl";
  const [activeTab, setActiveTab] = useState<SettingsTab>("contactGroups");
  const [groups, setGroups] = useState<ContactGroupDto[]>([]);
  const [supplements, setSupplements] = useState<SupplementDto[]>([]);
  const [groupForm, setGroupForm] = useState<ContactGroupPayload>(emptyGroup);
  const [supplementForm, setSupplementForm] = useState<SupplementPayload>(emptySupplement);
  const [editingGroup, setEditingGroup] = useState<ContactGroupDto | null>(null);
  const [editingSupplement, setEditingSupplement] = useState<SupplementDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ kind: SettingsTab; id: number; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadActiveTab = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (activeTab === "contactGroups") {
        const result = await fetchContactGroups(localeCode);
        setGroups(result.data ?? []);
      } else {
        const result = await fetchSupplements(localeCode, 1, 100);
        setSupplements(result.data ?? []);
      }
    } catch (requestError) {
      if (isClientApiNotFound(requestError)) {
        if (activeTab === "contactGroups") {
          setGroups([]);
        } else {
          setSupplements([]);
        }
        setError("");
        return;
      }
      setError(requestError instanceof Error ? requestError.message : t("common.error"));
    } finally {
      setLoading(false);
    }
  }, [activeTab, localeCode, t]);

  useEffect(() => {
    loadActiveTab();
  }, [loadActiveTab]);

  function resetForms() {
    setEditingGroup(null);
    setEditingSupplement(null);
    setGroupForm(emptyGroup);
    setSupplementForm(emptySupplement);
  }

  async function submitGroup(event: React.FormEvent) {
    event.preventDefault();
    if (!groupForm.englishName.trim() || !groupForm.arabicName.trim()) return;
    setSaving(true);
    setError("");
    try {
      await saveContactGroup(localeCode, groupForm, editingGroup?.id);
      resetForms();
      await loadActiveTab();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t("common.error"));
    } finally {
      setSaving(false);
    }
  }

  async function submitSupplement(event: React.FormEvent) {
    event.preventDefault();
    if (!supplementForm.englishName.trim() || !supplementForm.arabicName.trim()) return;
    setSaving(true);
    setError("");
    try {
      await saveSupplement(localeCode, supplementForm, editingSupplement?.id);
      resetForms();
      await loadActiveTab();
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
      if (deleteTarget.kind === "contactGroups") {
        await removeContactGroup(localeCode, deleteTarget.id);
      } else {
        await removeSupplement(localeCode, deleteTarget.id);
      }
      setDeleteTarget(null);
      await loadActiveTab();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t("common.error"));
    } finally {
      setSaving(false);
    }
  }

  function editGroup(group: ContactGroupDto) {
    setEditingGroup(group);
    setGroupForm({ englishName: group.englishName, arabicName: group.arabicName });
  }

  function editSupplement(supplement: SupplementDto) {
    setEditingSupplement(supplement);
    const parsedType = Number(supplement.type);
    setSupplementForm({
      englishName: supplement.englishName,
      arabicName: supplement.arabicName,
      description: supplement.description ?? "",
      type: Number.isFinite(parsedType) ? parsedType : 1,
    });
  }

  return (
    <MainLayout>
      <div className={`mx-auto flex max-w-[1400px] flex-col gap-6 p-4 sm:p-6 lg:p-8 ${isRTL ? "font-cairo" : ""}`} dir={direction}>
        <h1 className="text-2xl font-bold text-[#20203C]">{t("settings.title")}</h1>

        <div className="flex flex-wrap gap-3">
          {(["contactGroups", "supplements"] as SettingsTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); resetForms(); }}
              className={`rounded-xl px-6 py-3 font-bold ${activeTab === tab ? "bg-[#4B2F1A] text-white" : "bg-white text-[#4B2F1A]"}`}
            >
              {t(`settings.${tab}`)}
            </button>
          ))}
        </div>

        {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        {activeTab === "contactGroups" ? (
          <>
            <form onSubmit={submitGroup} className="grid gap-4 rounded-3xl bg-white p-6 shadow-sm md:grid-cols-2">
              <input required value={groupForm.englishName} onChange={(event) => setGroupForm({ ...groupForm, englishName: event.target.value })} placeholder={t("settings.englishName")} className="rounded-xl border px-4 py-3" />
              <input required value={groupForm.arabicName} onChange={(event) => setGroupForm({ ...groupForm, arabicName: event.target.value })} placeholder={t("settings.arabicName")} className="rounded-xl border px-4 py-3" />
              <div className="flex gap-3 md:col-span-2">
                <button disabled={saving} className="flex items-center gap-2 rounded-xl bg-[#311C11] px-8 py-3 font-bold text-white disabled:opacity-50">
                  <Plus size={18} /> {editingGroup ? t("common.save") : t("common.add")}
                </button>
                {editingGroup && <button type="button" onClick={resetForms} className="rounded-xl border px-8 py-3">{t("common.cancel")}</button>}
              </div>
            </form>

            <SettingsDataTable
              headers={[t("settings.englishName"), t("settings.arabicName"), t("settings.defaultGroup")]}
              loading={loading}
              emptyText={t("common.noRecordsFound")}
              rows={groups.map((group) => ({
                id: group.id,
                cells: [group.englishName, group.arabicName, group.isDefault ? t("common.success") : "-"],
                onEdit: () => editGroup(group),
                onDelete: () => setDeleteTarget({ kind: "contactGroups", id: group.id, name: isRTL ? group.arabicName : group.englishName }),
              }))}
            />
          </>
        ) : (
          <>
            <form onSubmit={submitSupplement} className="grid gap-4 rounded-3xl bg-white p-6 shadow-sm md:grid-cols-2">
              <input required value={supplementForm.englishName} onChange={(event) => setSupplementForm({ ...supplementForm, englishName: event.target.value })} placeholder={t("settings.englishName")} className="rounded-xl border px-4 py-3" />
              <input required value={supplementForm.arabicName} onChange={(event) => setSupplementForm({ ...supplementForm, arabicName: event.target.value })} placeholder={t("settings.arabicName")} className="rounded-xl border px-4 py-3" />
              <textarea value={supplementForm.description} onChange={(event) => setSupplementForm({ ...supplementForm, description: event.target.value })} placeholder={t("settings.description")} className="rounded-xl border px-4 py-3 md:col-span-2" />
              <input required min={1} type="number" value={supplementForm.type} onChange={(event) => setSupplementForm({ ...supplementForm, type: Number(event.target.value) })} placeholder={t("settings.type")} className="rounded-xl border px-4 py-3" />
              <div className="flex gap-3 md:col-span-2">
                <button disabled={saving} className="flex items-center gap-2 rounded-xl bg-[#311C11] px-8 py-3 font-bold text-white disabled:opacity-50">
                  <Plus size={18} /> {editingSupplement ? t("common.save") : t("common.add")}
                </button>
                {editingSupplement && <button type="button" onClick={resetForms} className="rounded-xl border px-8 py-3">{t("common.cancel")}</button>}
              </div>
            </form>

            <SettingsDataTable
              headers={[t("settings.englishName"), t("settings.arabicName"), t("settings.description"), t("settings.type")]}
              loading={loading}
              emptyText={t("common.noRecordsFound")}
              rows={supplements.map((supplement) => ({
                id: supplement.id,
                cells: [supplement.englishName, supplement.arabicName, supplement.description || "-", supplement.type],
                onEdit: () => editSupplement(supplement),
                onDelete: () => setDeleteTarget({ kind: "supplements", id: supplement.id, name: isRTL ? supplement.arabicName : supplement.englishName }),
              }))}
            />
          </>
        )}
      </div>

      <DeleteConfirmModal
        open={Boolean(deleteTarget)}
        title={t("common.deleteRecord")}
        description={deleteTarget?.name}
        onCancel={() => !saving && setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </MainLayout>
  );
}

function SettingsDataTable({
  headers,
  rows,
  loading,
  emptyText,
}: {
  headers: string[];
  rows: Array<{ id: number; cells: Array<string | number>; onEdit: () => void; onDelete: () => void }>;
  loading: boolean;
  emptyText: string;
}) {
  const { t } = useTranslation();

  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-[#3B2B20] text-white">
            <tr>
              {headers.map((header) => <th key={header} className="px-6 py-4 text-start">{header}</th>)}
              <th className="px-6 py-4 text-center">{t("common.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b">
                {row.cells.map((cell, index) => <td key={index} className="px-6 py-4">{cell}</td>)}
                <td className="px-6 py-4">
                  <div className="flex justify-center gap-3">
                    <button onClick={row.onEdit} className="p-2 text-[#4B2F1A]" aria-label={t("common.edit")}><Edit2 size={18} /></button>
                    <button onClick={row.onDelete} className="p-2 text-red-600" aria-label={t("common.delete")}><Trash2 size={18} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && !rows.length && <tr><td colSpan={headers.length + 1} className="px-6 py-10 text-center text-gray-500">{emptyText}</td></tr>}
            {loading && <tr><td colSpan={headers.length + 1} className="px-6 py-10 text-center text-gray-500">{t("common.loading")}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
