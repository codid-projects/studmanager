import { ACTIVITY_FACTORS, WORK_FACTORS } from "./constants";
import type { MetricHorseInput, NutrientRequirement, NutritionResult } from "./types";

const round = (value: number, digits = 2) => Number(value.toFixed(digits));

function lifeStageFactor(input: MetricHorseInput) {
  if (input.activity === "working") return WORK_FACTORS[input.workIntensity ?? "light"];
  if (input.activity === "pregnant") return 1 + Math.max(0, (input.gestationMonth ?? 1) - 8) * 0.08;
  if (input.activity === "lactating") return Math.max(1.25, 1.8 - ((input.lactationMonth ?? 1) - 1) * 0.1);
  if (input.activity === "growing") {
    const gain = input.averageDailyGainKg ?? 0;
    return 1 + gain * 0.45 + (input.inTraining ? 0.1 : 0);
  }
  return 1;
}

function requirement(
  id: string,
  total: number,
  totalUnit: NutrientRequirement["totalUnit"],
  concentration?: number,
  concentrationUnit?: NutrientRequirement["concentrationUnit"],
): NutrientRequirement {
  return { id, total: round(total), totalUnit, concentration: concentration === undefined ? undefined : round(concentration), concentrationUnit };
}

export function calculateNutrientRequirements(input: MetricHorseInput): NutritionResult {
  const weight = input.bodyWeightKg;
  const factors = ACTIVITY_FACTORS[input.activity];
  const stage = lifeStageFactor(input);
  const dryMatter = weight * factors.dryMatter * (input.activity === "working" ? stage / 1.2 : 1);
  const energy = 1.4 + 0.03 * weight * factors.energy * stage;
  const protein = energy * 40 * factors.protein;
  const proteinPercent = (protein / (dryMatter * 1000)) * 100;

  // These editable mineral/vitamin coefficients provide a complete planning
  // report and must be verified against NRC 1989 before clinical use.
  const requirements: NutrientRequirement[] = [
    requirement("dryMatter", dryMatter, "kg/day", (dryMatter / weight) * 100, "% BW"),
    requirement("digestibleEnergy", energy, "Mcal/day", energy / dryMatter, "Mcal/kg"),
    requirement("crudeProtein", protein, "g/day", proteinPercent, "% diet"),
    requirement("lysine", protein * 0.043, "g/day"),
    requirement("calcium", weight * 0.04 * stage, "g/day"),
    requirement("phosphorus", weight * 0.028 * stage, "g/day"),
    requirement("magnesium", weight * 0.015, "g/day"),
    requirement("potassium", dryMatter * 3.5, "g/day"),
    requirement("sodium", dryMatter * 1.8 * stage, "g/day"),
    requirement("sulfur", dryMatter * 1.5, "g/day"),
    requirement("iron", dryMatter * 40, "mg/day"),
    requirement("zinc", dryMatter * 40 * stage, "mg/day"),
    requirement("copper", dryMatter * 10 * stage, "mg/day"),
    requirement("manganese", dryMatter * 40, "mg/day"),
    requirement("iodine", dryMatter * 0.35, "mg/day"),
    requirement("cobalt", dryMatter * 0.1, "mg/day"),
    requirement("selenium", dryMatter * 0.1, "mg/day"),
    requirement("vitaminA", weight * 30 * stage, "IU/day"),
    requirement("vitaminD", weight * 6.6, "IU/day"),
    requirement("vitaminE", weight * 1.6 * stage, "IU/day"),
  ];

  return { input, requirements };
}
