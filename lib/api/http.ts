import { cookies } from 'next/headers';
import { AUTH_TOKEN_COOKIE } from '@/lib/auth';
import { ApiError, getPayloadMessage } from './errors';
import { API_BASE_URL } from './transport';

type QueryValue = string | number | boolean | null | undefined;

interface ApiFetchOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  query?: Record<string, QueryValue>;
  token?: string | null;
  auth?: boolean;
  timeoutMs?: number;
}

function buildUrl(path: string, query?: Record<string, QueryValue>) {
  const url = new URL(path.startsWith('http') ? path : `${API_BASE_URL}${path}`);

  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
}

async function readJsonSafely(response: Response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function getServerAuthToken() {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_TOKEN_COOKIE)?.value ?? null;
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { body, query, headers, token, auth = true, timeoutMs = 20000, signal, ...init } = options;
  const resolvedToken = token ?? (auth ? await getServerAuthToken() : null);
  const timeoutSignal =
    typeof AbortSignal !== 'undefined' && 'timeout' in AbortSignal
      ? AbortSignal.timeout(timeoutMs)
      : undefined;

  const requestHeaders = new Headers(headers);
  requestHeaders.set('Accept', 'application/json');

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  if (body !== undefined && !isFormData) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  if (resolvedToken) {
    requestHeaders.set('Authorization', `Bearer ${resolvedToken}`);
  }

  const response = await fetch(buildUrl(path, query), {
    ...init,
    body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
    headers: requestHeaders,
    cache: 'no-store',
    signal: signal ?? timeoutSignal,
  });

  const payload = await readJsonSafely(response);

  if (!response.ok) {
    throw new ApiError(
      getPayloadMessage(payload) ?? response.statusText,
      response.status,
      payload,
    );
  }

  return payload as T;
}
