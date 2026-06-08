import { Printer } from "lucide-react";
import { kgToDisplay, mcalPerKgToDisplay, weightUnit } from "@/lib/nutrition-assistant/unitConversions";
import type { NutrientRequirement, NutritionResult, UnitSystem } from "@/lib/nutrition-assistant/types";

interface NutritionResultReportProps {
  result: NutritionResult;
  unitSystem: UnitSystem;
  t: (key: string) => string;
}

const format = (value: number) => new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value);

function displayTotal(item: NutrientRequirement, unitSystem: UnitSystem) {
  if (item.totalUnit === "kg/day") return `${format(kgToDisplay(item.total, unitSystem))} ${unitSystem === "imperial" ? "lb/day" : "kg/day"}`;
  return `${format(item.total)} ${item.totalUnit}`;
}

function displayBasis(item: NutrientRequirement, unitSystem: UnitSystem) {
  if (item.concentration === undefined) return "—";
  const value = item.concentrationUnit === "Mcal/kg"
    ? mcalPerKgToDisplay(item.concentration, unitSystem)
    : item.concentration;
  const unit = item.concentrationUnit === "Mcal/kg" && unitSystem === "imperial"
    ? "Mcal/lb"
    : item.concentrationUnit;
  return `${format(value)} ${unit}`;
}

export function NutritionResultReport({ result, unitSystem, t }: NutritionResultReportProps) {
  const input = result.input;
  const weight = `${format(kgToDisplay(input.bodyWeightKg, unitSystem))} ${weightUnit(unitSystem)}`;
  const descriptions = [
    [t("description.activity"), t(`activities.${input.activity}`)],
    [t("description.bodyWeight"), weight],
    input.workIntensity ? [t("fields.workIntensity"), t(`intensities.${input.workIntensity}`)] : null,
    input.gestationMonth ? [t("fields.gestationMonth"), input.gestationMonth] : null,
    input.lactationMonth ? [t("fields.lactationMonth"), input.lactationMonth] : null,
    input.matureWeightKg ? [t("fields.matureWeight"), `${format(kgToDisplay(input.matureWeightKg, unitSystem))} ${weightUnit(unitSystem)}`] : null,
    input.ageMonths ? [t("fields.ageMonths"), input.ageMonths] : null,
    input.averageDailyGainKg ? [t("fields.dailyGain"), `${format(kgToDisplay(input.averageDailyGainKg, unitSystem))} ${weightUnit(unitSystem)}/${t("day")}`] : null,
    input.inTraining !== undefined ? [t("fields.inTraining"), t(input.inTraining ? "yes" : "no")] : null,
  ].filter(Boolean) as Array<[string, string | number]>;

  return (
    <section className="nutrition-print-area overflow-hidden rounded-[2rem] border border-[#eadfd7] bg-white shadow-sm">
      <div className="flex items-center justify-between gap-4 bg-[#3b2b20] px-5 py-5 text-white sm:px-7">
        <div>
          <h2 className="text-xl font-bold sm:text-2xl">{t("reportTitle")}</h2>
          <p className="mt-1 text-sm text-white/70">{t("dailyRequirements")}</p>
        </div>
        <button onClick={() => window.print()} className="print:hidden rounded-xl bg-white/10 p-3 hover:bg-white/20" aria-label={t("print")}>
          <Printer className="h-5 w-5" />
        </button>
      </div>
      <div className="p-5 sm:p-7">
        <h3 className="mb-4 font-bold text-[#4b3628]">{t("horseDescription")}</h3>
        <dl className="mb-7 grid gap-3 rounded-2xl bg-[#faf6f2] p-4 sm:grid-cols-2 lg:grid-cols-3">
          {descriptions.map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-[#927f70]">{label}</dt>
              <dd className="mt-1 font-semibold text-[#3b2b20]">{value}</dd>
            </div>
          ))}
        </dl>
        <div className="overflow-x-auto rounded-2xl border border-[#eee4dd]">
          <table className="w-full min-w-[680px]">
            <thead className="bg-[#f4ece5] text-[#4b3628]">
              <tr>
                <th className="px-5 py-4 text-start">{t("table.nutrient")}</th>
                <th className="px-5 py-4 text-start">{t("table.total")}</th>
                <th className="px-5 py-4 text-start">{t("table.basis")}</th>
              </tr>
            </thead>
            <tbody>
              {result.requirements.map((item) => (
                <tr key={item.id} className="border-t border-[#f0e7e1] even:bg-[#fdfbf9]">
                  <td className="px-5 py-3.5 font-semibold text-[#4b3628]">{t(`nutrients.${item.id}`)}</td>
                  <td className="px-5 py-3.5 text-[#66564a]">{displayTotal(item, unitSystem)}</td>
                  <td className="px-5 py-3.5 text-[#66564a]">{displayBasis(item, unitSystem)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs leading-6 text-[#9a7c65]">{t("formulaNotice")}</p>
      </div>
    </section>
  );
}
