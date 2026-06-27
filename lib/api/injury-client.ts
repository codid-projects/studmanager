'use client';

import { clientApiFetch } from './client';
import type {
  ApiMessageResult,
  ApiResult,
  CreateInjuryPayload,
  InjuryRecordDto,
  InjurySeverityId,
  LocaleCode,
  PagedResponse,
  SummarizedContactDto,
  UpdateInjuryPayload,
} from './types';

function unwrapInjuryPage(
  payload: ApiResult<PagedResponse<InjuryRecordDto>> | PagedResponse<InjuryRecordDto>,
) {
  if ('statusCode' in payload) {
    return (payload as ApiResult<PagedResponse<InjuryRecordDto>>).data;
  }

  return payload as PagedResponse<InjuryRecordDto>;
}

export async function fetchInjuries(
  locale: LocaleCode,
  params: {
    severity?: InjurySeverityId;
    search?: string;
    horseId?: number;
    pageNumber?: number;
    pageSize?: number;
  },
) {
  const payload = await clientApiFetch<
    ApiResult<PagedResponse<InjuryRecordDto>> | PagedResponse<InjuryRecordDto>
  >({
    backendPath: '/api/Injury',
    nextPath: '/api/injury',
    backendQuery: params,
    nextQuery: { ...params, locale },
    locale,
  });

  return unwrapInjuryPage(payload);
}

export function saveInjury(
  locale: LocaleCode,
  payload: CreateInjuryPayload | UpdateInjuryPayload,
  id?: number,
) {
  return clientApiFetch<ApiMessageResult>({
    method: id ? 'PUT' : 'POST',
    backendPath: id ? `/api/Injury/${id}` : '/api/Injury',
    nextPath: id ? `/api/injury/${id}` : '/api/injury',
    nextQuery: { locale },
    body: payload,
    locale,
  });
}

export function removeInjury(locale: LocaleCode, id: number) {
  return clientApiFetch<ApiMessageResult>({
    method: 'DELETE',
    backendPath: `/api/Injury/${id}`,
    nextPath: `/api/injury/${id}`,
    nextQuery: { locale },
    locale,
  });
}

export function removeInjuryBatch(locale: LocaleCode, ids: number[]) {
  return clientApiFetch<ApiMessageResult>({
    method: 'DELETE',
    backendPath: '/api/Injury/batch',
    nextPath: '/api/injury/batch',
    nextQuery: { locale },
    body: ids,
    locale,
  });
}

export function fetchVeterinarians(locale: LocaleCode) {
  return clientApiFetch<SummarizedContactDto[]>({
    backendPath: '/api/DropDowns/veterinarians',
    nextPath: '/api/injury/veterinarians',
    nextQuery: { locale },
    locale,
  });
}
