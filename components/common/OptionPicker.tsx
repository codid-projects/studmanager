"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, Plus, Search, X } from "lucide-react";
import { useLocale, useTranslation } from "@/lib/locale-context";
import { useBodyScrollLock } from "./useBodyScrollLock";

export interface PickerOption {
  id: number | string;
  label: string;
  subtitle?: string;
}

export interface CreateField {
  key: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  /** "text" (default), "tel", or "select" (needs `options`). */
  type?: "text" | "tel" | "select";
  options?: { value: string; label: string }[];
}

interface OptionPickerProps {
  value: number | string | null;
  options: PickerOption[];
  onChange: (option: PickerOption) => void;
  placeholder: string;
  title: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  /** When provided, an "add new" affordance is shown inside the popup. */
  createLabel?: string;
  createTitle?: string;
  createFields?: CreateField[];
  onCreate?: (values: Record<string, string>) => Promise<PickerOption>;
}

/**
 * Custom popup picker (replaces native <select>) with client-side search and an
 * optional inline "add new" form. RTL/LTR aware. Mirrors the trigger styling of
 * the field inputs and the modal styling of PaginatedPicker.
 */
export function OptionPicker({
  value,
  options,
  onChange,
  placeholder,
  title,
  searchPlaceholder,
  emptyText,
  disabled = false,
  createLabel,
  createTitle,
  createFields,
  onCreate,
}: OptionPickerProps) {
  const { direction } = useLocale();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [createValues, setCreateValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const canCreate = Boolean(onCreate && createFields?.length);

  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) {
      setSearch("");
      setCreating(false);
      setCreateValues({});
      setError("");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [open]);

  const selected = useMemo(
    () => options.find((option) => String(option.id) === String(value ?? "")),
    [options, value],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return options;
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(term) ||
        (option.subtitle?.toLowerCase().includes(term) ?? false),
    );
  }, [options, search]);

  const submitCreate = async () => {
    if (!onCreate || !createFields) return;
    for (const field of createFields) {
      if (field.required && !createValues[field.key]?.trim()) {
        setError(t("common.requiredField") || (direction === "rtl" ? "حقل مطلوب" : "Required field"));
        return;
      }
    }
    setSaving(true);
    setError("");
    try {
      const created = await onCreate(createValues);
      onChange(created);
      setOpen(false);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t("common.requestError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className="flex min-h-[52px] w-full items-center justify-between gap-3 rounded-xl border border-solid border-gray-300 bg-white px-4 py-3.5 text-start outline-none transition-colors hover:border-[#4b2f1a] focus:border-[#4b2f1a] disabled:cursor-not-allowed disabled:bg-gray-100 disabled:hover:border-gray-300 sm:py-4"
      >
        <span className={`truncate ${selected ? "text-gray-700" : "text-gray-400"}`}>
          {selected?.label || placeholder}
        </span>
        <ChevronDown className="h-5 w-5 shrink-0 text-gray-400" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[160] flex items-center justify-center bg-black/45 p-4"
          dir={direction}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div className="flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h3 className="text-xl font-bold text-[#3b2b20]">{creating ? createTitle ?? createLabel ?? title : title}</h3>
              <button type="button" onClick={() => setOpen(false)} className="rounded-full p-2 hover:bg-gray-100" aria-label={t("common.cancel")}>
                <X className="h-5 w-5" />
              </button>
            </div>

            {creating && canCreate ? (
              <div className="flex flex-col gap-3 p-5">
                {createFields!.map((field) => (
                  <label key={field.key} className="flex flex-col gap-1.5 text-sm font-medium text-[#58483e]">
                    <span>{field.label}{field.required ? " *" : ""}</span>
                    {field.type === "select" ? (
                      <select
                        value={createValues[field.key] ?? ""}
                        onChange={(event) => setCreateValues((current) => ({ ...current, [field.key]: event.target.value }))}
                        className="field-input appearance-none"
                      >
                        <option value="" disabled>{field.placeholder ?? field.label}</option>
                        {field.options?.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        autoFocus={field === createFields![0]}
                        value={createValues[field.key] ?? ""}
                        onChange={(event) => setCreateValues((current) => ({ ...current, [field.key]: event.target.value }))}
                        onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); submitCreate(); } }}
                        placeholder={field.placeholder ?? field.label}
                        className="field-input"
                        dir={field.type === "tel" ? "ltr" : undefined}
                      />
                    )}
                  </label>
                ))}
                {error && <p className="text-xs font-medium text-red-600">{error}</p>}
                <div className="mt-1 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={submitCreate}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#3b2b20] px-5 py-2.5 font-bold text-white transition-colors hover:bg-[#2e2119] disabled:opacity-60"
                  >
                    <Check className="h-4 w-4" />
                    {saving ? t("common.loading") : t("common.save")}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setCreating(false); setError(""); }}
                    className="rounded-xl px-5 py-2.5 font-bold text-gray-600 transition-colors hover:bg-gray-100"
                  >
                    {t("common.cancel")}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="border-b p-4">
                  <div className="relative">
                    <Search className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 ${direction === "rtl" ? "right-4" : "left-4"}`} />
                    <input
                      autoFocus
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      onKeyDown={(event) => { if (event.key === "Enter") event.preventDefault(); }}
                      placeholder={searchPlaceholder ?? t("common.search")}
                      className={`w-full rounded-xl border bg-[#fdfbf9] py-3 outline-none focus:border-[#8b6f59] ${direction === "rtl" ? "pl-4 pr-11" : "pl-11 pr-4"}`}
                    />
                  </div>
                </div>

                {canCreate && (
                  <button
                    type="button"
                    onClick={() => { setCreating(true); setError(""); }}
                    className="flex items-center gap-2 border-b px-5 py-3 text-start font-bold text-[#4b2f1a] transition-colors hover:bg-[#f7f1ea]"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f2ece7]">
                      <Plus className="h-4 w-4" />
                    </span>
                    {createLabel}
                  </button>
                )}

                <div className="max-h-[50vh] flex-1 overflow-y-auto overscroll-contain p-3">
                  {!filtered.length ? (
                    <div className="flex flex-col items-center justify-center px-6 py-10 text-center text-gray-500">
                      <Search className="mb-3 h-9 w-9 text-gray-300" />
                      <p>{emptyText ?? t("common.noResults")}</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {filtered.map((option) => {
                        const isSelected = String(option.id) === String(value ?? "");
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => { onChange(option); setOpen(false); }}
                            className={`flex w-full items-center gap-3 rounded-xl p-3 text-start transition-colors ${isSelected ? "bg-[#f2ece7]" : "hover:bg-gray-50"}`}
                          >
                            <span className="min-w-0 flex-1">
                              <span className="block truncate font-semibold text-[#3b2b20]">{option.label}</span>
                              {option.subtitle && <span className="mt-0.5 block truncate text-xs text-gray-500">{option.subtitle}</span>}
                            </span>
                            {isSelected && <Check className="h-5 w-5 shrink-0 text-[#6f513c]" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
