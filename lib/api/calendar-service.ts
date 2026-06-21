import { apiFetch } from './http';
import type { ApiResult, CalendarEventDto, CalendarEventPayload } from './types';

function unwrapResult<T>(payload: T | ApiResult<T>): T {
  if (payload && typeof payload === 'object' && 'data' in payload && 'statusCode' in payload) {
    return (payload as ApiResult<T>).data as T;
  }

  return payload as T;
}

export async function getCalendarEvents(params: { from: string; to: string }) {
  const payload = await apiFetch<ApiResult<CalendarEventDto[]> | CalendarEventDto[]>('/api/Calendar', {
    query: params,
  });

  return unwrapResult(payload) ?? [];
}

export async function getFoalingAlerts(daysAhead: number) {
  return apiFetch('/api/Calendar/foaling-alerts', { query: { daysAhead } });
}

export async function createCalendarEvent(payload: CalendarEventPayload) {
  const result = await apiFetch<ApiResult<number>>('/api/Calendar', {
    method: 'POST',
    body: payload,
  });

  return unwrapResult(result);
}

export async function updateCalendarEvent(id: number, payload: CalendarEventPayload) {
  return apiFetch<ApiResult<null>>(`/api/Calendar/${id}`, {
    method: 'PUT',
    body: payload,
  });
}

export async function deleteCalendarEvent(id: number) {
  return apiFetch<ApiResult<null>>(`/api/Calendar/${id}`, {
    method: 'DELETE',
  });
}
