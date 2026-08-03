import { clientApiFetch } from './client';
import type { ApiResult, HorseListItemDto, LocaleCode, PagedResponse } from './types';
import {
  createBreedingEvent,
  deleteBreedingEvent,
  getBreedingEvent,
  listBreedingEvents,
  updateBreedingEvent,
} from './breeding-event-client';

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
  currentStallionName?: string | null;
  lastFollowUpDate?: string | null;
  totalBreedingEvents: number;
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
  // Populated only for ovulation examinations.
  stallionName?: string | null;
};

export type MareExaminationDetail = {
  id: number;
  profileId: number;
  recordDate: string;
  recordType: number;
  veterinarianName: string | null;
  clinicalResult: number | null;
  clinicalResultEn: string | null;
  clinicalResultAr: string | null;
  expectedFoalingStartDate: string | null;
  expectedFoalingEndDate: string | null;
  stallionId?: number | null;
  stallionName?: string | null;
  // Existing related records returned by the detail endpoint. They must be
  // echoed back as keep-lists on update, otherwise the backend deletes them.
  attachments?: Array<{ id: number; fileUrl: string }>;
  billedServices?: Array<{
    id: number;
    serviceName: string;
    serviceType?: string | null;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
};

export type PreviousPregnancyStallion = {
  stallionId: number | null;
  stallionName: string | null;
  examinationId: number;
  recordDate: string;
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

export const listMareBreedingEvents = (
  locale: LocaleCode,
  profileId: number,
) => listBreedingEvents(locale, 'mare', profileId);

export const getMareBreedingEvent = (locale: LocaleCode, id: number) =>
  getBreedingEvent(locale, 'mare', id);

export const createMareBreedingEvent = (
  locale: LocaleCode,
  formData: FormData,
) => createBreedingEvent(locale, 'mare', formData);

export const updateMareBreedingEvent = (
  locale: LocaleCode,
  id: number,
  formData: FormData,
) => updateBreedingEvent(locale, 'mare', id, formData);

export const deleteMareBreedingEvent = (locale: LocaleCode, id: number) =>
  deleteBreedingEvent(locale, 'mare', id);

export async function listExaminations(
  locale: LocaleCode,
  profileId: number,
  kind: 'ovulation' | 'soundness',
  pageNumber = 1,
  pageSize = 50,
) {
  const result = await request<ApiResult<PagedResponse<ExaminationSummary>>>(
    locale,
    'GET',
    `/api/mare-breeding/${kind}-examinations`,
    { query: { profileId, pageNumber, pageSize } },
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

export async function getExamination(locale: LocaleCode, id: number) {
  return unwrap(await request<ApiResult<MareExaminationDetail>>(
    locale,
    'GET',
    `/api/mare-breeding/examinations/${id}`,
  ));
}

/**
 * Returns the sire recorded on the mare's newest successful pregnancy exam.
 *
 * The examination summary endpoint is ordered newest-first but does not expose
 * the clinical result or stallion id. Read the full records in small batches so
 * we can preserve whether the historical sire was a local horse id or free text.
 */
export async function getPreviousPregnancyStallion(
  locale: LocaleCode,
  profileId: number,
): Promise<PreviousPregnancyStallion | null> {
  const pageSize = 50;
  let pageNumber = 1;

  while (true) {
    const page = await listExaminations(
      locale,
      profileId,
      'ovulation',
      pageNumber,
      pageSize,
    );
    const summaries = page.data ?? [];

    for (let index = 0; index < summaries.length; index += 5) {
      const batch = summaries.slice(index, index + 5);
      const details = await Promise.all(
        batch.map((summary) => getExamination(locale, summary.id)),
      );
      const previousPregnancy = details.find(
        (detail) =>
          (detail.clinicalResult === 3 || detail.clinicalResult === 4) &&
          (Boolean(detail.stallionId) || Boolean(detail.stallionName?.trim())),
      );

      if (previousPregnancy) {
        return {
          stallionId: previousPregnancy.stallionId ?? null,
          stallionName: previousPregnancy.stallionName?.trim() || null,
          examinationId: previousPregnancy.id,
          recordDate: previousPregnancy.recordDate,
        };
      }
    }

    if (!page.hasNextPage || summaries.length === 0) return null;
    pageNumber += 1;
  }
}

export async function updateExamination(
  locale: LocaleCode,
  kind: 'ovulation' | 'soundness',
  id: number,
  formData: FormData,
) {
  return request<ApiResult<null>>(
    locale,
    'PUT',
    `/api/mare-breeding/${kind}-examinations/${id}`,
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
