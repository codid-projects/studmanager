"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Eye,
  LoaderCircle,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import type { LocaleCode } from "@/lib/api/types";
import {
  getLedgerTransactions,
  type LedgerPage,
  type LedgerTransaction,
} from "@/lib/api/ledger-client";

const transactionTypes = {
  breeding: [
    ["OvulationExamination", "متابعة التبويض", "Ovulation examination"],
    ["MareBreedingSoundness", "فحص تناسلي للفرس", "Mare breeding soundness"],
    ["StallionBreedingEvent", "طلوقة طبيعية", "Natural breeding"],
    ["SemenCollection", "جمع سائل منوي", "Semen collection"],
    ["SemenShipment", "شحنة سائل منوي", "Semen shipment"],
    ["StallionBreedingSoundness", "فحص تناسلي للفحل", "Stallion soundness"],
    ["HorseSale", "بيع خيل", "Horse sale"],
  ],
  nutrition: [["NutritionRecord", "التغذية", "Nutrition"]],
  health: [["InjuryRecord", "إصابة", "Injury"]],
} as const;

export function LedgerTransactions({
  direction,
  category = "breeding",
}: {
  direction: "expense" | "revenue";
  category?: string;
}) {
  const { locale: rawLocale, direction: pageDirection } = useLocale();
  const locale = (rawLocale === "en" ? "en" : "ar") as LocaleCode;
  const ar = locale === "ar";
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<LedgerPage | null>(null);
  const [selected, setSelected] = useState<LedgerTransaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [type, setType] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    if (fromDate && toDate && fromDate > toDate) {
      setResult(null);
      setLoading(false);
      setError(
        ar
          ? "يجب أن يكون تاريخ البداية قبل تاريخ النهاية أو مساوياً له."
          : "The from date must be before or equal to the to date.",
      );
      return () => {
        active = false;
      };
    }
    getLedgerTransactions(locale, direction, page, category, {
      type,
      fromDate,
      toDate,
    })
      .then((value) => active && setResult(value))
      .catch(
        (cause) =>
          active && setError(cause instanceof Error ? cause.message : "Failed"),
      )
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [ar, category, direction, fromDate, locale, page, toDate, type]);

  useEffect(() => setPage(1), [category, fromDate, toDate, type]);
  useEffect(() => setType(""), [category]);

  const availableTypes =
    transactionTypes[category as keyof typeof transactionTypes] ?? [];

  const accountName = (value: string) => {
    if (!ar) return value;
    const names: Record<string, string> = {
      "Farm Expenses": "مصروفات المزرعة",
      "Breeding Provider": "مقدم خدمة التناسل",
      "Cash Revenue": "إيرادات نقدية",
      "Horse Sales Revenue": "إيرادات بيع الخيول",
    };
    return names[value] ?? value;
  };

  const categoryName =
    category === "nutrition"
      ? ar
        ? "التغذية"
        : "Nutrition"
      : category === "health" || category === "clinics"
        ? ar
          ? "الرعاية الصحية"
          : "Healthcare"
        : category === "breeding"
          ? ar
            ? "التربية والتناسل"
            : "Breeding"
          : ar
            ? "الفئة المحددة"
            : "Selected category";

  const money = (amount: number) =>
    `${Number(amount).toLocaleString(ar ? "ar-EG" : "en-EG", { maximumFractionDigits: 2 })} EGP`;
  return (
    <section dir={pageDirection} className="space-y-4">
      <header className="rounded-2xl bg-[#351d10] p-5 text-white">
        <h1 className="text-xl font-bold">
          {direction === "expense"
            ? ar
              ? `مصروفات ${categoryName}`
              : `${categoryName} expenses`
            : ar
              ? `إيرادات ${categoryName}`
              : `${categoryName} revenue`}
        </h1>
        <p className="mt-1 text-xs text-white/70">
          {ar
            ? "قيود مالية فعلية مرتبطة بسجلات الخيول — جميع القيم بالجنيه المصري"
            : "Live financial entries linked to horse records — all values in EGP"}
        </p>
      </header>
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2 font-semibold text-[#4b3020]">
          <SlidersHorizontal className="h-4 w-4" />
          {ar ? "تصفية النتائج" : "Filter results"}
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <label className="space-y-1 text-xs font-medium">
            <span>{ar ? "نوع المعاملة" : "Transaction type"}</span>
            <select
              value={type}
              onChange={(event) => setType(event.target.value)}
              className="h-11 w-full rounded-xl border bg-white px-3"
            >
              <option value="">{ar ? "جميع الأنواع" : "All types"}</option>
              {availableTypes.map(([value, arabic, english]) => (
                <option key={value} value={value}>
                  {ar ? arabic : english}
                </option>
              ))}
            </select>
          </label>
          {[
            {
              label: ar ? "من تاريخ" : "From date",
              value: fromDate,
              setValue: setFromDate,
            },
            {
              label: ar ? "إلى تاريخ" : "To date",
              value: toDate,
              setValue: setToDate,
            },
          ].map((dateFilter) => (
            <label key={dateFilter.label} className="space-y-1 text-xs font-medium">
              <span>{dateFilter.label}</span>
              <span className="relative block">
                <input
                  type="date"
                  value={dateFilter.value}
                  onChange={(event) => dateFilter.setValue(event.target.value)}
                  onClick={(event) => event.currentTarget.showPicker?.()}
                  className="h-11 w-full cursor-pointer rounded-xl border bg-white px-3 pe-10"
                />
                <CalendarDays className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6f5a4c]" />
              </span>
            </label>
          ))}
        </div>
      </div>
      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
      {loading ? (
        <div className="grid h-48 place-items-center rounded-xl bg-white">
          <LoaderCircle className="h-7 w-7 animate-spin" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-[#f4eee9] text-[#4b3020]">
                <tr>
                  <th className="p-3 text-start">{ar ? "النوع" : "Type"}</th>
                  <th className="p-3 text-start">{ar ? "الخيل" : "Horse"}</th>
                  <th className="p-3 text-start">{ar ? "التاريخ" : "Date"}</th>
                  <th className="p-3 text-start">{ar ? "القيمة" : "Amount"}</th>
                  <th className="p-3 text-start">
                    {ar ? "التفاصيل" : "Details"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {result?.data.map((item) => (
                  <tr key={item.id} className="border-t">
                    <td className="p-3 font-medium">
                      {ar ? item.subtypeAr : item.subtypeEn}
                    </td>
                    <td className="p-3">
                      {(ar
                        ? item.horseNameAr || item.horseName
                        : item.horseName || item.horseNameAr) || "—"}
                    </td>
                    <td className="p-3">
                      {new Date(item.date).toLocaleDateString(
                        ar ? "ar-EG" : "en-GB",
                      )}
                    </td>
                    <td
                      className={`p-3 font-bold ${direction === "revenue" ? "text-emerald-700" : "text-red-700"}`}
                    >
                      {money(item.totalAmount)}
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => setSelected(item)}
                        className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs"
                      >
                        <Eye className="h-4 w-4" />
                        {ar ? "عرض" : "View"}
                      </button>
                    </td>
                  </tr>
                ))}
                {!result?.data.length && (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-[#887a72]">
                      {ar
                        ? "لا توجد قيود مالية بعد"
                        : "No financial entries yet"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <div className="flex items-center justify-center gap-3">
        <button
          disabled={!result?.hasPreviousPage || loading}
          onClick={() => setPage((value) => value - 1)}
          className="rounded-full border p-2 disabled:opacity-30"
        >
          {ar ? <ChevronRight /> : <ChevronLeft />}
        </button>
        <span className="text-sm">
          {page} / {Math.max(1, result?.totalPages ?? 1)}
        </span>
        <button
          disabled={!result?.hasNextPage || loading}
          onClick={() => setPage((value) => value + 1)}
          className="rounded-full border p-2 disabled:opacity-30"
        >
          {ar ? <ChevronLeft /> : <ChevronRight />}
        </button>
      </div>
      {selected && (
        <div className="fixed inset-0 z-[130] grid place-items-center bg-black/45 p-4">
          <article className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl">
            <header className="flex items-start justify-between">
              <div>
                <h2 className="font-bold">
                  {ar ? selected.subtypeAr : selected.subtypeEn}
                </h2>
                <small className="text-[#8c7d74]">{selected.code}</small>
              </div>
              <button onClick={() => setSelected(null)}>
                <X />
              </button>
            </header>
            <p className="mt-4 rounded-xl bg-[#faf7f4] p-3 text-sm">
              {ar ? selected.descriptionAr : selected.descriptionEn}
            </p>
            <div className="mt-4 space-y-2">
              {selected.lines.map((line, index) => (
                <div
                  key={`${line.accountName}-${index}`}
                  className="flex justify-between rounded-lg border p-3 text-sm"
                >
                  <span>
                    {ar
                      ? direction === "expense"
                        ? "الجهة المستفيدة"
                        : "جهة التحصيل"
                      : direction === "expense"
                        ? "Paid to"
                        : "Received through"}
                  </span>
                  <span className="text-end">
                    <b className="block">{accountName(line.accountName)}</b>
                    {selected.lines.length > 1 && (
                      <small className="text-[#8c7d74]">
                        {money(line.amount)}
                      </small>
                    )}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-between border-t pt-4 text-lg font-bold">
              <span>{ar ? "الإجمالي" : "Total"}</span>
              <span>{money(selected.totalAmount)}</span>
            </div>
          </article>
        </div>
      )}
    </section>
  );
}
