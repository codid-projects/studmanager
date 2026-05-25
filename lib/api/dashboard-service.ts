import { apiFetch } from './http';
import type {
  ActivityDto,
  ActivityTypeEnum,
  ApiResult,
  DashboardDto,
  PagedResponse,
} from './types';

function unwrapResult<T>(payload: T | ApiResult<T>): T {
  if (payload && typeof payload === 'object' && 'data' in payload && 'statusCode' in payload) {
    return (payload as ApiResult<T>).data as T;
  }

  return payload as T;
}

export async function getDashboard() {
  const payload = await apiFetch<ApiResult<DashboardDto> | DashboardDto>('/api/Dashboard');
  return unwrapResult(payload);
}

export async function getDashboardActivities(params: {
  type?: ActivityTypeEnum;
  pageNumber?: number;
  pageSize?: number;
} = {}) {
  const payload = await apiFetch<ApiResult<PagedResponse<ActivityDto>> | PagedResponse<ActivityDto>>(
    '/api/Dashboard/activities',
    {
      query: {
        type: params.type,
        pageNumber: params.pageNumber ?? 1,
        pageSize: params.pageSize ?? 10,
      },
    },
  );

  return unwrapResult(payload);
}
