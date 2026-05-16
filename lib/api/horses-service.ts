import { apiFetch } from './http';
import type {
  ApiResult,
  CreateHorsePayload,
  HorseInfoDto,
  HorseListItemDto,
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

export async function getHorses(params: {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
} = {}) {
  return apiFetch<PagedResponse<HorseListItemDto>>('/api/Horses', {
    query: {
      pageNumber: params.pageNumber ?? 1,
      pageSize: params.pageSize ?? 24,
      search: params.search,
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
    owner: null,
    breeder: null,
  };
}

export async function getHorseWithListFallback(localId: string | number) {
  try {
    return await getHorse(localId);
  } catch (error) {
    const id = Number(localId);

    if (!Number.isFinite(id)) throw error;

    const horses = await getHorses({ pageNumber: 1, pageSize: 100 });
    const fallback = horses.data.find((horse) => horse.id === id);

    if (!fallback) throw error;

    return toHorseInfoFallback(fallback);
  }
}

export async function searchStudbookHorses(params: {
  searchTerm?: string;
  pageNumber?: number;
  pageSize?: number;
} = {}) {
  const payload = await apiFetch<
    ApiResult<PagedResponse<StudbookHorseDto>> | PagedResponse<StudbookHorseDto>
  >('/api/ExternalHorses/search-external-horses', {
    query: {
      SearchTerm: params.searchTerm,
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
