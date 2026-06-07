'use client';

import { clientApiFetch } from './client';
import type {
  ApiMessageResult,
  ApiResult,
  CreateNutritionPayload,
  LocaleCode,
  NutritionRecordDto,
  NutritionTypeDto,
  NutritionTypeId,
  PagedResponse,
  UpdateNutritionPayload,
} from './types';

function unwrapNutritionPage(
  payload: ApiResult<PagedResponse<NutritionRecordDto>> | PagedResponse<NutritionRecordDto>,
): PagedResponse<NutritionRecordDto> | undefined {
  if ('statusCode' in payload) {
    return (payload as ApiResult<PagedResponse<NutritionRecordDto>>).data;
  }

  return payload as PagedResponse<NutritionRecordDto>;
}

export async function fetchNutrition(
  locale: LocaleCode,
  params: { type?: NutritionTypeId; search?: string; pageNumber?: number; pageSize?: number },
) {
  const payload = await clientApiFetch<
    ApiResult<PagedResponse<NutritionRecordDto>> | PagedResponse<NutritionRecordDto>
  >({
    backendPath: '/api/Nutrition',
    nextPath: '/api/nutrition',
    backendQuery: params,
    nextQuery: { ...params, locale },
    locale,
  });

  return unwrapNutritionPage(payload);
}

export function fetchNutritionTypes(locale: LocaleCode) {
  return clientApiFetch<NutritionTypeDto[]>({
    backendPath: '/api/DropDowns/nutrition-types',
    nextPath: '/api/nutrition/types',
    nextQuery: { locale },
    locale,
  });
}

export function saveNutrition(
  locale: LocaleCode,
  payload: CreateNutritionPayload | UpdateNutritionPayload,
  id?: number,
) {
  return clientApiFetch<ApiMessageResult>({
    method: id ? 'PUT' : 'POST',
    backendPath: id ? `/api/Nutrition/${id}` : '/api/Nutrition',
    nextPath: id ? `/api/nutrition/${id}` : '/api/nutrition',
    nextQuery: { locale },
    body: payload,
    locale,
  });
}

export function removeNutrition(locale: LocaleCode, id: number) {
  return clientApiFetch<ApiMessageResult>({
    method: 'DELETE',
    backendPath: `/api/Nutrition/${id}`,
    nextPath: `/api/nutrition/${id}`,
    nextQuery: { locale },
    locale,
  });
}

export function removeNutritionBatch(locale: LocaleCode, ids: number[]) {
  return clientApiFetch<ApiMessageResult>({
    method: 'DELETE',
    backendPath: '/api/Nutrition/batch',
    nextPath: '/api/nutrition/batch',
    nextQuery: { locale },
    body: ids,
    locale,
  });
}
