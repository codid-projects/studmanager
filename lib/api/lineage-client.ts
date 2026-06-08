"use client";

import { clientApiFetch } from "./client";
import type { LineageNameDto, LocaleCode } from "./types";

export function fetchStrains(locale: LocaleCode) {
  return clientApiFetch<LineageNameDto[]>({
    backendPath: "/api/DropDowns/strains",
    nextPath: "/api/dropdowns/strains",
    nextQuery: { locale },
    locale,
  });
}

export function fetchSpecialLines(locale: LocaleCode) {
  return clientApiFetch<LineageNameDto[]>({
    backendPath: "/api/DropDowns/special-lines",
    nextPath: "/api/dropdowns/special-lines",
    nextQuery: { locale },
    locale,
  });
}
