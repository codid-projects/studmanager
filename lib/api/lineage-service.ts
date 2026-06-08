import { apiFetch } from "./http";
import type { LineageNameDto } from "./types";

export function getStrains() {
  return apiFetch<LineageNameDto[]>("/api/DropDowns/strains");
}

export function getSpecialLines() {
  return apiFetch<LineageNameDto[]>("/api/DropDowns/special-lines");
}
