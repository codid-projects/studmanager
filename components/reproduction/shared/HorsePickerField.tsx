"use client";

import { useCallback, useState } from "react";
import { Search, X } from "lucide-react";
import type { HorseListItemDto, LocaleCode } from "@/lib/api/types";
import { BreedingHorsePickerModal } from "./BreedingHorsePickerModal";

export function HorsePickerField({
  locale,
  gender,
  name,
  selected,
  onSelect,
  required = false,
  excludeHorseIds = [],
}: {
  locale: LocaleCode;
  gender: "Female" | "Male";
  name: string;
  selected: HorseListItemDto | null;
  onSelect: (horse: HorseListItemDto | null) => void;
  required?: boolean;
  excludeHorseIds?: number[];
}) {
  const ar = locale === "ar";
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const id = selected ? (selected.localId ?? selected.id) : "";
  const selectedName = selected
    ? ar
      ? selected.arabicName || selected.englishName
      : selected.englishName || selected.arabicName
    : "";
  const placeholder = ar
    ? `اختر ${gender === "Female" ? "الفرس" : "الفحل"}`
    : `Select ${gender === "Female" ? "mare" : "stallion"}`;

  return (
    <>
      <input type="hidden" name={name} value={id} />
      <div
        className={`flex h-11 w-full overflow-hidden rounded-[8px] border bg-white transition focus-within:ring-4 focus-within:ring-[#4b2d1c]/10 ${required && !selected ? "border-[#c7b9b0]" : "border-[#d7d0ca]"}`}
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex min-w-0 flex-1 items-center gap-2 px-3 text-start text-[11px] text-[#3b302a] hover:bg-[#fbf6f2]"
        >
          <Search className="h-4 w-4 shrink-0 text-[#735b4c]" />
          <span
            className={`truncate ${selected ? "font-semibold" : "text-[#8e827b]"}`}
          >
            {selectedName || placeholder}
          </span>
        </button>
        {selected && !required && (
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="grid w-10 shrink-0 place-items-center border-s border-[#e6ddd7] text-[#8b776b] hover:bg-red-50 hover:text-red-600"
            aria-label={ar ? "مسح الاختيار" : "Clear selection"}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <BreedingHorsePickerModal
        open={open}
        locale={locale}
        gender={gender}
        excludeHorseIds={excludeHorseIds}
        onClose={close}
        onSelect={onSelect}
      />
    </>
  );
}
