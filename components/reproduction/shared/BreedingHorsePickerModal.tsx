"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  Search,
  X,
} from "lucide-react";
import horsePlaceholder from "@/app/assets/imgs/horse-placehodler.png";
import type {
  HorseListItemDto,
  LocaleCode,
  PagedResponse,
} from "@/lib/api/types";
import { getBreedingHorsesPage } from "@/lib/api/mare-breeding-client";

export function BreedingHorsePickerModal({
  open,
  locale,
  gender,
  excludeHorseIds = [],
  onClose,
  onSelect,
}: {
  open: boolean;
  locale: LocaleCode;
  gender: "Female" | "Male";
  excludeHorseIds?: number[];
  onClose: () => void;
  onSelect: (horse: HorseListItemDto) => void;
}) {
  const ar = locale === "ar";
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<PagedResponse<HorseListItemDto> | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setPage(1);
    setResult(null);
    setError("");
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.setTimeout(() => inputRef.current?.focus(), 80);
    const closeOnEscape = (event: KeyboardEvent) =>
      event.key === "Escape" && onClose();
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    let active = true;
    const timer = window.setTimeout(
      async () => {
        setLoading(true);
        setError("");
        try {
          const next = await getBreedingHorsesPage(
            locale,
            gender,
            query,
            page,
            10,
          );
          if (active) setResult(next);
        } catch (cause) {
          if (active)
            setError(
              cause instanceof Error
                ? cause.message
                : ar
                  ? "تعذر تحميل الخيول"
                  : "Unable to load horses",
            );
        } finally {
          if (active) setLoading(false);
        }
      },
      query ? 250 : 0,
    );
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [ar, gender, locale, open, page, query]);

  if (!open) return null;
  const horses = result?.data ?? [];
  const totalPages = Math.max(result?.totalPages ?? 1, 1);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#25160d]/55 p-3 backdrop-blur-[2px] sm:p-6"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={ar ? "اختيار حصان" : "Select horse"}
        className="flex max-h-[calc(100dvh-24px)] min-h-[560px] w-full max-w-[760px] flex-col overflow-hidden rounded-[20px] border border-white/70 bg-[#fbf7f4] shadow-[0_28px_90px_rgba(30,17,10,.34)] sm:max-h-[calc(100dvh-48px)]"
      >
        <header className="flex shrink-0 items-start justify-between border-b border-[#e9dfd8] bg-white px-5 py-4 sm:px-6">
          <div>
            <p className="text-[11px] font-semibold text-[#9a877b]">
              {ar ? "الخيول الداخلية" : "Internal horses"}
            </p>
            <h2 className="mt-1 text-xl font-bold text-[#32231b]">
              {ar
                ? `اختر ${gender === "Female" ? "الفرس" : "الفحل"}`
                : `Select a ${gender === "Female" ? "mare" : "stallion"}`}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-xl border border-[#e5d9d1] bg-white text-[#4e3b31] hover:bg-[#f8f2ee]"
            aria-label={ar ? "إغلاق" : "Close"}
          >
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="shrink-0 px-5 py-4 sm:px-6">
          <div className="relative">
            <Search className="absolute end-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#796960]" />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder={
                ar
                  ? "ابحث بالاسم العربي أو الإنجليزي..."
                  : "Search by Arabic or English name..."
              }
              className="h-12 w-full rounded-xl border border-[#cfc3bb] bg-white px-4 pe-11 text-sm outline-none focus:border-[#4b2d1c] focus:ring-4 focus:ring-[#4b2d1c]/10"
            />
          </div>
          <p className="mt-2 text-[11px] text-[#91837b]">
            {ar ? "يتم عرض 10 خيول في كل صفحة" : "Showing 10 horses per page"}
          </p>
        </div>
        <div className="relative min-h-0 flex-1 overflow-y-auto px-5 pb-4 sm:px-6">
          <div className="grid auto-rows-[82px] gap-2 sm:grid-cols-2">
            {horses.map((horse) => {
              const disabled = excludeHorseIds.includes(
                Number(horse.localId ?? horse.id),
              );
              return (
                <button
                  key={horse.localId ?? horse.id}
                  disabled={disabled}
                  onClick={() => {
                    onSelect(horse);
                    onClose();
                  }}
                  className="flex h-[82px] items-center gap-3 rounded-xl border border-[#e3d9d2] bg-white p-3 text-start transition hover:border-[#79563f] hover:bg-[#fdfaf8] hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <img
                    src={horse.horseProfileImage || horsePlaceholder.src}
                    alt=""
                    className="h-14 w-14 shrink-0 rounded-[10px] object-cover"
                  />
                  <span className="min-w-0">
                    <b className="block truncate text-sm text-[#382820]">
                      {ar
                        ? horse.arabicName || horse.englishName
                        : horse.englishName || horse.arabicName}
                    </b>
                    <small className="mt-1 block truncate text-[11px] text-[#998a81]">
                      {horse.color || "—"} ·{" "}
                      {horse.dateofBirth
                        ? new Date(horse.dateofBirth).getFullYear()
                        : "—"}
                      {disabled
                        ? ` · ${ar ? "محدد بالفعل" : "Already selected"}`
                        : ""}
                    </small>
                  </span>
                </button>
              );
            })}
          </div>
          {loading && (
            <div className="absolute inset-0 grid place-items-center bg-[#fbf7f4]/75">
              <LoaderCircle className="h-7 w-7 animate-spin text-[#472b1a]" />
            </div>
          )}
          {!loading && horses.length === 0 && (
            <div className="grid h-full min-h-48 place-items-center text-center text-sm text-[#8b7b72]">
              {error || (ar ? "لا توجد خيول مطابقة" : "No matching horses")}
            </div>
          )}
        </div>
        <footer className="flex shrink-0 items-center justify-between border-t border-[#e7ddd6] bg-white px-5 py-3 sm:px-6">
          <p className="text-xs text-[#88786f]">
            {result?.totalCount ?? 0} {ar ? "حصان" : "horses"}
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1 || loading}
              onClick={() => setPage((value) => value - 1)}
              className="grid h-9 w-9 place-items-center rounded-lg border border-[#ded3cc] disabled:opacity-35"
            >
              {ar ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </button>
            <span className="min-w-20 text-center text-xs font-semibold text-[#49372d]">
              {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages || loading}
              onClick={() => setPage((value) => value + 1)}
              className="grid h-9 w-9 place-items-center rounded-lg border border-[#ded3cc] disabled:opacity-35"
            >
              {ar ? (
                <ChevronLeft className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
