import { apiFetch } from './http';
import type {
  ApiMessageResult,
  ApiResult,
  CreateNutritionPayload,
  NutritionRecordDto,
  NutritionTypeDto,
  NutritionTypeId,
  PagedResponse,
  UpdateNutritionPayload,
} from './types';

export function getNutrition(params: {
  type?: NutritionTypeId;
  search?: string;
  pageNumber?: number;
  pageSize?: number;
} = {}) {
  return apiFetch<ApiResult<PagedResponse<NutritionRecordDto>>>('/api/Nutrition', {
    query: {
      type: params.type,
      search: params.search,
      pageNumber: params.pageNumber ?? 1,
      pageSize: params.pageSize ?? 10,
    },
  });
}

export function createNutrition(payload: CreateNutritionPayload) {
  return apiFetch<ApiMessageResult>('/api/Nutrition', { method: 'POST', body: payload });
}

export function updateNutrition(id: number, payload: UpdateNutritionPayload) {
  return apiFetch<ApiMessageResult>(`/api/Nutrition/${id}`, {
    method: 'PUT',
    body: { ...payload, id },
  });
}

export function deleteNutrition(id: number) {
  return apiFetch<ApiMessageResult>(`/api/Nutrition/${id}`, { method: 'DELETE' });
}

export function deleteNutritionBatch(ids: number[]) {
  return apiFetch<ApiMessageResult>('/api/Nutrition/batch', { method: 'DELETE', body: ids });
}

export function getNutritionTypes() {
  return apiFetch<NutritionTypeDto[]>('/api/DropDowns/nutrition-types');
}
