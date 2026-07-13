"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { GitBranch, Pencil, Plus, Save, Tag, Trash2, X } from "lucide-react";
import { clientApiFetch } from "@/lib/api/client";
import type { ApiResult, HorseTagDto, LocaleCode } from "@/lib/api/types";
import { useLocale } from "@/lib/locale-context";

interface HorseTagsPanelProps {
  horseId: string | number;
  tags?: HorseTagDto[] | null;
  onChange: (tags: HorseTagDto[]) => void;
}

function normalize(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export function HorseTagsPanel({ horseId, tags = [], onChange }: HorseTagsPanelProps) {
  const { locale, direction, t } = useLocale();
  const isRTL = direction === "rtl";
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const list = tags ?? [];
  const directTags = list.filter((tag) => !tag.isInherited);
  const inheritedTags = list.filter((tag) => tag.isInherited);
  const canAdd = inheritedTags.length === 0;

  const directNames = useMemo(
    () => new Set(directTags.map((tag) => normalize(tag.name))),
    [directTags],
  );

  const sourceName = (tag: HorseTagDto) => {
    const en = tag.sourceHorseEnglishName?.trim();
    const ar = tag.sourceHorseArabicName?.trim();
    return locale === "ar" ? ar || en || "" : en || ar || "";
  };
  const sectionTitle = canAdd
    ? t("horses.directTag")
    : t("horses.inheritedFrom");

  async function saveTag(method: "POST" | "PUT" | "DELETE", tagId?: number, nextName?: string) {
    setSaving(true);
    setError("");

    try {
      const result = await clientApiFetch<ApiResult<HorseTagDto[]>>({
        method,
        backendPath: tagId ? `/api/Horses/${horseId}/tags/${tagId}` : `/api/Horses/${horseId}/tags`,
        nextPath: tagId ? `/api/horses/${horseId}/tags/${tagId}` : `/api/horses/${horseId}/tags`,
        nextQuery: { locale },
        locale: locale as LocaleCode,
        body: method === "DELETE" ? undefined : { name: nextName },
      });

      if (result.succeeded === false) throw new Error(result.message || t("common.error"));
      onChange(result.data ?? []);
      setName("");
      setEditingId(null);
      setEditingName("");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t("common.error"));
    } finally {
      setSaving(false);
    }
  }

  function handleAdd(event: FormEvent) {
    event.preventDefault();
    const cleaned = name.trim().replace(/\s+/g, " ");

    if (!cleaned) {
      setError(t("horses.tagRequired"));
      return;
    }

    if (directNames.has(normalize(cleaned))) {
      setError(t("horses.tagDuplicate"));
      return;
    }

    saveTag("POST", undefined, cleaned);
  }

  function handleEdit(tag: HorseTagDto) {
    setError("");
    setEditingId(tag.id);
    setEditingName(tag.name);
  }

  function handleUpdate(tag: HorseTagDto) {
    const cleaned = editingName.trim().replace(/\s+/g, " ");

    if (!cleaned) {
      setError(t("horses.tagRequired"));
      return;
    }

    const duplicate = directTags.some(
      (item) => item.id !== tag.id && normalize(item.name) === normalize(cleaned),
    );

    if (duplicate) {
      setError(t("horses.tagDuplicate"));
      return;
    }

    saveTag("PUT", tag.id, cleaned);
  }

  return (
    <section className={`mb-8 overflow-hidden rounded-[18px] border border-[#e8dbcf] bg-[#fffdfa] shadow-sm ${isRTL ? "text-right" : "text-left"}`}>
      <div className="border-b border-[#eee3d9] bg-[#fbf6ef] px-5 py-4">
        <div>
          <div className="flex items-center gap-2 text-[#3d2a1b]">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-[#6f4127] shadow-sm">
              <Tag className="h-4 w-4" />
            </span>
            <h2 className="text-lg font-bold">{t("horses.familyTags")}</h2>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#7a6c63]">{t("horses.familyTagsHint")}</p>
        </div>
      </div>

      <div className="px-5 py-4">
      <div className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-wide text-[#8b7463]">
        <GitBranch className="h-4 w-4" />
        <span>{sectionTitle}</span>
      </div>

      <div className="mb-4 flex flex-wrap gap-2.5">
        {list.length ? list.map((tag) => (
          <div
            key={`${tag.id}-${tag.sourceHorseId}-${tag.isInherited ? "inherited" : "direct"}`}
            className={`group flex min-h-11 items-center gap-2 rounded-full border px-3 py-2 text-sm shadow-[0_1px_0_rgba(45,30,20,0.04)] transition ${
              tag.isInherited
                ? "border-[#bcdac6] bg-[#eef8f1] text-[#245338]"
                : "border-[#e6c9ad] bg-[#fff3e2] text-[#63391f]"
            }`}
          >
            {editingId === tag.id && !tag.isInherited ? (
              <>
                <input
                  value={editingName}
                  onChange={(event) => setEditingName(event.target.value)}
                  maxLength={80}
                  className="h-8 min-w-0 rounded-lg border border-[#d9c9bd] bg-white px-2 text-sm text-[#2a2a2a] outline-none focus:border-[#3d2a1b]"
                  disabled={saving}
                />
                <button type="button" onClick={() => handleUpdate(tag)} disabled={saving} className="rounded-lg p-1.5 hover:bg-white">
                  <Save className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => setEditingId(null)} disabled={saving} className="rounded-lg p-1.5 hover:bg-white">
                  <X className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <span className={`grid h-6 w-6 place-items-center rounded-full ${
                  tag.isInherited ? "bg-[#d8eddf] text-[#245338]" : "bg-[#f2d8bb] text-[#63391f]"
                }`}>
                  <Tag className="h-3.5 w-3.5" />
                </span>
                <span className="font-black">{tag.name}</span>
                {tag.isInherited ? (
                  <Link
                    href={`/${locale}/horses/${tag.sourceHorseId}`}
                    className="max-w-[190px] truncate rounded-full bg-white/70 px-2 py-1 text-xs font-bold text-[#4d735d] underline-offset-2 hover:underline"
                    title={sourceName(tag)}
                  >
                    {t("horses.inheritedFrom")} {sourceName(tag)}
                  </Link>
                ) : (
                  <span className="rounded-full bg-white/70 px-2 py-1 text-xs font-bold text-[#9a6f4e]">
                    {t("horses.directTag")}
                  </span>
                )}
                {!tag.isInherited ? (
                  <span className="flex items-center gap-1">
                    <button type="button" onClick={() => handleEdit(tag)} disabled={saving} className="rounded-full p-1.5 hover:bg-white">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => saveTag("DELETE", tag.id)} disabled={saving} className="rounded-full p-1.5 text-[#a6423a] hover:bg-white">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </span>
                ) : null}
              </>
            )}
          </div>
        )) : (
          <span className="rounded-xl border border-dashed border-[#d9c9bd] px-3 py-2 text-sm text-[#8b7a6e]">
            {t("horses.noTags")}
          </span>
        )}
      </div>

      <form onSubmit={handleAdd} className="flex flex-col gap-3 sm:flex-row">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={80}
          disabled={!canAdd || saving}
          placeholder={canAdd ? t("horses.tagPlaceholder") : t("horses.inheritedTagBlocksAdd")}
          className="h-11 min-w-0 flex-1 rounded-xl border border-[#d9c9bd] bg-[#fdfbf7] px-3 text-sm text-[#2a2a2a] outline-none transition focus:border-[#3d2a1b] disabled:cursor-not-allowed disabled:bg-[#f1ece7] disabled:text-[#9a8f86]"
        />
        <button
          type="submit"
          disabled={!canAdd || saving}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#3d2a1b] px-4 text-sm font-bold text-white transition hover:bg-[#2c1f14] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Plus className="h-4 w-4" />
          {saving ? t("common.loading") : t("horses.addTag")}
        </button>
      </form>

      {error ? (
        <div className="mt-3 rounded-xl border border-[#f2c7c7] bg-[#fff3f3] px-3 py-2 text-sm text-[#b04444]">
          {error}
        </div>
      ) : null}
      </div>
    </section>
  );
}
