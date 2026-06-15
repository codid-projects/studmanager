import { apiFetch } from "./http";
import type { ApiResult, LineageNameDto } from "./types";

type LineagePayload = LineageNameDto[] | ApiResult<LineageNameDto[]>;

function normalizeLineages(payload: LineagePayload): LineageNameDto[] {
  if (Array.isArray(payload)) return payload;
  return Array.isArray(payload?.data) ? payload.data : [];
}

export async function getStrains() {
  return normalizeLineages(
    await apiFetch<LineagePayload>("/api/DropDowns/strains"),
  );
}

export async function getSpecialLines() {
  return normalizeLineages(
    await apiFetch<LineagePayload>("/api/DropDowns/special-lines"),
  );
}
