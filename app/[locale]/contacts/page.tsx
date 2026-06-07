"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import DeleteConfirmModal from "@/components/common/DeleteConfirmModal";
import { FormModal } from "@/components/common/FormModal";
import {
  fetchContactGroups,
  fetchContacts,
  removeContact,
  saveContact,
} from "@/lib/api/management-client";
import { isClientApiNotFound } from "@/lib/api/client";
import type {
  ContactDto,
  ContactGroupDto,
  ContactPayload,
  LocaleCode,
} from "@/lib/api/types";
import { useLocale, useTranslation } from "@/lib/locale-context";
import {
  ChevronLeft,
  ChevronRight,
  Edit,
  PlusCircle,
  Search,
  Trash2,
} from "lucide-react";

const PAGE_SIZE = 20;
const emptyForm: ContactPayload = { name: "", email: "", phone: "", groupId: 0 };

export default function ContactsPage() {
  const { locale, direction } = useLocale();
  const { t } = useTranslation();
  const isRTL = direction === "rtl";
  const localeCode = locale as LocaleCode;
  const [groups, setGroups] = useState<ContactGroupDto[]>([]);
  const [contacts, setContacts] = useState<ContactDto[]>([]);
  const [activeGroup, setActiveGroup] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [groupsReady, setGroupsReady] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactDto | null>(null);
  const [form, setForm] = useState<ContactPayload>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<ContactDto | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setCurrentPage(1);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    let active = true;

    async function loadGroups() {
      setError("");
      try {
        const result = await fetchContactGroups(localeCode);
        if (!active) return;
        setGroups(result.data ?? []);
        setGroupsReady(true);
      } catch (requestError) {
        if (!active) return;
        if (isClientApiNotFound(requestError)) {
          setGroups([]);
          setGroupsReady(true);
          setError("");
          return;
        }
        setError(requestError instanceof Error ? requestError.message : t("common.error"));
        setLoading(false);
      }
    }

    loadGroups();
    return () => {
      active = false;
    };
  }, [localeCode, t]);

  const loadContacts = useCallback(async () => {
    if (!groupsReady) return;
    setLoading(true);
    setError("");

    try {
      const result = await fetchContacts(localeCode, {
        pageNumber: currentPage,
        pageSize: PAGE_SIZE,
        groupId: activeGroup ?? undefined,
        search: debouncedSearch || undefined,
      });
      setContacts(result.data ?? []);
      setTotalPages(result.totalPages ?? 0);
    } catch (requestError) {
      if (isClientApiNotFound(requestError)) {
        setContacts([]);
        setTotalPages(0);
        setError("");
        return;
      }
      setError(requestError instanceof Error ? requestError.message : t("common.error"));
    } finally {
      setLoading(false);
    }
  }, [activeGroup, currentPage, debouncedSearch, groupsReady, localeCode, t]);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  const groupName = useCallback(
    (group: ContactGroupDto) => (isRTL ? group.arabicName : group.englishName),
    [isRTL],
  );

  const visiblePages = useMemo(() => {
    const start = Math.max(1, Math.min(currentPage - 1, totalPages - 2));
    return Array.from({ length: Math.min(3, totalPages) }, (_, index) => start + index);
  }, [currentPage, totalPages]);

  function openCreate() {
    setEditingContact(null);
    setForm({ ...emptyForm, groupId: groups[0]?.id ?? 0 });
    setFormOpen(true);
  }

  function openEdit(contact: ContactDto) {
    setEditingContact(contact);
    setForm({
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      groupId: contact.groupId,
    });
    setFormOpen(true);
  }

  async function submitContact(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name.trim() || !form.groupId) return;

    setSaving(true);
    setError("");
    try {
      await saveContact(localeCode, form, editingContact?.id);
      setFormOpen(false);
      await loadContacts();
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
      await removeContact(localeCode, deleteTarget.id);
      setDeleteTarget(null);
      await loadContacts();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t("common.error"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <MainLayout>
      <div className={`p-3 sm:p-6 max-w-[1400px] mx-auto ${isRTL ? "text-right font-cairo" : "text-left"}`} dir={direction}>
        <header className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <h1 className="text-[2.1rem] font-bold text-[#27304a]">{t("contacts.title")}</h1>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-[24rem]">
              <Search className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 text-[#5a473d] ${isRTL ? "right-4" : "left-4"}`} />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={t("common.search")}
                className={`h-11 w-full rounded-2xl border border-[#ece2da] bg-white text-sm outline-none focus:border-[#5a3b25] ${isRTL ? "pr-12" : "pl-12"}`}
              />
            </div>
            <button
              onClick={openCreate}
              disabled={!groups.length}
              className="flex items-center justify-center gap-2 rounded-[18px] bg-[#4b2f1a] px-6 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <PlusCircle className="h-5 w-5" />
              {t("contacts.addNew")}
            </button>
          </div>
        </header>

        {error && <div className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <section className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => { setActiveGroup(null); setCurrentPage(1); }}
              className={`rounded-xl px-6 py-2 font-bold ${activeGroup === null ? "bg-[#4b2f1a] text-white" : "bg-white text-[#5a473d]"}`}
            >
              {t("contacts.all")}
            </button>
            {groups.map((group) => (
              <button
                key={group.id}
                onClick={() => { setActiveGroup(group.id); setCurrentPage(1); }}
                className={`rounded-xl px-6 py-2 font-bold ${activeGroup === group.id ? "bg-[#4b2f1a] text-white" : "bg-white text-[#5a473d]"}`}
              >
                {groupName(group)}
              </button>
            ))}
          </div>

          <div className="overflow-hidden rounded-[24px] bg-white shadow-[0_12px_26px_rgba(91,53,24,0.08)]">
            <div className="overflow-x-auto">
              <table className={`w-full border-collapse ${isRTL ? "text-right" : "text-left"}`}>
                <thead className="bg-[#4b2f1a] text-white">
                  <tr>
                    <th className="px-6 py-5">{t("contacts.name")}</th>
                    <th className="px-6 py-5">{t("contacts.group")}</th>
                    <th className="px-6 py-5">{t("contacts.phone")}</th>
                    <th className="px-6 py-5">{t("contacts.account")}</th>
                    <th className="px-6 py-5 text-center">{t("common.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((contact, index) => (
                    <tr key={contact.id} className={`border-b border-[#e9edf5] ${index % 2 ? "bg-[#fdfbf7]" : "bg-white"}`}>
                      <td className="px-6 py-5 font-medium">{contact.name}</td>
                      <td className="px-6 py-5">
                        <span className="rounded-lg bg-[#f3ece7] px-3 py-1 text-sm font-bold text-[#4b2f1a]">
                          {isRTL ? contact.groupArabicName : contact.groupEnglishName}
                        </span>
                      </td>
                      <td className="px-6 py-5">{contact.phone || "-"}</td>
                      <td className="px-6 py-5">{contact.email || "-"}</td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-center gap-3">
                          <button onClick={() => openEdit(contact)} aria-label={t("common.edit")} className="p-1.5 text-[#4b2f1a]">
                            <Edit className="h-5 w-5" />
                          </button>
                          <button onClick={() => setDeleteTarget(contact)} aria-label={t("common.delete")} className="p-1.5 text-red-600">
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!loading && !contacts.length && (
                    <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-500">{t("common.noRecordsFound")}</td></tr>
                  )}
                  {loading && (
                    <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-500">{t("common.loading")}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 py-4">
              <button disabled={currentPage <= 1} onClick={() => setCurrentPage((page) => page - 1)} className="flex h-10 w-10 items-center justify-center rounded-xl border disabled:opacity-40">
                {isRTL ? <ChevronRight /> : <ChevronLeft />}
              </button>
              {visiblePages.map((page) => (
                <button key={page} onClick={() => setCurrentPage(page)} className={`h-10 w-10 rounded-xl font-bold ${currentPage === page ? "bg-[#4b2f1a] text-white" : "border text-[#5a473d]"}`}>{page}</button>
              ))}
              <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage((page) => page + 1)} className="flex h-10 w-10 items-center justify-center rounded-xl border disabled:opacity-40">
                {isRTL ? <ChevronLeft /> : <ChevronRight />}
              </button>
            </div>
          )}
        </section>
      </div>

      <FormModal
        isOpen={formOpen}
        title={editingContact ? t("contacts.editContact") : t("contacts.addNew")}
        onClose={() => setFormOpen(false)}
        onSubmit={submitContact}
        submitText={t("common.save")}
        cancelText={t("common.cancel")}
        isLoading={saving}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder={t("contacts.name")} className="rounded-xl border px-4 py-3" />
          <select required value={form.groupId || ""} onChange={(event) => setForm({ ...form, groupId: Number(event.target.value) })} className="rounded-xl border px-4 py-3">
            <option value="" disabled>{t("contacts.selectGroup")}</option>
            {groups.map((group) => <option key={group.id} value={group.id}>{groupName(group)}</option>)}
          </select>
          <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder={t("contacts.phone")} className="rounded-xl border px-4 py-3" />
          <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder={t("contacts.email")} className="rounded-xl border px-4 py-3" />
        </div>
      </FormModal>

      <DeleteConfirmModal
        open={Boolean(deleteTarget)}
        title={t("contacts.deleteContact")}
        description={deleteTarget?.name}
        onCancel={() => !saving && setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </MainLayout>
  );
}
