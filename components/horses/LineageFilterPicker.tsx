"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import type { LineageNameDto, LocaleCode } from "@/lib/api/types";
import { useBodyScrollLock } from "@/components/common/useBodyScrollLock";
import { useLocale, useTranslation } from "@/lib/locale-context";

interface LineageFilterPickerProps {
  value: string;
  options: LineageNameDto[];
  placeholder: string;
  searchPlaceholder: string;
  emptyText: string;
  loading?: boolean;
  onChange: (value: string) => void;
}

export function LineageFilterPicker({
  value,
  options,
  placeholder,
  searchPlaceholder,
  emptyText,
  loading = false,
  onChange,
}: LineageFilterPickerProps) {
  const { locale, direction } = useLocale();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  useBodyScrollLock(open);

  const label = (option: LineageNameDto) =>
    locale === "ar"
      ? option.arabicName || option.englishName
      : option.englishName || option.arabicName;

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase(locale as LocaleCode);
    if (!query) return options;
    return options.filter((option) =>
      [option.englishName, option.arabicName].some((name) =>
        name?.toLocaleLowerCase(locale as LocaleCode).includes(query),
      ),
    );
  }, [locale, options, search]);

  function close() {
    setOpen(false);
    setSearch("");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-11 w-full items-center justify-between gap-2 rounded-2xl border border-[#eadfd7] bg-[#fffdfb] px-4 text-sm font-medium text-[#2c2330] outline-none transition hover:border-[#cdb9aa] focus:border-[#5a3b25] focus:ring-2 focus:ring-[#5a3b25]/10"
      >
        <span className="truncate">{value || placeholder}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-[#806e61]" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[160] flex items-center justify-center bg-black/45 p-4"
          dir={direction}
          onMouseDown={(event) => event.target === event.currentTarget && close()}
        >
          <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h3 className="text-xl font-bold text-[#3b2b20]">{placeholder}</h3>
              <button type="button" onClick={close} className="rounded-full p-2 hover:bg-gray-100" aria-label={t("common.cancel")}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="border-b p-4">
              <div className="relative">
                <Search className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 ${direction === "rtl" ? "right-4" : "left-4"}`} />
                <input
                  autoFocus
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={searchPlaceholder}
                  className={`w-full rounded-xl border bg-[#fdfbf9] py-3 outline-none focus:border-[#8b6f59] ${direction === "rtl" ? "pl-4 pr-11" : "pl-11 pr-4"}`}
                />
              </div>
            </div>
            <div className="max-h-[360px] overflow-y-auto p-3">
              <OptionButton label={t("common.all")} selected={!value} onClick={() => { onChange(""); close(); }} />
              {loading ? (
                <div className="py-10 text-center text-sm text-gray-500">{t("common.loading")}</div>
              ) : filtered.length ? (
                filtered.map((option) => {
                  const optionLabel = label(option);
                  return (
                    <OptionButton
                      key={`${option.englishName}-${option.arabicName}`}
                      label={optionLabel}
                      selected={value === optionLabel}
                      onClick={() => { onChange(optionLabel); close(); }}
                    />
                  );
                })
              ) : (
                <div className="py-10 text-center text-sm text-gray-500">{emptyText}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function OptionButton({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-start ${selected ? "bg-[#f2ece7] text-[#4b2f1a]" : "hover:bg-gray-50"}`}>
      <span className="font-medium">{label}</span>
      {selected && <Check className="h-5 w-5" />}
    </button>
  );
}
