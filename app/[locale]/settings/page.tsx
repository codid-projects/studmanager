"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Edit2, Plus, Search, Trash2 } from "lucide-react";
import DeleteConfirmModal from "@/components/common/DeleteConfirmModal";
import { MainLayout } from "@/components/layout/MainLayout";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { SettingsTable } from "@/components/settings/SettingsTable";
import {
  isIntegratedSetting,
  SettingsTabs,
  type SettingCategory,
} from "@/components/settings/SettingsTabs";
import { isClientApiNotFound } from "@/lib/api/client";
import {
  fetchContactGroups,
  fetchSupplements,
  removeContactGroup,
  removeSupplement,
  saveContactGroup,
  saveSupplement,
} from "@/lib/api/management-client";
import type {
  ContactGroupDto,
  ContactGroupPayload,
  LocaleCode,
  SupplementDto,
  SupplementPayload,
} from "@/lib/api/types";
import { useLocale, useTranslation } from "@/lib/locale-context";

const emptyGroup: ContactGroupPayload = {
  englishName: "",
  arabicName: "",
};

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
  const [activeTab, setActiveTab] = useState<SettingCategory>("contactGroups");
  const [groups, setGroups] = useState<ContactGroupDto[]>([]);
  const [supplements, setSupplements] = useState<SupplementDto[]>([]);
  const [groupForm, setGroupForm] = useState<ContactGroupPayload>(emptyGroup);
  const [supplementForm, setSupplementForm] = useState<SupplementPayload>(emptySupplement);
  const [editingGroup, setEditingGroup] = useState<ContactGroupDto | null>(null);
  const [editingSupplement, setEditingSupplement] = useState<SupplementDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    kind: "contactGroups" | "supplements";
    id: number;
    name: string;
  } | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadActiveTab = useCallback(async () => {
    if (!isIntegratedSetting(activeTab)) {
      setLoading(false);
      return;
    }

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

  function changeTab(tab: SettingCategory) {
    setActiveTab(tab);
    setSearch("");
    setError("");
    resetForms();
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

  const normalizedSearch = search.trim().toLowerCase();
  const filteredGroups = useMemo(
    () =>
      groups.filter((group) =>
        [group.englishName, group.arabicName].some((value) =>
          value.toLowerCase().includes(normalizedSearch),
        ),
      ),
    [groups, normalizedSearch],
  );
  const filteredSupplements = useMemo(
    () =>
      supplements.filter((supplement) =>
        [
          supplement.englishName,
          supplement.arabicName,
          supplement.description,
          supplement.type,
        ].some((value) => String(value ?? "").toLowerCase().includes(normalizedSearch)),
      ),
    [supplements, normalizedSearch],
  );

  const integrated = isIntegratedSetting(activeTab);

  return (
    <MainLayout>
      <div
        className={`flex flex-col gap-6 p-4 sm:p-6 lg:p-8 ${isRTL ? "font-cairo" : ""}`}
        dir={direction}
      >
        <h1 className="text-2xl font-bold text-[#20203C]">{t("settings.title")}</h1>

        <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
          <div className="flex min-h-[400px] flex-col lg:flex-row">
            <SettingsTabs activeTab={activeTab} onTabChange={changeTab} />

            <div className="min-w-0 flex-1">
              {activeTab === "contactGroups" && (
                <form onSubmit={submitGroup} className="grid gap-4 p-6 md:grid-cols-2">
                  <SettingsInput
                    value={groupForm.englishName}
                    onChange={(value) => setGroupForm({ ...groupForm, englishName: value })}
                    placeholder={t("settings.englishName")}
                  />
                  <SettingsInput
                    value={groupForm.arabicName}
                    onChange={(value) => setGroupForm({ ...groupForm, arabicName: value })}
                    placeholder={t("settings.arabicName")}
                  />
                  <FormActions
                    saving={saving}
                    editing={Boolean(editingGroup)}
                    onCancel={resetForms}
                  />
                </form>
              )}

              {activeTab === "supplements" && (
                <form onSubmit={submitSupplement} className="grid gap-4 p-6 md:grid-cols-2">
                  <SettingsInput
                    value={supplementForm.englishName}
                    onChange={(value) =>
                      setSupplementForm({ ...supplementForm, englishName: value })
                    }
                    placeholder={t("settings.englishName")}
                  />
                  <SettingsInput
                    value={supplementForm.arabicName}
                    onChange={(value) =>
                      setSupplementForm({ ...supplementForm, arabicName: value })
                    }
                    placeholder={t("settings.arabicName")}
                  />
                  <textarea
                    value={supplementForm.description}
                    onChange={(event) =>
                      setSupplementForm({
                        ...supplementForm,
                        description: event.target.value,
                      })
                    }
                    placeholder={t("settings.description")}
                    className="rounded-xl border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-[#4B2F1A] md:col-span-2"
                  />
                  <input
                    required
                    min={1}
                    type="number"
                    value={supplementForm.type}
                    onChange={(event) =>
                      setSupplementForm({
                        ...supplementForm,
                        type: Number(event.target.value),
                      })
                    }
                    placeholder={t("settings.type")}
                    className="rounded-xl border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-[#4B2F1A]"
                  />
                  <FormActions
                    saving={saving}
                    editing={Boolean(editingSupplement)}
                    onCancel={resetForms}
                  />
                </form>
              )}

              {!integrated && (
                <SettingsForm activeTab={activeTab} />
              )}
            </div>
          </div>
        </div>

        {error && integrated && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div>
          <div className="relative mb-6 w-full sm:w-80">
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("common.search")}
              className={`w-full rounded-2xl border border-gray-200 py-3 shadow-sm outline-none focus:ring-2 focus:ring-[#4B2F1A] ${
                isRTL ? "pl-4 pr-12 text-right" : "pl-12 pr-4 text-left"
              }`}
            />
            <Search
              className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 ${
                isRTL ? "right-4" : "left-4"
              }`}
            />
          </div>

          {activeTab === "contactGroups" && (
            <SettingsDataTable
              headers={[
                t("settings.englishName"),
                t("settings.arabicName"),
                t("settings.defaultGroup"),
              ]}
              loading={loading}
              emptyText={t("common.noRecordsFound")}
              rows={filteredGroups.map((group) => ({
                id: group.id,
                cells: [
                  group.englishName,
                  group.arabicName,
                  group.isDefault ? t("common.success") : "-",
                ],
                onEdit: () => {
                  setEditingGroup(group);
                  setGroupForm({
                    englishName: group.englishName,
                    arabicName: group.arabicName,
                  });
                },
                onDelete: () =>
                  setDeleteTarget({
                    kind: "contactGroups",
                    id: group.id,
                    name: isRTL ? group.arabicName : group.englishName,
                  }),
              }))}
            />
          )}

          {activeTab === "supplements" && (
            <SettingsDataTable
              headers={[
                t("settings.englishName"),
                t("settings.arabicName"),
                t("settings.description"),
                t("settings.type"),
              ]}
              loading={loading}
              emptyText={t("common.noRecordsFound")}
              rows={filteredSupplements.map((supplement) => ({
                id: supplement.id,
                cells: [
                  supplement.englishName,
                  supplement.arabicName,
                  supplement.description || "-",
                  supplement.type,
                ],
                onEdit: () => {
                  setEditingSupplement(supplement);
                  setSupplementForm({
                    englishName: supplement.englishName,
                    arabicName: supplement.arabicName,
                    description: supplement.description ?? "",
                    type: Number(supplement.type) || 1,
                  });
                },
                onDelete: () =>
                  setDeleteTarget({
                    kind: "supplements",
                    id: supplement.id,
                    name: isRTL ? supplement.arabicName : supplement.englishName,
                  }),
              }))}
            />
          )}

          {!integrated && <SettingsTable activeTab={activeTab} />}
        </div>
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

function SettingsInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <input
      required
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="rounded-xl border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-[#4B2F1A]"
    />
  );
}

function FormActions({
  saving,
  editing,
  onCancel,
}: {
  saving: boolean;
  editing: boolean;
  onCancel: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex gap-3 md:col-span-2">
      <button
        disabled={saving}
        className="flex items-center gap-2 rounded-xl bg-[#311C11] px-8 py-3 font-bold text-white disabled:opacity-50"
      >
        <Plus size={18} />
        {editing ? t("common.save") : t("common.add")}
      </button>
      {editing && (
        <button type="button" onClick={onCancel} className="rounded-xl border px-8 py-3">
          {t("common.cancel")}
        </button>
      )}
    </div>
  );
}

function SettingsDataTable({
  headers,
  rows,
  loading,
  emptyText,
}: {
  headers: string[];
  rows: Array<{
    id: number;
    cells: Array<string | number>;
    onEdit: () => void;
    onDelete: () => void;
  }>;
  loading: boolean;
  emptyText: string;
}) {
  const { direction } = useLocale();
  const { t } = useTranslation();
  const isRTL = direction === "rtl";

  return (
    <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-[#3B2B20] text-white">
            <tr>
              {headers.map((header) => (
                <th
                  key={header}
                  className={`px-6 py-4 text-sm font-bold ${
                    isRTL ? "text-right" : "text-left"
                  }`}
                >
                  {header}
                </th>
              ))}
              <th className="px-6 py-4 text-center text-sm font-bold">
                {t("common.actions")}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-gray-100 last:border-0">
                {row.cells.map((cell, index) => (
                  <td
                    key={index}
                    className={`px-6 py-4 text-sm font-medium text-[#20203C] ${
                      isRTL ? "text-right" : "text-left"
                    }`}
                  >
                    {cell}
                  </td>
                ))}
                <td className="px-6 py-4">
                  <div className="flex justify-center gap-3">
                    <button
                      type="button"
                      onClick={row.onDelete}
                      className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                      aria-label={t("common.delete")}
                    >
                      <Trash2 size={18} />
                    </button>
                    <span className="h-6 w-px bg-gray-200" />
                    <button
                      type="button"
                      onClick={row.onEdit}
                      className="rounded-lg p-2 text-[#4B2F1A] hover:bg-gray-50"
                      aria-label={t("common.edit")}
                    >
                      <Edit2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && !rows.length && (
              <tr>
                <td
                  colSpan={headers.length + 1}
                  className="px-6 py-10 text-center text-gray-500"
                >
                  {emptyText}
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td
                  colSpan={headers.length + 1}
                  className="px-6 py-10 text-center text-gray-500"
                >
                  {t("common.loading")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
