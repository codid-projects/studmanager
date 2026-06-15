"use client";

import { Edit3, Trash2 } from "lucide-react";
import { useLocale } from "@/lib/locale-context";

export type ReproductionControlRow = {
  id: string;
  scheduled: string; // مجدول (نعم/لا)
  date: string; // التاريخ
  time: string; // الوقت
  examMethod: string; // طريقة الفحص
  doctor: string; // الطبيب
};

type Props = {
  locale: string;
  direction: "rtl" | "ltr";
  rows: ReproductionControlRow[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onEdit: (row: ReproductionControlRow) => void;
  onDelete: (row: ReproductionControlRow) => void;
};

export default function ReproductionControlTable({
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
  const isRTL = direction === "rtl";
  const allSelected = rows.length > 0 && selectedIds.length === rows.length;

  const headers = {
    scheduled: t("reproduction.tables.control.headers.scheduled"),
    date: t("common.date"),
    time: t("common.time"),
    examMethod: t("reproduction.tables.control.headers.examMethod"),
    doctor: t("reproduction.tables.control.headers.doctor"),
    actions: t("common.actions"),
  };

  return (
    <div className="mt-4 overflow-auto rounded-[20px] border border-[#eadfd7] bg-white shadow-[0_12px_34px_rgba(75,47,26,0.05)]">
      <table className="w-full min-w-[860px]">
        <thead>
          <tr className="w-full bg-[#4b2f1a] text-[13px] font-semibold text-white">
            <th className={`px-4 py-4 ${isRTL ? "text-right" : "text-left"}`}>
              <input
                type="checkbox"
                checked={allSelected}
                onChange={onToggleSelectAll}
                aria-label={t("common.selectAll")}
              />
            </th>

            <th className={`px-4 py-4 ${isRTL ? "text-right" : "text-left"}`}>
              {headers.scheduled}
            </th>
            <th className={`px-4 py-4 ${isRTL ? "text-right" : "text-left"}`}>
              {headers.date}
            </th>
            <th className={`px-4 py-4 ${isRTL ? "text-right" : "text-left"}`}>
              {headers.time}
            </th>
            <th className={`px-4 py-4 ${isRTL ? "text-right" : "text-left"}`}>
              {headers.examMethod}
            </th>
            <th className={`px-4 py-4 ${isRTL ? "text-right" : "text-left"}`}>
              {headers.doctor}
            </th>

            <th className={`px-4 py-4 ${isRTL ? "text-right" : "text-left"}`}>
              {headers.actions}
            </th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-[#f1e9e3] bg-white transition hover:bg-[#fdfaf7]">
              <td className="px-4 py-4">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(row.id)}
                  onChange={() => onToggleSelect(row.id)}
                  aria-label={`${t("common.select")}-${row.id}`}
                />
              </td>

              <td className="px-4 py-4 text-sm text-[#2c2330]">
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                  /نعم|yes/i.test(row.scheduled)
                    ? "bg-[#eef7ef] text-[#478253]"
                    : "bg-[#fff0ed] text-[#bd4a3e]"
                }`}>
                  {row.scheduled}
                </span>
              </td>
              <td className="px-4 py-4 text-sm text-[#75675f]">{row.date}</td>
              <td className="px-4 py-4 text-sm text-[#75675f]">{row.time}</td>
              <td className="px-4 py-4 text-sm text-[#75675f]">
                {row.examMethod}
              </td>
              <td className="px-4 py-4 text-sm font-semibold text-[#352821]">{row.doctor}</td>

              <td
                className={`flex justify-end gap-2 px-4 py-4 ${
                  isRTL ? "flex-row-reverse" : ""
                }`}
              >
                <button
                  className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-[#e6dad2] bg-white hover:bg-[#f8f2ed]"
                  aria-label={t("common.edit")}
                  onClick={() => onEdit(row)}
                >
                  <Edit3 className="h-4 w-4 text-[#6b584f]" />
                </button>
                <button
                  className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-[#f0d8d3] bg-[#fff8f6] hover:bg-[#fff0ed]"
                  aria-label={t("common.delete")}
                  onClick={() => onDelete(row)}
                >
                  <Trash2 className="h-4 w-4 text-[#d9534f]" />
                </button>
              </td>
            </tr>
          ))}

          {rows.length === 0 && (
            <tr>
              <td
                colSpan={7}
                className="py-8 text-center text-sm text-[#7a6b63]"
              >
                {t("common.noRecordsFound")}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
