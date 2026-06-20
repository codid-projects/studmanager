import { clientApiFetch } from './client';
import type { ApiResult, HorseListItemDto, LocaleCode, PagedResponse } from './types';

export type BreedingProfile = {
  horseId: number;
  profileId: number;
  englishName: string | null;
  arabicName: string | null;
  gender: string | null;
  ownerEN: string | null;
  ownerAR: string | null;
  dateofBirth: string | null;
  color: string | null;
  horseProfileImage: string | null;
};

export type MareDashboard = {
  profileId: number;
  totalFoals: number;
  lastFoalNameAr: string | null;
  lastFoalNameEn: string | null;
  lastFoalingDate: string | null;
  currentEmbryosCount: number;
  surrogateStatsDisplay: string;
  totalEmbryosCount: number;
  totalPregnanciesCount: number;
  totalCycles: number;
};

export type ExaminationSummary = {
  id: number;
  recordDate: string;
  recordType: number;
  recordTypeEn?: string | null;
  reordTypeAr?: string | null;
  veterinarianName: string | null;
  attachmentCount: number;
  totalCost: number;
  hasFollowUp: boolean;
};

export type EstrusCycle = {
  id: number;
  startDate: string;
  endDate: string | null;
  durationDays: number | null;
  intensityGrade: number | null;
  intensityLabel: string | null;
  shortNotes?: string | null;
  notes?: string | null;
};

export type FoalRegistration = {
  id: number;
  birthDate: string;
  status: number;
  birthStatus: string;
  birthStatusAr: string;
  foalId: number;
  foalName: string;
  foalNameAr: string | null;
  stallionName: string | null;
  stallionNameAr: string | null;
  foalWeightKg: number | null;
};

type QueryValue = string | number | boolean | null | undefined;

function unwrap<T>(result: ApiResult<T> | T): T {
  if (result && typeof result === 'object' && 'data' in result && !Array.isArray(result)) {
    return (result as ApiResult<T>).data as T;
  }
  return result as T;
}

function request<T>(locale: LocaleCode, method: string, path: string, options?: {
  query?: Record<string, QueryValue>;
  body?: unknown;
}) {
  return clientApiFetch<T>({
    method,
    backendPath: path,
    nextPath: path,
    query: options?.query,
    body: options?.body,
    locale,
  });
}

export async function listBreedingHorses(locale: LocaleCode, gender: 'Female' | 'Male', search = '') {
  const result = await request<PagedResponse<HorseListItemDto>>(
    locale,
    'GET',
    '/api/Horses',
    { query: { pageNumber: 1, pageSize: 50, search, gender, isActive: true } },
  );
  return result.data ?? [];
}

export function getBreedingHorsesPage(
  locale: LocaleCode,
  gender: 'Female' | 'Male',
  search = '',
  pageNumber = 1,
  pageSize = 10,
) {
  return request<PagedResponse<HorseListItemDto>>(
    locale,
    'GET',
    '/api/Horses',
    { query: { pageNumber, pageSize, search, gender, isActive: true } },
  );
}

export const listMares = (locale: LocaleCode, search = '') =>
  listBreedingHorses(locale, 'Female', search);

export async function getOrCreateMareProfile(locale: LocaleCode, horseId: number) {
  return unwrap(await request<ApiResult<BreedingProfile>>(
    locale,
    'POST',
    `/api/Horses/${horseId}/breedingProfile`,
  ));
}

export async function getMareDashboard(locale: LocaleCode, profileId: number) {
  return unwrap(await request<ApiResult<MareDashboard>>(
    locale,
    'GET',
    `/api/mare-breeding/profiles/${profileId}/dashboard`,
  ));
}

export async function listExaminations(
  locale: LocaleCode,
  profileId: number,
  kind: 'ovulation' | 'soundness',
) {
  const result = await request<ApiResult<PagedResponse<ExaminationSummary>>>(
    locale,
    'GET',
    `/api/mare-breeding/${kind}-examinations`,
    { query: { profileId, pageNumber: 1, pageSize: 50 } },
  );
  return unwrap(result);
}

export async function createExamination(
  locale: LocaleCode,
  kind: 'ovulation' | 'soundness',
  formData: FormData,
) {
  return request<ApiResult<number>>(
    locale,
    'POST',
    `/api/mare-breeding/${kind}-examinations`,
    { body: formData },
  );
}

export async function deleteExamination(
  locale: LocaleCode,
  kind: 'ovulation' | 'soundness',
  id: number,
) {
  return request<ApiResult<null>>(locale, 'DELETE', `/api/mare-breeding/${kind}-examinations/${id}`);
}

export async function listCycles(locale: LocaleCode, profileId: number) {
  return unwrap(await request<ApiResult<PagedResponse<EstrusCycle>>>(
    locale,
    'GET',
    `/api/mare-breeding/profiles/${profileId}/cycles`,
    { query: { pageNumber: 1, pageSize: 50 } },
  ));
}

export async function createCycle(
  locale: LocaleCode,
  profileId: number,
  body: { startDate: string; endDate?: string | null; intensityGrade?: number | null; notes?: string },
) {
  return request<ApiResult<number>>(
    locale,
    'POST',
    `/api/mare-breeding/profiles/${profileId}/cycles`,
    { body },
  );
}

export async function deleteCycle(locale: LocaleCode, id: number) {
  return request<ApiResult<boolean>>(locale, 'DELETE', `/api/mare-breeding/cycles/${id}`);
}

export async function listFoals(locale: LocaleCode, profileId: number) {
  return unwrap(await request<ApiResult<PagedResponse<FoalRegistration>>>(
    locale,
    'GET',
    `/api/mare-breeding/profiles/${profileId}/foal-registrations`,
    { query: { pageNumber: 1, pageSize: 50 } },
  ));
}

export async function createFoal(locale: LocaleCode, profileId: number, formData: FormData) {
  return request<ApiResult<number>>(
    locale,
    'POST',
    `/api/mare-breeding/profiles/${profileId}/foal-registrations`,
    { body: formData },
  );
}

export async function deleteFoal(locale: LocaleCode, id: number) {
  return request<ApiResult<boolean>>(locale, 'DELETE', `/api/mare-breeding/foal-registrations/${id}`);
}
