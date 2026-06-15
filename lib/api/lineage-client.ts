"use client";

import { clientApiFetch } from "./client";
import type { ApiResult, LineageNameDto, LocaleCode } from "./types";

type LineagePayload =
  | LineageNameDto[]
  | ApiResult<LineageNameDto[]>
  | ApiResult<{ data?: LineageNameDto[] }>;

function normalizeLineages(payload: LineagePayload): LineageNameDto[] {
  if (Array.isArray(payload)) return payload;

  const data = payload?.data;
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object" && Array.isArray(data.data)) {
    return data.data;
  }

  return [];
}

export async function fetchStrains(locale: LocaleCode) {
  const payload = await clientApiFetch<LineagePayload>({
    backendPath: "/api/DropDowns/strains",
    nextPath: "/api/dropdowns/strains",
    nextQuery: { locale },
    locale,
  });

  return normalizeLineages(payload);
}

export async function fetchSpecialLines(locale: LocaleCode) {
  const payload = await clientApiFetch<LineagePayload>({
    backendPath: "/api/DropDowns/special-lines",
    nextPath: "/api/dropdowns/special-lines",
    nextQuery: { locale },
    locale,
  });

  return normalizeLineages(payload);
}
