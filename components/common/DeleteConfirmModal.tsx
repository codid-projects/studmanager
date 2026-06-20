"use client";

import { useEffect } from "react";
import { useLocale } from "@/lib/locale-context";

interface Props {
  open: boolean;
  title: string;
  description?: string;
  onCancel: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

export default function DeleteConfirmModal({
  open,
  title,
  description,
  onCancel,
  onConfirm,
  loading = false,
}: Props) {
  const { direction } = useLocale();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />

      <div
        className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        dir={direction}
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-20 h-20 rounded-full bg-[#fef0ef] flex items-center justify-center">
            <svg
              className="w-10 h-10 text-[#c2463a]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                d="M3 6h18"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M8 6v12a2 2 0 002 2h4a2 2 0 002-2V6"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M10 11v6"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M14 11v6"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <h3 className="text-xl font-bold text-[#27304a]">{title}</h3>
          {description && (
            <p className="text-sm text-[#6d6d6d]">{description}</p>
          )}

          <div className="mt-2 flex gap-3">
            <button
              onClick={onConfirm}
              disabled={loading}
              className="px-6 py-2 rounded-[14px] bg-[#c2463a] text-white font-semibold"
            >
              {loading ? (direction === "rtl" ? "جارٍ الحذف..." : "Deleting...") : (direction === "rtl" ? "حذف" : "Delete")}
            </button>
            <button
              onClick={onCancel}
              disabled={loading}
              className="px-6 py-2 rounded-[14px] border border-[#bdbdbd] font-semibold"
            >
              {direction === "rtl" ? "إلغاء" : "Cancel"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
