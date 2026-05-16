import { apiFetch } from './http';
import type { ApiResult, AuthResponseDto, LoginRequestDto } from './types';

export async function loginUser(payload: LoginRequestDto) {
  return apiFetch<ApiResult<AuthResponseDto>>('/api/users/login', {
    method: 'POST',
    body: payload,
    auth: false,
  });
}

export async function getCurrentUser() {
  return apiFetch<AuthResponseDto | ApiResult<AuthResponseDto>>('/api/users/me');
}
