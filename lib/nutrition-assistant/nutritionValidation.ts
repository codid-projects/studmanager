import { weightToKg } from "./unitConversions";
import type { FormErrors, MetricHorseInput, NutritionFormValues } from "./types";

const numberValue = (value: string) => Number(value);
const isUsableNumber = (value: number) => Number.isFinite(value) && value > 0;
const isUsableGain = (value: number) => Number.isFinite(value) && value >= 0;

export function validateNutritionForm(values: NutritionFormValues): FormErrors {
  const errors: FormErrors = {};
  const bodyWeightKg = weightToKg(numberValue(values.bodyWeight), values.unitSystem);

  if (!isUsableNumber(bodyWeightKg)) {
    errors.bodyWeight = "validation.bodyWeight";
  }
  if (values.activity === "pregnant" && !isUsableNumber(numberValue(values.gestationMonth))) {
    errors.gestationMonth = "validation.gestationMonth";
  }
  if (values.activity === "lactating" && !isUsableNumber(numberValue(values.lactationMonth))) {
    errors.lactationMonth = "validation.lactationMonth";
  }
  if (values.activity === "growing") {
    const matureWeightKg = weightToKg(numberValue(values.matureWeight), values.unitSystem);
    if (!isUsableNumber(matureWeightKg)) {
      errors.matureWeight = "validation.matureWeight";
    }
    if (!isUsableNumber(numberValue(values.ageMonths))) {
      errors.ageMonths = "validation.age";
    }
    const gainKg = weightToKg(numberValue(values.averageDailyGain), values.unitSystem);
    if (!isUsableGain(gainKg)) {
      errors.averageDailyGain = "validation.dailyGain";
    }
  }
  return errors;
}

export function toMetricInput(values: NutritionFormValues): MetricHorseInput {
  const input: MetricHorseInput = {
    activity: values.activity,
    bodyWeightKg: weightToKg(numberValue(values.bodyWeight), values.unitSystem),
  };
  if (values.activity === "working") input.workIntensity = values.workIntensity;
  if (values.activity === "pregnant") input.gestationMonth = numberValue(values.gestationMonth);
  if (values.activity === "lactating") input.lactationMonth = numberValue(values.lactationMonth);
  if (values.activity === "growing") {
    input.matureWeightKg = weightToKg(numberValue(values.matureWeight), values.unitSystem);
    input.ageMonths = numberValue(values.ageMonths);
    input.averageDailyGainKg = weightToKg(numberValue(values.averageDailyGain), values.unitSystem);
    input.inTraining = values.inTraining;
  }
  return input;
}
