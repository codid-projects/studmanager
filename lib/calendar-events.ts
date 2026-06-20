import type { CalendarEventDto } from "@/lib/api/types";

function dateKey(value: string) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function isGeneratedFollowUp(event: CalendarEventDto) {
  const title = `${event.title ?? ""} ${event.titleAr ?? ""}`.trim().toLowerCase();
  return title.includes("follow-up:") || title.includes("follow up:") || title.includes("متابعة:");
}

function duplicateKey(event: CalendarEventDto) {
  if (!isGeneratedFollowUp(event)) return `id:${event.id}`;

  const source = event.relatedEntityType || event.relatedEntityId
    ? `${event.relatedEntityType ?? ""}:${event.relatedEntityId ?? ""}`
    : `${event.type}:${event.title.trim().toLowerCase()}:${event.titleAr.trim()}`;

  return `follow-up:${source}:${dateKey(event.start)}`;
}

function descriptionLength(event: CalendarEventDto) {
  return (event.description?.trim().length ?? 0) + (event.descriptionAr?.trim().length ?? 0);
}

/**
 * The breeding API can return the same generated follow-up more than once.
 * Keep manual events distinct and retain the richest copy of a generated event.
 */
export function deduplicateCalendarEvents(events: CalendarEventDto[]) {
  const unique = new Map<string, CalendarEventDto>();

  for (const event of events) {
    const key = duplicateKey(event);
    const current = unique.get(key);
    if (!current || descriptionLength(event) > descriptionLength(current)) unique.set(key, event);
  }

  return [...unique.values()];
}
