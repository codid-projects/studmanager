'use client';

import { clientApiFetch } from './client';
import type {
  ApiResult,
  LocaleCode,
  PagedResponse,
  SummarizedContactDto,
} from './types';

// Backend route slugs under /api/health-care (HealthCareController).
export type HealthCategorySlug =
  | 'injuries'
  | 'blood-tests'
  | 'worm-doses'
  | 'hoof-care'
  | 'medical-care'
  | 'medications'
  | 'x-rays'
  | 'vaccinations'
  | 'growth';

// Mirrors HealthCareRecordSummaryDto.
export interface HealthRecordSummary {
  id: number;
  horseId: number;
  horseNameEn: string | null;
  horseNameAr: string | null;
  cost: number | null;
  recordDate: string | null;
  recordTypeNameEn: string | null;
  recordTypeNameAr: string | null;
  procedureTypeNameEn: string | null;
  procedureTypeNameAr: string | null;
  procedureReasonNameEn: string | null;
  procedureReasonNameAr: string | null;
  veterinarianName: string | null;
  phoneNumber: string | null;
}

// Mirrors HealthCareRecordDto (superset across all record kinds).
export interface HealthRecordDetail {
  id: number;
  horseId: number;
  horseNameEn: string | null;
  horseNameAr: string | null;
  veterinarianId: number | null;
  veterinarianName: string | null;
  phoneNumber: string | null;
  recordDate: string | null;
  notifyOnDate: string | null;
  isNotified: boolean;
  cost: number | null;
  notes: string | null;
  injuryTypeId: number | null;
  injuryReason: string | null;
  severity: number | null;
  bloodTestTypeId: number | null;
  isPositive: boolean | null;
  doseTypeId: number | null;
  quantity: number | null;
  shoeingTypeId: number | null;
  hoofTrimmingTypeId: number | null;
  careTypeId: number | null;
  treatmentTypeId: number | null;
  treatmentReasonId: number | null;
  xRayTypeId: number | null;
  vaccineTypeId: number | null;
  reasonTypeId: number | null;
  dose: number | null;
  heightCm: number | null;
  weightKg: number | null;
  attachments: Array<{ id: number; fileUrl: string | null }>;
}

// Mirrors SettingRecordDto (lookup values managed under Settings).
export interface SettingRecord {
  id: number;
  englishName: string;
  arabicName: string;
}

type QueryValue = string | number | boolean | null | undefined;

function unwrap<T>(payload: ApiResult<T> | T): T {
  if (payload && typeof payload === 'object' && 'data' in payload && !Array.isArray(payload)) {
    return (payload as ApiResult<T>).data as T;
  }
  return payload as T;
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

export async function listHealthRecords(
  locale: LocaleCode,
  slug: HealthCategorySlug,
  params: { horseId?: number; search?: string; pageNumber?: number; pageSize?: number } = {},
) {
  const payload = await request<ApiResult<PagedResponse<HealthRecordSummary>>>(
    locale,
    'GET',
    `/api/health-care/${slug}`,
    {
      query: {
        horseId: params.horseId,
        search: params.search,
        pageNumber: params.pageNumber ?? 1,
        pageSize: params.pageSize ?? 10,
      },
    },
  );
  return unwrap(payload);
}

export async function getHealthRecord(locale: LocaleCode, slug: HealthCategorySlug, id: number) {
  const payload = await request<ApiResult<HealthRecordDetail>>(
    locale,
    'GET',
    `/api/health-care/${slug}/${id}`,
  );
  return unwrap(payload);
}

export function createHealthRecord(locale: LocaleCode, slug: HealthCategorySlug, form: FormData) {
  return request<ApiResult<null>>(locale, 'POST', `/api/health-care/${slug}`, { body: form });
}

export function updateHealthRecord(
  locale: LocaleCode,
  slug: HealthCategorySlug,
  id: number,
  form: FormData,
) {
  return request<ApiResult<null>>(locale, 'PUT', `/api/health-care/${slug}/${id}`, { body: form });
}

export function deleteHealthRecord(locale: LocaleCode, slug: HealthCategorySlug, id: number) {
  return request<ApiResult<null>>(locale, 'DELETE', `/api/health-care/${slug}/${id}`);
}

export function deleteHealthRecordsBatch(
  locale: LocaleCode,
  slug: HealthCategorySlug,
  ids: number[],
) {
  return request<ApiResult<null>>(locale, 'DELETE', `/api/health-care/${slug}/batch`, {
    body: ids,
  });
}

// Lookup values (RecordCategory enum on the backend picks the list).
export async function fetchSettingRecords(locale: LocaleCode, category: number) {
  const payload = await request<PagedResponse<SettingRecord>>(
    locale,
    'GET',
    '/api/Settings/records',
    { query: { category, pageNumber: 1, pageSize: 200 } },
  );
  return payload.data ?? [];
}

export function fetchHealthVeterinarians(locale: LocaleCode) {
  return clientApiFetch<SummarizedContactDto[]>({
    backendPath: '/api/DropDowns/veterinarians',
    nextPath: '/api/injury/veterinarians',
    nextQuery: { locale },
    locale,
  });
}

export function createHealthVeterinarian(
  locale: LocaleCode,
  payload: { name: string; phone?: string; email?: string },
) {
  return clientApiFetch<SummarizedContactDto>({
    method: 'POST',
    backendPath: '/api/DropDowns/veterinarians',
    nextPath: '/api/injury/veterinarians',
    nextQuery: { locale },
    body: payload,
    locale,
  });
}
