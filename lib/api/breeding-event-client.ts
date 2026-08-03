import { clientApiFetch } from "./client";
import type { ApiResult, LocaleCode, PagedResponse } from "./types";

export type BreedingEventApi = "mare" | "stallion";

export type BreedingEventRecord = {
  id: number;
  profileId: number;
  profileHorseId: number;
  profileHorseName: string | null;
  profileHorseNameAr: string | null;
  recordDate: string;
  recordType: number;
  veterinarianName: string | null;
  relatedHorseId: number | null;
  relatedHorseName: string | null;
  relatedHorseNameAr: string | null;
  totalCost: number;
  followUpDate: string | null;
  hasFollowUp: boolean;
};

export type BreedingEventDetail = BreedingEventRecord &
  Record<string, unknown> & {
    veterinarianComments?: string | null;
    followUpNotes?: string | null;
    surrogateMareId?: number | null;
    surrogateMareName?: string | null;
    surrogateMareNameAr?: string | null;
    inseminationMethod?: number | null;
    billedServices?: Array<{
      id: number;
      serviceName: string;
      serviceType?: string | null;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }>;
  };

export type BreedingPartner = {
  id: number | null;
  name: string | null;
  nameAr: string | null;
  eventOwnedByViewingProfile: boolean;
};

function unwrap<T>(value: ApiResult<T> | T): T {
  if (
    value &&
    typeof value === "object" &&
    "data" in value &&
    !Array.isArray(value)
  ) {
    return (value as ApiResult<T>).data as T;
  }
  return value as T;
}

function basePath(api: BreedingEventApi) {
  return `/api/${api}-breeding/breeding-events`;
}

export async function listBreedingEvents(
  locale: LocaleCode,
  api: BreedingEventApi,
  profileId: number,
) {
  const path = basePath(api);
  return unwrap(
    await clientApiFetch<ApiResult<PagedResponse<BreedingEventRecord>>>({
      method: "GET",
      backendPath: path,
      nextPath: path,
      query: { profileId, pageNumber: 1, pageSize: 50 },
      locale,
    }),
  );
}

export async function getBreedingEvent(
  locale: LocaleCode,
  api: BreedingEventApi,
  id: number,
) {
  const path = `${basePath(api)}/${id}`;
  return unwrap(
    await clientApiFetch<ApiResult<BreedingEventDetail>>({
      method: "GET",
      backendPath: path,
      nextPath: path,
      locale,
    }),
  );
}

export function createBreedingEvent(
  locale: LocaleCode,
  api: BreedingEventApi,
  formData: FormData,
) {
  const path = basePath(api);
  return clientApiFetch<ApiResult<number>>({
    method: "POST",
    backendPath: path,
    nextPath: path,
    body: formData,
    locale,
  });
}

export function updateBreedingEvent(
  locale: LocaleCode,
  api: BreedingEventApi,
  id: number,
  formData: FormData,
) {
  const path = `${basePath(api)}/${id}`;
  return clientApiFetch<ApiResult<null>>({
    method: "PUT",
    backendPath: path,
    nextPath: path,
    body: formData,
    locale,
  });
}

export function deleteBreedingEvent(
  locale: LocaleCode,
  api: BreedingEventApi,
  id: number,
) {
  const path = `${basePath(api)}/${id}`;
  return clientApiFetch<ApiResult<null>>({
    method: "DELETE",
    backendPath: path,
    nextPath: path,
    locale,
  });
}

export async function getLatestMareBreedingEvent(
  locale: LocaleCode,
  profileId: number,
) {
  const path = `${basePath("mare")}/latest`;
  return unwrap(
    await clientApiFetch<ApiResult<BreedingEventRecord | null>>({
      method: "GET",
      backendPath: path,
      nextPath: path,
      query: { profileId },
      locale,
    }),
  );
}

/**
 * Breeding events are returned in both directions. If the viewing profile owns
 * the event, its partner is relatedHorse. Otherwise, the viewing horse is the
 * related horse and its partner is the event's profile horse.
 */
export function resolveBreedingPartner(
  record: BreedingEventRecord,
  viewingProfileId: number,
): BreedingPartner {
  const eventOwnedByViewingProfile =
    Number(record.profileId) === Number(viewingProfileId);

  return eventOwnedByViewingProfile
    ? {
        id: record.relatedHorseId,
        name: record.relatedHorseName,
        nameAr: record.relatedHorseNameAr,
        eventOwnedByViewingProfile,
      }
    : {
        id: record.profileHorseId,
        name: record.profileHorseName,
        nameAr: record.profileHorseNameAr,
        eventOwnedByViewingProfile,
      };
}
