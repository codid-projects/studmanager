import { apiFetch } from './http';
import type {
  ApiResult,
  CreateHorsePayload,
  HorseInfoDto,
  HousingMapDto,
  HorseListItemDto,
  HorseRatingPayload,
  HorseRatingResponse,
  HorseSiblingsDto,
  ImportHorseDto,
  PagedResponse,
  RelatedHorseDto,
  StudbookHorseDto,
} from './types';
import { buildCreateHorseFormData } from './create-horse-form-data';

function unwrapResult<T>(payload: T | ApiResult<T>): T {
  if (payload && typeof payload === 'object' && 'data' in payload && 'statusCode' in payload) {
    return (payload as ApiResult<T>).data as T;
  }

  return payload as T;
}

function getHorseLocalId(horse: HorseListItemDto) {
  return horse.localId ?? horse.id;
}

export async function getHorses(params: {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  gender?: string;
  strain?: string;
  line?: string;
  microship?: string;
  isActive?: boolean;
} = {}) {
  return apiFetch<PagedResponse<HorseListItemDto>>('/api/Horses', {
    query: {
      pageNumber: params.pageNumber ?? 1,
      pageSize: params.pageSize ?? 24,
      search: params.search,
      gender: params.gender,
      strain: params.strain,
      line: params.line,
      microship: params.microship,
      isActive: params.isActive,
    },
  });
}

export async function getHorse(localId: string | number) {
  const payload = await apiFetch<ApiResult<HorseInfoDto>>(`/api/Horses/${localId}`);
  return unwrapResult(payload);
}

function toHorseInfoFallback(horse: HorseListItemDto): HorseInfoDto {
  return {
    ...horse,
    studbookId: null,
    bornIn: null,
    currentlyIn: null,
    height: null,
    additionalInformation: null,
    type: null,
    faceSpecialMarkings: null,
    frontRightLeg: null,
    frontLeftLeg: null,
    backRightLeg: null,
    backLeftLeg: null,
    specialNotes: null,
    registrationNumber: null,
    microchipID: null,
    uelnNumber: null,
    internationalFEIRegistrationNumber: null,
    nationalSportRegistrationNumber: null,
    passportNumber: null,
    images: [],
    videos: [],
    isStallion: false,
    isMare: false,
    isStrain: false,
    isSpecial: false,
    isSold: horse.isSold ?? false,
    owner: null,
    breeder: null,
    box: null,
  };
}

export async function getHorseWithListFallback(localId: string | number) {
  try {
    return await getHorse(localId);
  } catch (error) {
    const id = Number(localId);

    if (!Number.isFinite(id)) throw error;

    const horses = await getHorses({ pageNumber: 1, pageSize: 100 });
    const fallback = horses.data.find((horse) => getHorseLocalId(horse) === id);

    if (!fallback) throw error;

    return toHorseInfoFallback(fallback);
  }
}

export async function searchStudbookHorses(params: {
  searchTerm?: string;
  gender?: string;
  pageNumber?: number;
  pageSize?: number;
} = {}) {
  const payload = await apiFetch<
    ApiResult<PagedResponse<StudbookHorseDto>> | PagedResponse<StudbookHorseDto>
  >('/api/ExternalHorses/search-external-horses', {
    query: {
      SearchTerm: params.searchTerm,
      Gender: params.gender,
      PageNumber: params.pageNumber ?? 1,
      PageSize: params.pageSize ?? 12,
    },
  });

  return unwrapResult(payload);
}

export async function importHorse(payload: ImportHorseDto) {
  return apiFetch<ApiResult<number>>('/api/ExternalHorses/import-horse', {
    method: 'POST',
    body: payload,
  });
}

export async function createHorse(payload: CreateHorsePayload | FormData) {
  return apiFetch<ApiResult<number>>('/api/Horses', {
    method: 'POST',
    body: payload instanceof FormData ? payload : buildCreateHorseFormData(payload),
  });
}

export async function updateHorse(localId: string | number, payload: CreateHorsePayload | FormData) {
  return apiFetch<ApiResult<number> | ApiResult<null> | ApiResult<boolean>>(`/api/Horses/${localId}`, {
    method: 'PUT',
    body: payload instanceof FormData ? payload : buildCreateHorseFormData(payload),
  });
}

export async function deleteHorse(localId: string | number) {
  return apiFetch<ApiResult<null> | ApiResult<boolean> | null>(`/api/Horses/${localId}`, {
    method: 'DELETE',
  });
}

export async function setHorseSoldStatus(localId: string | number, isSold: boolean) {
  return apiFetch<ApiResult<boolean>>(`/api/Horses/${localId}/sold`, {
    method: 'PATCH',
    body: { isSold },
  });
}

export async function getHorseRating(localId: string | number) {
  const payload = await apiFetch<ApiResult<HorseRatingResponse>>(
    `/api/Horses/${localId}/rating`,
  );
  return unwrapResult(payload);
}

export async function saveHorseRating(localId: string | number, rating: HorseRatingPayload) {
  const payload = await apiFetch<ApiResult<HorseRatingResponse>>(
    `/api/Horses/${localId}/rating`,
    { method: 'PUT', body: rating },
  );
  return unwrapResult(payload);
}

export async function getHousingMap(query?: {
  mapKey?: string | null;
  entityType?: string | null;
  entityId?: string | number | null;
}) {
  const payload = await apiFetch<ApiResult<HousingMapDto>>('/api/Housing/map', {
    query,
  });
  return unwrapResult(payload);
}

export async function assignHorseToHousing(
  localId: string | number,
  box: string,
) {
  return apiFetch<ApiResult<never>>(`/api/Horses/${localId}/assign-box`, {
    method: 'POST',
    query: { box },
    body: {},
  });
}

export async function getHorseOffsprings(localId: string | number, pageNumber = 1, pageSize = 15) {
  const payload = await apiFetch<ApiResult<PagedResponse<RelatedHorseDto>>>(
    `/api/ExternalHorses/${localId}/offsprings`,
    { query: { pageNumber, pageSize } },
  );

  return unwrapResult(payload);
}

export async function getHorseSiblings(localId: string | number, pageNumber = 1, pageSize = 15) {
  const payload = await apiFetch<ApiResult<HorseSiblingsDto>>(
    `/api/ExternalHorses/${localId}/siblings`,
    { query: { pageNumber, pageSize } },
  );

  return unwrapResult(payload);
}
