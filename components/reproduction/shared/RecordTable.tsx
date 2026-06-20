"use client";

import { Edit3, LoaderCircle, Trash2 } from "lucide-react";

export type TableColumn<T> = {
  key: string;
  label: string;
  render: (row: T) => React.ReactNode;
};

export function RecordTable<T extends { id: number }>({
  rows,
  columns,
  emptyLabel,
  onEdit,
  onDelete,
  busyId,
}: {
  rows: T[];
  columns: TableColumn<T>[];
  emptyLabel: string;
  onEdit?: (row: T) => void;
  onDelete: (row: T) => void;
  busyId?: number | null;
}) {
  return (
    <div className="overflow-hidden rounded-[9px] border border-[#e1d8d2] bg-white shadow-[0_2px_5px_rgba(47,29,18,.08)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-[11px]">
          <thead className="bg-[#351d10] text-white">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="p-3 text-start font-medium">
                  {column.label}
                </th>
              ))}
              <th className="p-3 text-start">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-[#eee8e4] last:border-0 hover:bg-[#fcfaf8]"
              >
                {columns.map((column) => (
                  <td key={column.key} className="p-3 text-[#4f4540]">
                    {column.render(row)}
                  </td>
                ))}
                <td className="p-3">
                  <div className="flex min-h-4 items-center gap-3">
                    {busyId === row.id ? (
                      <LoaderCircle className="h-4 w-4 animate-spin text-[#351d10]" />
                    ) : (
                      <>
                        {onEdit && (
                          <button onClick={() => onEdit(row)}>
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button onClick={() => onDelete(row)}>
                          <Trash2 className="h-3.5 w-3.5 text-[#ef5148]" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="p-10 text-center text-[#8b7f78]"
                >
                  {emptyLabel}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
