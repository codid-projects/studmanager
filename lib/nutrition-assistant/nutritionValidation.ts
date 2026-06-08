import { VALIDATION_RANGES } from "./constants";
import { weightToKg } from "./unitConversions";
import type { FormErrors, MetricHorseInput, NutritionFormValues } from "./types";

const numberValue = (value: string) => Number(value);
const inRange = (value: number, min: number, max: number) =>
  Number.isFinite(value) && value >= min && value <= max;

export function validateNutritionForm(values: NutritionFormValues): FormErrors {
  const errors: FormErrors = {};
  const bodyWeightKg = weightToKg(numberValue(values.bodyWeight), values.unitSystem);

  if (!inRange(bodyWeightKg, VALIDATION_RANGES.bodyWeightKg.min, VALIDATION_RANGES.bodyWeightKg.max)) {
    errors.bodyWeight = "validation.bodyWeight";
  }
  if (values.activity === "pregnant" && !inRange(
    numberValue(values.gestationMonth),
    VALIDATION_RANGES.gestationMonth.min,
    VALIDATION_RANGES.gestationMonth.max,
  )) {
    errors.gestationMonth = "validation.gestationMonth";
  }
  if (values.activity === "lactating" && !inRange(
    numberValue(values.lactationMonth),
    VALIDATION_RANGES.lactationMonth.min,
    VALIDATION_RANGES.lactationMonth.max,
  )) {
    errors.lactationMonth = "validation.lactationMonth";
  }
  if (values.activity === "growing") {
    const matureWeightKg = weightToKg(numberValue(values.matureWeight), values.unitSystem);
    if (!inRange(
      matureWeightKg,
      VALIDATION_RANGES.matureWeightKg.min,
      VALIDATION_RANGES.matureWeightKg.max,
    ) || matureWeightKg < bodyWeightKg) {
      errors.matureWeight = "validation.matureWeight";
    }
    if (!inRange(
      numberValue(values.ageMonths),
      VALIDATION_RANGES.ageMonths.min,
      VALIDATION_RANGES.ageMonths.max,
    )) {
      errors.ageMonths = "validation.age";
    }
    const gainKg = weightToKg(numberValue(values.averageDailyGain), values.unitSystem);
    if (!inRange(
      gainKg,
      VALIDATION_RANGES.averageDailyGainKg.min,
      VALIDATION_RANGES.averageDailyGainKg.max,
    )) {
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
