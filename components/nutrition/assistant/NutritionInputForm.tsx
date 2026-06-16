import { WORK_INTENSITIES } from "@/lib/nutrition-assistant/constants";
import { weightUnit } from "@/lib/nutrition-assistant/unitConversions";
import type { FormErrors, NutritionFormValues } from "@/lib/nutrition-assistant/types";
import { ActivitySelector } from "./ActivitySelector";
import { FormField } from "./FormField";
import { UnitSelector } from "./UnitSelector";

interface NutritionInputFormProps {
  values: NutritionFormValues;
  errors: FormErrors;
  t: (key: string) => string;
  onChange: <K extends keyof NutritionFormValues>(key: K, value: NutritionFormValues[K]) => void;
  onSubmit: (event: React.FormEvent) => void;
  onReset: () => void;
}

const inputClass =
  "rounded-2xl border border-[#eadfd7] bg-[#fdfbf9] px-4 py-3.5 text-[#3b2b20] outline-none focus:border-[#9b7b61]";

export function NutritionInputForm({ values, errors, t, onChange, onSubmit, onReset }: NutritionInputFormProps) {
  const unit = weightUnit(values.unitSystem);
  const errorText = (key: keyof NutritionFormValues) =>
    errors[key] ? t(errors[key] as string) : undefined;

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <UnitSelector value={values.unitSystem} onChange={(value) => onChange("unitSystem", value)} t={t} />
      <ActivitySelector value={values.activity} onChange={(value) => onChange("activity", value)} t={t} />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={t("fields.bodyWeight")} unit={unit} error={errorText("bodyWeight")} hint={t("hints.bodyWeight")}>
          <input className={inputClass} type="number" step="0.1" value={values.bodyWeight} onChange={(e) => onChange("bodyWeight", e.target.value)} />
        </FormField>

        {values.activity === "working" && (
          <FormField label={t("fields.workIntensity")} hint={t("hints.workIntensity")}>
            <select className={inputClass} value={values.workIntensity} onChange={(e) => onChange("workIntensity", e.target.value as NutritionFormValues["workIntensity"])}>
              {WORK_INTENSITIES.map((level) => <option key={level} value={level}>{t(`intensities.${level}`)}</option>)}
            </select>
          </FormField>
        )}
        {values.activity === "lactating" && (
          <FormField label={t("fields.lactationMonth")} error={errorText("lactationMonth")} hint={t("hints.lactationMonth")}>
            <input className={inputClass} type="number" value={values.lactationMonth} onChange={(e) => onChange("lactationMonth", e.target.value)} />
          </FormField>
        )}
        {values.activity === "pregnant" && (
          <FormField label={t("fields.gestationMonth")} error={errorText("gestationMonth")} hint={t("hints.gestationMonth")}>
            <input className={inputClass} type="number" value={values.gestationMonth} onChange={(e) => onChange("gestationMonth", e.target.value)} />
          </FormField>
        )}
        {values.activity === "growing" && (
          <>
            <FormField label={t("fields.matureWeight")} unit={unit} error={errorText("matureWeight")} hint={t("hints.matureWeight")}>
              <input className={inputClass} type="number" step="0.1" value={values.matureWeight} onChange={(e) => onChange("matureWeight", e.target.value)} />
            </FormField>
            <FormField label={t("fields.ageMonths")} error={errorText("ageMonths")} hint={t("hints.ageMonths")}>
              <input className={inputClass} type="number" value={values.ageMonths} onChange={(e) => onChange("ageMonths", e.target.value)} />
            </FormField>
            <FormField label={t("fields.dailyGain")} unit={`${unit}/${t("day")}`} error={errorText("averageDailyGain")} hint={t("hints.dailyGain")}>
              <input className={inputClass} type="number" step="0.01" value={values.averageDailyGain} onChange={(e) => onChange("averageDailyGain", e.target.value)} />
            </FormField>
            <FormField label={t("fields.inTraining")} hint={t("hints.inTraining")}>
              <select className={inputClass} value={values.inTraining ? "yes" : "no"} onChange={(e) => onChange("inTraining", e.target.value === "yes")}>
                <option value="no">{t("no")}</option>
                <option value="yes">{t("yes")}</option>
              </select>
            </FormField>
          </>
        )}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button className="rounded-2xl bg-[#3b2b20] px-8 py-3.5 font-bold text-white hover:bg-[#513b2c]" type="submit">
          {t("calculate")}
        </button>
        <button className="rounded-2xl border border-[#dac9bc] px-8 py-3.5 font-bold text-[#6c5544] hover:bg-[#faf6f2]" type="button" onClick={onReset}>
          {t("reset")}
        </button>
      </div>
    </form>
  );
}
