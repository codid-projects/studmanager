import type { NutritionFormValues } from "./types";

export const DEFAULT_NUTRITION_FORM: NutritionFormValues = {
  unitSystem: "metric",
  activity: "maintenance",
  bodyWeight: "",
  workIntensity: "light",
  lactationMonth: "",
  gestationMonth: "",
  matureWeight: "",
  ageMonths: "",
  averageDailyGain: "",
  inTraining: false,
};
