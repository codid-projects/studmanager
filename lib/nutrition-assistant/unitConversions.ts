import { KG_PER_LB } from "./constants";
import type { UnitSystem } from "./types";

export function weightToKg(value: number, unitSystem: UnitSystem) {
  return unitSystem === "imperial" ? value * KG_PER_LB : value;
}

export function kgToDisplay(value: number, unitSystem: UnitSystem) {
  return unitSystem === "imperial" ? value / KG_PER_LB : value;
}

export function mcalPerKgToDisplay(value: number, unitSystem: UnitSystem) {
  return unitSystem === "imperial" ? value * KG_PER_LB : value;
}

export function weightUnit(unitSystem: UnitSystem) {
  return unitSystem === "imperial" ? "lb" : "kg";
}
