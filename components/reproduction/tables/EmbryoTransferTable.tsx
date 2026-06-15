"use client";

import { Edit3, Trash2 } from "lucide-react";
import { useLocale } from "@/lib/locale-context";

export type EmbryoTransferRow = {
  id: string;
  stallion: string;
  futureMare: string;
  collectionDate: string;
  tankName: string;
  type: string;
  forSale: string;
  price: string;
  canister: number | string;
  color: "red" | "green" | "yellow";
};

type Props = {
  locale: string;
  direction: "rtl" | "ltr";
  rows: EmbryoTransferRow[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onEdit: (row: EmbryoTransferRow) => void;
  onDelete: (row: EmbryoTransferRow) => void;
};

export default function EmbryoTransferTable({
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
    stallion: t("reproduction.tables.embryoTransfer.headers.stallion"),
    futureMare: t("reproduction.tables.embryoTransfer.headers.futureMare"),
    collectionDate: t(
      "reproduction.tables.embryoTransfer.headers.collectionDate",
    ),
    tankName: t("reproduction.tables.embryoTransfer.headers.tankName"),
    type: t("reproduction.tables.embryoTransfer.headers.type"),
    forSale: t("reproduction.tables.embryoTransfer.headers.forSale"),
    price: t("common.price"),
    canister: t("reproduction.tables.embryoTransfer.headers.canister"),
    color: t("reproduction.tables.embryoTransfer.headers.color"),
    actions: t("common.actions"),
  };

  function dotClass(c: EmbryoTransferRow["color"]) {
    if (c === "green") return "bg-green-500";
    if (c === "yellow") return "bg-yellow-500";
    return "bg-red-500";
  }

  return (
    <div className="mt-4 overflow-auto rounded-[20px] border border-[#eadfd7] bg-white shadow-[0_12px_34px_rgba(75,47,26,0.05)]">
      <table className="w-full min-w-[1080px]">
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
              {headers.stallion}
            </th>
            <th className={`px-4 py-4 ${isRTL ? "text-right" : "text-left"}`}>
              {headers.futureMare}
            </th>
            <th className={`px-4 py-4 ${isRTL ? "text-right" : "text-left"}`}>
              {headers.collectionDate}
            </th>
            <th className={`px-4 py-4 ${isRTL ? "text-right" : "text-left"}`}>
              {headers.tankName}
            </th>
            <th className={`px-4 py-4 ${isRTL ? "text-right" : "text-left"}`}>
              {headers.type}
            </th>
            <th className={`px-4 py-4 ${isRTL ? "text-right" : "text-left"}`}>
              {headers.forSale}
            </th>
            <th className={`px-4 py-4 ${isRTL ? "text-right" : "text-left"}`}>
              {headers.price}
            </th>
            <th className={`px-4 py-4 ${isRTL ? "text-right" : "text-left"}`}>
              {headers.canister}
            </th>
            <th className={`px-4 py-4 ${isRTL ? "text-right" : "text-left"}`}>
              {headers.color}
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

              <td className="px-4 py-4 text-sm font-semibold text-[#352821]">
                {row.stallion}
              </td>
              <td className="px-4 py-4 text-sm font-semibold text-[#352821]">
                {row.futureMare}
              </td>
              <td className="px-4 py-4 text-sm text-[#75675f]">
                {row.collectionDate}
              </td>
              <td className="px-4 py-4 text-sm text-[#75675f]">
                {row.tankName}
              </td>
              <td className="px-4 py-4 text-sm text-[#75675f]">{row.type}</td>
              <td className="px-4 py-4 text-sm text-[#75675f]">
                {row.forSale}
              </td>
              <td className="px-4 py-4 text-sm font-semibold text-[#55443b]">{row.price}</td>
              <td className="px-4 py-4 text-sm text-[#75675f]">
                {row.canister}
              </td>

              <td className="px-4 py-4">
                <div className="flex items-center justify-center">
                  <span
                    className={`inline-block h-3 w-3 rounded-full ${dotClass(row.color)}`}
                    aria-label={`color-${row.color}`}
                  />
                </div>
              </td>

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
                colSpan={11}
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
