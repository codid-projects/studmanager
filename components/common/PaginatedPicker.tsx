"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { useLocale, useTranslation } from "@/lib/locale-context";
import { useBodyScrollLock } from "./useBodyScrollLock";

export interface PickerPage<T> {
  data: T[];
  currentPage: number;
  hasNextPage: boolean;
}

interface PaginatedPickerProps<T> {
  value: number | string | null;
  selectedLabel?: string;
  placeholder: string;
  title: string;
  searchPlaceholder: string;
  emptyText: string;
  fetchPage: (params: { search?: string; pageNumber: number; pageSize: number }) => Promise<PickerPage<T>>;
  getItemKey: (item: T) => number | string;
  getItemLabel: (item: T) => string;
  getItemSubtitle?: (item: T) => string | undefined;
  getItemImage?: (item: T) => string | null | undefined;
  onChange: (item: T) => void;
  disabled?: boolean;
  pageSize?: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  triggerClassName?: string;
}

export function PaginatedPicker<T>({
  value,
  selectedLabel,
  placeholder,
  title,
  searchPlaceholder,
  emptyText,
  fetchPage,
  getItemKey,
  getItemLabel,
  getItemSubtitle,
  getItemImage,
  onChange,
  disabled = false,
  pageSize = 20,
  open: controlledOpen,
  onOpenChange,
  triggerClassName,
}: PaginatedPickerProps<T>) {
  const { direction } = useLocale();
  const { t } = useTranslation();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = useCallback((nextOpen: boolean) => {
    if (controlledOpen === undefined) setInternalOpen(nextOpen);
    onOpenChange?.(nextOpen);
  }, [controlledOpen, onOpenChange]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const requestSequence = useRef(0);

  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) return;

    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [open, search]);

  const loadPage = useCallback(async (pageNumber: number, append: boolean) => {
    const requestId = ++requestSequence.current;
    append ? setLoadingMore(true) : setLoading(true);
    setError("");

    try {
      const result = await fetchPage({
        search: debouncedSearch || undefined,
        pageNumber,
        pageSize,
      });
      if (requestId !== requestSequence.current) return;

      setItems((current) => append ? [...current, ...(result.data ?? [])] : result.data ?? []);
      setPage(result.currentPage || pageNumber);
      setHasNextPage(Boolean(result.hasNextPage));
    } catch (requestError) {
      if (requestId !== requestSequence.current) return;
      if (!append) setItems([]);
      setError(requestError instanceof Error ? requestError.message : t("common.requestError"));
    } finally {
      if (requestId === requestSequence.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, [debouncedSearch, fetchPage, pageSize, t]);

  useEffect(() => {
    if (!open) return;
    setItems([]);
    setPage(1);
    setHasNextPage(false);
    loadPage(1, false);
  }, [debouncedSearch, loadPage, open]);

  useEffect(() => {
    if (!open) {
      requestSequence.current += 1;
      setSearch("");
      setDebouncedSearch("");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className={`flex min-h-[50px] w-full items-center justify-between gap-3 rounded-xl border bg-white px-4 py-3 text-start disabled:cursor-not-allowed disabled:bg-gray-100 ${triggerClassName ?? ""}`}
      >
        <span className={selectedLabel ? "text-gray-900" : "text-gray-500"}>
          {selectedLabel || placeholder}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-gray-500" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[160] flex items-center justify-center bg-black/45 p-4"
          dir={direction}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div className="w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h3 className="text-xl font-bold text-[#3b2b20]">{title}</h3>
              <button type="button" onClick={() => setOpen(false)} className="rounded-full p-2 hover:bg-gray-100" aria-label={t("common.cancel")}>
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

            <div
              className="h-[360px] overflow-y-auto overscroll-contain p-3"
              onScroll={(event) => {
                const element = event.currentTarget;
                const nearBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 80;
                if (nearBottom && hasNextPage && !loading && !loadingMore) loadPage(page + 1, true);
              }}
            >
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="flex animate-pulse items-center gap-3 rounded-xl p-3">
                      <div className="h-12 w-12 rounded-full bg-gray-100" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-2/5 rounded bg-gray-100" />
                        <div className="h-3 w-1/4 rounded bg-gray-100" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="flex h-full items-center justify-center px-6 text-center text-sm text-red-600">{error}</div>
              ) : !items.length ? (
                <div className="flex h-full flex-col items-center justify-center px-6 text-center text-gray-500">
                  <Search className="mb-3 h-9 w-9 text-gray-300" />
                  <p>{emptyText}</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {items.map((item) => {
                    const key = getItemKey(item);
                    const label = getItemLabel(item);
                    const subtitle = getItemSubtitle?.(item);
                    const image = getItemImage?.(item);
                    const selected = String(key) === String(value ?? "");

                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          onChange(item);
                          setOpen(false);
                        }}
                        className={`flex w-full items-center gap-3 rounded-xl p-3 text-start transition-colors ${selected ? "bg-[#f2ece7]" : "hover:bg-gray-50"}`}
                      >
                        {image ? (
                          <img src={image} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover" />
                        ) : (
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#eee6df] font-bold text-[#6f513c]">
                            {label.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold text-[#3b2b20]">{label}</span>
                          {subtitle && <span className="mt-1 block truncate text-xs text-gray-500">{subtitle}</span>}
                        </span>
                        {selected && <Check className="h-5 w-5 shrink-0 text-[#6f513c]" />}
                      </button>
                    );
                  })}
                  {loadingMore && (
                    <div className="flex justify-center py-4">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#d8c8bc] border-t-[#4b2f1a]" aria-label={t("common.loading")} />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
