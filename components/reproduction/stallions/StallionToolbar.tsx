"use client";

import type { FC } from "react";
import { useLocale } from "@/lib/locale-context";
import { Plus, Trash2 } from "lucide-react";

type Props = {
  locale: string;
  direction: "rtl" | "ltr";
  tags: string[];
  activeTag: string;
  selectedCount: number;
  onAdd: () => void;
  onDeleteSelected: () => void;
  onTagChange: (tag: string) => void;
};

export const StallionToolbar: FC<Props> = ({
  direction,
  tags,
  activeTag,
  selectedCount,
  onAdd,
  onDeleteSelected,
  onTagChange,
}) => {
  const { t } = useLocale();
  const isRTL = direction === "rtl";

  return (
    <div className="mt-5 w-full max-w-full space-y-4 overflow-x-hidden">
      <div
        className={`flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${
          isRTL ? "sm:flex-row-reverse" : ""
        }`}
      >
        <div
          className="flex min-w-0 gap-2 overflow-x-auto rounded-[16px] bg-[#eee6e0] p-1.5"
        >
          {tags.map((b) => (
            <button
              key={b}
              onClick={() => onTagChange(b)}
              className={`h-10 shrink-0 rounded-xl px-4 text-sm font-semibold transition ${
                activeTag === b
                  ? "bg-white text-[#4b2f1a] shadow-[0_5px_14px_rgba(75,47,26,0.1)]"
                  : "text-[#807168] hover:text-[#4b2f1a]"
              }`}
            >
              {b}
            </button>
          ))}
        </div>

        <div className="flex shrink-0 gap-2">
          <button
            disabled={selectedCount === 0}
            onClick={onDeleteSelected}
            className={`flex h-11 items-center justify-center gap-2 rounded-[13px] px-4 text-sm font-bold transition ${
              selectedCount === 0
                ? "cursor-not-allowed bg-[#eee9e5] text-[#b5aaa3]"
                : "bg-[#fff0ed] text-[#b53d32] hover:bg-[#ffe5df]"
            }`}
          >
            <Trash2 className="h-4 w-4" strokeWidth={1.8} />
            {t("common.delete")}
          </button>
          <button
            className="flex h-11 items-center justify-center gap-2 rounded-[13px] bg-[#4b2f1a] px-5 text-sm font-bold text-white shadow-[0_8px_18px_rgba(75,47,26,0.15)] hover:bg-[#3c2515]"
            onClick={onAdd}
          >
            <Plus className="h-[18px] w-[18px]" strokeWidth={2} />
            {t("common.addNewRecord")}
          </button>
        </div>
      </div>
    </div>
  );
};
