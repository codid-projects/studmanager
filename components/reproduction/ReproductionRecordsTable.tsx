"use client";

import { Edit3, Trash2 } from "lucide-react";
import { useLocale } from "@/lib/locale-context";

export type RecordItem = {
  id: string;
  horse: string;
  dob?: string;
  results?: string;
  price?: string;
  location?: string;
};

type Props = {
  locale: string;
  direction: "rtl" | "ltr";
  rows: RecordItem[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onEdit: (row: RecordItem) => void;
  onDelete: (row: RecordItem) => void;
};

export default function ReproductionRecordsTable({
  locale,
  direction,
  rows,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onEdit,
  onDelete,
}: Props) {
  const { t } = useLocale();
  const allSelected = rows.length > 0 && selectedIds.length === rows.length;
  const isRTL = direction === "rtl";

  return (
    <div className="mt-4">
      <div
        className="w-full max-w-full overflow-x-auto overflow-y-hidden rounded-[20px] border border-[#eadfd7] bg-white shadow-[0_12px_34px_rgba(75,47,26,0.05)] overscroll-x-contain"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <table className="w-full min-w-[820px]">
          <thead>
            <tr className="bg-[#4b2f1a] text-[13px] font-semibold text-white">
              <th className="px-4 py-4 text-start whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onToggleSelectAll}
                  aria-label="select all"
                />
              </th>
              <th className="px-4 py-4 text-start whitespace-nowrap">
                {locale === "ar" ? "الفرس المستقبلية" : "Future Horse"}
              </th>
              <th className="px-4 py-4 text-start whitespace-nowrap">
                {t("performance.date")}
              </th>
              <th className="px-4 py-4 text-start whitespace-nowrap">
                {locale === "ar" ? "النتائج الأولية" : "Results"}
              </th>
              <th className="px-4 py-4 text-start whitespace-nowrap">
                {t("performance.cost")}
              </th>
              <th className="px-4 py-4 text-start whitespace-nowrap">
                {locale === "ar" ? "المكان" : "Location"}
              </th>
              <th className="px-4 py-4 text-start whitespace-nowrap">
                {t("common.actions")}
              </th>
            </tr>
          </thead>

          <tbody className={isRTL ? "text-right" : "text-left"}>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-[#f1e9e3] transition hover:bg-[#fdfaf7]">
                <td className="px-4 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(row.id)}
                    onChange={() => onToggleSelect(row.id)}
                    aria-label={`select-${row.id}`}
                  />
                </td>

                <td className="px-4 py-4 text-sm font-semibold text-[#352821] whitespace-nowrap">
                  {row.horse}
                </td>
                <td className="px-4 py-4 text-sm text-[#75675f] whitespace-nowrap">
                  {row.dob || ""}
                </td>
                <td className="px-4 py-4 text-sm whitespace-nowrap">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                      /فشل|fail/i.test(row.results || "")
                        ? "bg-[#fff0ed] text-[#bd4a3e]"
                        : "bg-[#eef7ef] text-[#478253]"
                    }`}
                  >
                    {row.results || (locale === "ar" ? "النتائج الأولية" : "Pending")}
                  </span>
                </td>
                <td className="px-4 py-4 text-sm font-semibold text-[#55443b] whitespace-nowrap">
                  {row.price || ""}
                </td>
                <td className="px-4 py-4 text-sm text-[#75675f] whitespace-nowrap">
                  {row.location || ""}
                </td>

                <td
                  className={`px-4 py-4 whitespace-nowrap ${isRTL ? "text-left" : "text-right"}`}
                >
                  <div
                    className={`flex gap-2 ${isRTL ? "justify-start flex-row-reverse" : "justify-end"}`}
                  >
                    <button
                      className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-[#e6dad2] bg-white transition hover:bg-[#f8f2ed]"
                      aria-label={t("common.edit")}
                      onClick={() => onEdit(row)}
                    >
                      <Edit3 className="h-4 w-4 text-[#6b584f]" />
                    </button>
                    <button
                      onClick={() => onDelete(row)}
                      className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-[#f0d8d3] bg-[#fff8f6] text-[#c34c40] transition hover:bg-[#fff0ed]"
                      aria-label={t("common.delete")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="py-6 text-center text-sm text-[#7a6b63] whitespace-nowrap"
                >
                  {locale === "ar" ? "لا توجد سجلات" : "No records found"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="sm:hidden mt-2 text-xs text-[#7a6b63]">
        {locale === "ar"
          ? "اسحب يمين/يسار لعرض الجدول بالكامل"
          : "Swipe left/right to view the full table"}
      </div>
    </div>
  );
}
