import { Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useLocale } from "@/lib/locale-context";
import { FEED_INGREDIENTS } from "@/lib/nutrition-assistant/feedLibrary";
import type { NutritionResult } from "@/lib/nutrition-assistant/types";

interface FeedMixBuilderProps {
  result: NutritionResult | null;
  t: (key: string) => string;
}

interface FeedRow {
  id: string;
  ingredientId: string;
  amountKg: string;
}

const numberFormat = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });
const rowInputClass =
  "w-full rounded-xl border border-[#eadfd7] bg-white px-3 py-2.5 text-[#3b2b20] outline-none focus:border-[#9b7b61]";

const valueOf = (amount: string) => {
  const value = Number(amount);
  return Number.isFinite(value) ? value : 0;
};

const format = (value: number) => numberFormat.format(value);

export function FeedMixBuilder({ result, t }: FeedMixBuilderProps) {
  const { locale } = useLocale();
  const [rows, setRows] = useState<FeedRow[]>([
    { id: "feed-1", ingredientId: "alfalfa", amountKg: "" },
    { id: "feed-2", ingredientId: "barley", amountKg: "" },
  ]);
  const [search, setSearch] = useState("");

  const isArabic = locale === "ar";
  const ingredientName = (id: string) => {
    const ingredient = FEED_INGREDIENTS.find((item) => item.id === id);
    if (!ingredient) return "";
    return isArabic ? ingredient.nameAr : ingredient.nameEn;
  };

  const filteredIngredients = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return FEED_INGREDIENTS;
    return FEED_INGREDIENTS.filter((item) =>
      `${item.nameAr} ${item.nameEn}`.toLowerCase().includes(normalized),
    );
  }, [search]);

  const totals = useMemo(() => rows.reduce(
    (current, row) => {
      const ingredient = FEED_INGREDIENTS.find((item) => item.id === row.ingredientId);
      const amountKg = valueOf(row.amountKg);
      if (!ingredient || !amountKg) return current;
      return {
        kg: current.kg + amountKg,
        dryMatterKg: current.dryMatterKg + (amountKg * ingredient.dryMatterPercent / 100),
        proteinG: current.proteinG + (amountKg * ingredient.crudeProteinPercent * 10),
        energyMcal: current.energyMcal + (amountKg * ingredient.digestibleEnergyMcalKg),
      };
    },
    { kg: 0, dryMatterKg: 0, proteinG: 0, energyMcal: 0 },
  ), [rows]);

  const proteinRequirement = result?.requirements.find((item) => item.id === "crudeProtein")?.total ?? 0;
  const energyRequirement = result?.requirements.find((item) => item.id === "digestibleEnergy")?.total ?? 0;
  const proteinCoverage = proteinRequirement ? totals.proteinG / proteinRequirement * 100 : null;
  const energyCoverage = energyRequirement ? totals.energyMcal / energyRequirement * 100 : null;

  function updateRow(rowId: string, patch: Partial<FeedRow>) {
    setRows((current) => current.map((row) => row.id === rowId ? { ...row, ...patch } : row));
  }

  function addRow() {
    const ingredientId = filteredIngredients[0]?.id ?? FEED_INGREDIENTS[0].id;
    setRows((current) => [...current, { id: `feed-${Date.now()}`, ingredientId, amountKg: "" }]);
  }

  function removeRow(rowId: string) {
    setRows((current) => current.length === 1 ? current : current.filter((row) => row.id !== rowId));
  }

  return (
    <section className="mt-8 rounded-3xl border border-[#eee3db] bg-[#fdfaf7] p-5">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#3b2b20]">{t("feedBuilder.title")}</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-[#7c6b5d]">{t("feedBuilder.subtitle")}</p>
        </div>
        <button
          type="button"
          onClick={addRow}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#3b2b20] px-4 py-3 text-sm font-bold text-white hover:bg-[#513b2c]"
        >
          <Plus className="h-4 w-4" />
          {t("feedBuilder.add")}
        </button>
      </div>

      <input
        className="mb-4 w-full rounded-2xl border border-[#eadfd7] bg-white px-4 py-3 text-[#3b2b20] outline-none focus:border-[#9b7b61]"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder={t("feedBuilder.searchPlaceholder")}
      />

      <div className="space-y-3">
        {rows.map((row) => {
          const options = filteredIngredients.some((item) => item.id === row.ingredientId)
            ? filteredIngredients
            : FEED_INGREDIENTS.filter((item) => item.id === row.ingredientId).concat(filteredIngredients);

          return (
            <div key={row.id} className="grid gap-3 rounded-2xl border border-[#eee4dd] bg-white p-3 sm:grid-cols-[1fr_160px_44px]">
              <select
                className={rowInputClass}
                value={row.ingredientId}
                onChange={(event) => updateRow(row.id, { ingredientId: event.target.value })}
                aria-label={t("feedBuilder.ingredient")}
              >
                {options.map((item) => (
                  <option key={item.id} value={item.id}>
                    {isArabic ? item.nameAr : item.nameEn}
                  </option>
                ))}
              </select>
              <input
                className={rowInputClass}
                type="number"
                step="0.01"
                value={row.amountKg}
                onChange={(event) => updateRow(row.id, { amountKg: event.target.value })}
                placeholder={t("feedBuilder.amountPlaceholder")}
                aria-label={t("feedBuilder.amount")}
              />
              <button
                type="button"
                onClick={() => removeRow(row.id)}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#eadfd7] text-[#7c5641] hover:bg-[#faf0e8] disabled:opacity-40"
                disabled={rows.length === 1}
                aria-label={t("feedBuilder.remove")}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label={t("feedBuilder.totalKg")} value={`${format(totals.kg)} kg`} />
        <SummaryCard label={t("feedBuilder.dryMatter")} value={`${format(totals.dryMatterKg)} kg`} />
        <SummaryCard
          label={t("feedBuilder.protein")}
          value={`${format(totals.proteinG)} g`}
          helper={proteinCoverage === null ? t("feedBuilder.calculateHint") : `${format(proteinCoverage)}% ${t("feedBuilder.ofNeed")}`}
        />
        <SummaryCard
          label={t("feedBuilder.energy")}
          value={`${format(totals.energyMcal)} Mcal`}
          helper={energyCoverage === null ? t("feedBuilder.calculateHint") : `${format(energyCoverage)}% ${t("feedBuilder.ofNeed")}`}
        />
      </div>

      <p className="mt-4 text-xs leading-6 text-[#9a7c65]">
        {t("feedBuilder.sourceNote")} {rows.length ? t("feedBuilder.selectedPrefix") : ""} {rows.map((row) => ingredientName(row.ingredientId)).filter(Boolean).join(", ")}
      </p>
    </section>
  );
}

function SummaryCard({ label, value, helper }: { label: string; value: string; helper?: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-[#eee4dd]">
      <p className="text-xs font-semibold text-[#927f70]">{label}</p>
      <p className="mt-1 text-lg font-bold text-[#3b2b20]">{value}</p>
      {helper ? <p className="mt-1 text-xs text-[#7c6b5d]">{helper}</p> : null}
    </div>
  );
}
