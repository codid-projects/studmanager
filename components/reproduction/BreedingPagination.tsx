"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

export function BreedingPagination({
  direction,
}: {
  direction: "rtl" | "ltr";
}) {
  const isRTL = direction === "rtl";
  const PreviousIcon = isRTL ? ChevronRight : ChevronLeft;
  const NextIcon = isRTL ? ChevronLeft : ChevronRight;

  return (
    <nav
      className="flex items-center justify-center gap-2 pt-2"
      aria-label="Pagination"
    >
      <button
        type="button"
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#e7dbd3] bg-white text-[#725e52] hover:bg-[#faf6f2]"
        aria-label="Previous page"
      >
        <PreviousIcon className="h-4 w-4" />
      </button>
      {[1, 2, 3].map((page) => (
        <button
          type="button"
          key={page}
          className={`flex h-10 min-w-10 items-center justify-center rounded-xl px-3 text-sm font-bold ${
            page === 1
              ? "bg-[#4b2f1a] text-white shadow-[0_7px_16px_rgba(75,47,26,0.16)]"
              : "border border-[#e7dbd3] bg-white text-[#725e52] hover:bg-[#faf6f2]"
          }`}
          aria-current={page === 1 ? "page" : undefined}
        >
          {page}
        </button>
      ))}
      <button
        type="button"
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#e7dbd3] bg-white text-[#725e52] hover:bg-[#faf6f2]"
        aria-label="Next page"
      >
        <NextIcon className="h-4 w-4" />
      </button>
    </nav>
  );
}
