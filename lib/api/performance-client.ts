'use client';

import { clientApiFetch } from './client';
import type {
  ApiMessageResult,
  ApiResult,
  CreatePerformancePayload,
  LocaleCode,
  PerformanceRecordDto,
  PerformanceRecordTypeId,
  PagedResponse,
  SummarizedContactDto,
  TypeDto,
  UpdatePerformancePayload,
} from './types';

function unwrapPerformancePage(
  payload: ApiResult<PagedResponse<PerformanceRecordDto>> | PagedResponse<PerformanceRecordDto>,
) {
  if ('statusCode' in payload) {
    return (payload as ApiResult<PagedResponse<PerformanceRecordDto>>).data;
  }

  return payload as PagedResponse<PerformanceRecordDto>;
}

export async function fetchPerformance(
  locale: LocaleCode,
  params: { type: PerformanceRecordTypeId; search?: string; pageNumber?: number; pageSize?: number },
) {
  const payload = await clientApiFetch<
    ApiResult<PagedResponse<PerformanceRecordDto>> | PagedResponse<PerformanceRecordDto>
  >({
    backendPath: '/api/Performance',
    nextPath: '/api/performance',
    backendQuery: params,
    nextQuery: { ...params, locale },
    locale,
  });

  return unwrapPerformancePage(payload);
}

export function savePerformance(
  locale: LocaleCode,
  payload: CreatePerformancePayload | UpdatePerformancePayload,
  id?: number,
) {
  return clientApiFetch<ApiMessageResult>({
    method: id ? 'PUT' : 'POST',
    backendPath: id ? `/api/Performance/${id}` : '/api/Performance',
    nextPath: id ? `/api/performance/${id}` : '/api/performance',
    nextQuery: { locale },
    body: payload,
    locale,
  });
}

export function removePerformance(locale: LocaleCode, id: number) {
  return clientApiFetch<ApiMessageResult>({
    method: 'DELETE',
    backendPath: `/api/Performance/${id}`,
    nextPath: `/api/performance/${id}`,
    nextQuery: { locale },
    locale,
  });
}

export function removePerformanceBatch(locale: LocaleCode, ids: number[]) {
  return clientApiFetch<ApiMessageResult>({
    method: 'DELETE',
    backendPath: '/api/Performance/batch',
    nextPath: '/api/performance/batch',
    nextQuery: { locale },
    body: ids,
    locale,
  });
}

export function fetchTrainingTypes(locale: LocaleCode) {
  return clientApiFetch<TypeDto[]>({
    backendPath: '/api/DropDowns/training-types',
    nextPath: '/api/performance/training-types',
    nextQuery: { locale },
    locale,
  });
}

export function fetchHaircutTypes(locale: LocaleCode) {
  return clientApiFetch<TypeDto[]>({
    backendPath: '/api/DropDowns/haircut-types',
    nextPath: '/api/performance/haircut-types',
    nextQuery: { locale },
    locale,
  });
}

export function fetchPerformanceContacts(locale: LocaleCode, kind: 'trainers' | 'barbers') {
  return clientApiFetch<SummarizedContactDto[]>({
    backendPath: `/api/DropDowns/${kind}`,
    nextPath: `/api/performance/${kind}`,
    nextQuery: { locale },
    locale,
  });
}

export function addPerformanceContact(
  locale: LocaleCode,
  kind: 'trainers' | 'barbers',
  payload: { name: string; phone?: string; email?: string },
) {
  return clientApiFetch<SummarizedContactDto>({
    method: 'POST',
    backendPath: `/api/DropDowns/${kind}`,
    nextPath: `/api/performance/${kind}`,
    nextQuery: { locale },
    body: payload,
    locale,
  });
}
