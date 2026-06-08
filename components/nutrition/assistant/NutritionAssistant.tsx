"use client";

import { useState } from "react";
import { Calculator } from "lucide-react";
import { useTranslation } from "@/lib/locale-context";
import { DEFAULT_NUTRITION_FORM } from "@/lib/nutrition-assistant/formDefaults";
import { calculateNutrientRequirements } from "@/lib/nutrition-assistant/nutrientCalculator";
import { toMetricInput, validateNutritionForm } from "@/lib/nutrition-assistant/nutritionValidation";
import { kgToDisplay, weightToKg } from "@/lib/nutrition-assistant/unitConversions";
import type { FormErrors, NutritionFormValues, NutritionResult } from "@/lib/nutrition-assistant/types";
import { NutritionInputForm } from "./NutritionInputForm";
import { NutritionResultReport } from "./NutritionResultReport";

export function NutritionAssistant() {
  const { t: translate } = useTranslation();
  const t = (key: string) => translate(`nutritionAssistant.${key}`);
  const [values, setValues] = useState<NutritionFormValues>(DEFAULT_NUTRITION_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [result, setResult] = useState<NutritionResult | null>(null);

  function updateValue<K extends keyof NutritionFormValues>(key: K, value: NutritionFormValues[K]) {
    setValues((current) => {
      if (key !== "unitSystem" || current.unitSystem === value) return { ...current, [key]: value };
      const nextUnit = value as NutritionFormValues["unitSystem"];
      const convert = (entry: string) => {
        if (!entry) return "";
        return String(Number(kgToDisplay(weightToKg(Number(entry), current.unitSystem), nextUnit).toFixed(2)));
      };
      return {
        ...current,
        unitSystem: nextUnit,
        bodyWeight: convert(current.bodyWeight),
        matureWeight: convert(current.matureWeight),
        averageDailyGain: convert(current.averageDailyGain),
      };
    });
    setErrors((current) => ({ ...current, [key]: undefined }));
    if (key !== "unitSystem") setResult(null);
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const nextErrors = validateNutritionForm(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setResult(calculateNutrientRequirements(toMetricInput(values)));
  }

  function reset() {
    setValues(DEFAULT_NUTRITION_FORM);
    setErrors({});
    setResult(null);
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-[#eee3db] bg-white shadow-sm">
        <div className="border-b border-[#f0e7e1] bg-gradient-to-l from-[#f4e9df] to-white p-6 sm:p-8">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#3b2b20] text-white">
              <Calculator className="h-7 w-7" />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-[#3b2b20] sm:text-3xl">{t("title")}</h1>
              <p className="mt-1 text-[#826f61]">{t("subtitle")}</p>
            </div>
          </div>
        </div>
        <div className="p-6 sm:p-8">
          <NutritionInputForm values={values} errors={errors} t={t} onChange={updateValue} onSubmit={submit} onReset={reset} />
        </div>
      </section>
      {result && <NutritionResultReport result={result} unitSystem={values.unitSystem} t={t} />}
    </div>
  );
}
