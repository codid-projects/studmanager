import type { HorseActivity, WorkIntensity } from "./types";

export const KG_PER_LB = 0.45359237;

export const VALIDATION_RANGES = {
  bodyWeightKg: { min: 100, max: 1200 },
  gestationMonth: { min: 1, max: 11 },
  lactationMonth: { min: 1, max: 6 },
  ageMonths: { min: 4, max: 36 },
  matureWeightKg: { min: 250, max: 1200 },
  averageDailyGainKg: { min: 0.05, max: 2 },
} as const;

export const ACTIVITY_OPTIONS: HorseActivity[] = [
  "maintenance",
  "stallion",
  "working",
  "lactating",
  "pregnant",
  "growing",
];

export const WORK_INTENSITIES: WorkIntensity[] = ["light", "moderate", "intense"];

export const NUTRIENT_IDS = [
  "dryMatter",
  "digestibleEnergy",
  "crudeProtein",
  "lysine",
  "calcium",
  "phosphorus",
  "magnesium",
  "potassium",
  "sodium",
  "sulfur",
  "iron",
  "zinc",
  "copper",
  "manganese",
  "iodine",
  "cobalt",
  "selenium",
  "vitaminA",
  "vitaminD",
  "vitaminE",
] as const;

// Editable coefficients based on commonly published NRC 1989 equation patterns.
// A qualified equine nutritionist must verify these before clinical ration formulation.
export const ACTIVITY_FACTORS = {
  maintenance: { dryMatter: 0.02, energy: 1, protein: 1 },
  stallion: { dryMatter: 0.022, energy: 1.2, protein: 1.15 },
  working: { dryMatter: 0.023, energy: 1.25, protein: 1.2 },
  lactating: { dryMatter: 0.027, energy: 1.65, protein: 1.75 },
  pregnant: { dryMatter: 0.02, energy: 1.11, protein: 1.2 },
  growing: { dryMatter: 0.025, energy: 1.35, protein: 1.55 },
} as const;

export const WORK_FACTORS: Record<WorkIntensity, number> = {
  light: 1.2,
  moderate: 1.4,
  intense: 1.6,
};
