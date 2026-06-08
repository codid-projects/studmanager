export type UnitSystem = "metric" | "imperial";
export type HorseActivity =
  | "maintenance"
  | "stallion"
  | "working"
  | "lactating"
  | "pregnant"
  | "growing";
export type WorkIntensity = "light" | "moderate" | "intense";

export interface NutritionFormValues {
  unitSystem: UnitSystem;
  activity: HorseActivity;
  bodyWeight: string;
  workIntensity: WorkIntensity;
  lactationMonth: string;
  gestationMonth: string;
  matureWeight: string;
  ageMonths: string;
  averageDailyGain: string;
  inTraining: boolean;
}

export interface MetricHorseInput {
  activity: HorseActivity;
  bodyWeightKg: number;
  workIntensity?: WorkIntensity;
  lactationMonth?: number;
  gestationMonth?: number;
  matureWeightKg?: number;
  ageMonths?: number;
  averageDailyGainKg?: number;
  inTraining?: boolean;
}

export type FormErrors = Partial<Record<keyof NutritionFormValues, string>>;

export interface NutrientRequirement {
  id: string;
  total: number;
  totalUnit: "kg/day" | "g/day" | "mg/day" | "Mcal/day" | "IU/day";
  concentration?: number;
  concentrationUnit?: "% BW" | "% diet" | "Mcal/kg";
}

export interface NutritionResult {
  input: MetricHorseInput;
  requirements: NutrientRequirement[];
}
