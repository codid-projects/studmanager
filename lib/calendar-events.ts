import type { CalendarEventDto } from "@/lib/api/types";
import { calendarEventDateKey } from "@/lib/calendar-dates";

function isGeneratedFollowUp(event: CalendarEventDto) {
  const title = `${event.title ?? ""} ${event.titleAr ?? ""}`.trim().toLowerCase();
  return title.includes("follow-up:") || title.includes("follow up:") || title.includes("متابعة:");
}

function duplicateKey(event: CalendarEventDto) {
  const generated = Boolean(event.relatedEntityType || event.relatedEntityId);
  if (!generated) return `id:${event.id}`;

  const normalizedTitle = (event.title || event.titleAr)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
  const kind = isGeneratedFollowUp(event) ? "follow-up" : "primary";

  // Generated records with the same horse/type/title on one day are one
  // business event even if an earlier background task inserted another row.
  return `generated:${kind}:${event.type}:${normalizedTitle}:${calendarEventDateKey(event)}`;
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
