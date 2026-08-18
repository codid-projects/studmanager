import { NextRequest, NextResponse } from 'next/server';
import { ApiError, localizeApiMessage } from '@/lib/api/errors';
import { apiFetch } from '@/lib/api/http';
import type { LocaleCode } from '@/lib/api/types';

const RESERVED_QUERY_KEYS = new Set(['__path', '__locale']);
const ALLOWED_METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);

type QueryValue = string | number | boolean | null | undefined;

function normalizeBackendPath(value: string | null) {
  const trimmed = value?.trim();
  if (!trimmed || trimmed.startsWith('http') || trimmed.startsWith('//')) {
    return null;
  }

  const url = new URL(
    trimmed.startsWith('/') ? trimmed : `/${trimmed}`,
    'http://studmanager.local',
  );
  const path = `${url.pathname}${url.search}`;

  if (path !== '/default' && !path.startsWith('/api/')) return null;

  return path;
}

function getForwardQuery(searchParams: URLSearchParams) {
  const query: Record<string, QueryValue> = {};

  searchParams.forEach((value, key) => {
    if (!RESERVED_QUERY_KEYS.has(key)) {
      query[key] = value;
    }
  });

  return query;
}

async function readRequestBody(request: NextRequest, method: string) {
  if (method === 'GET') return undefined;

  const contentType = request.headers.get('content-type') ?? '';
  if (contentType.includes('multipart/form-data')) {
    return request.formData();
  }

  if (contentType.includes('application/json')) {
    return request.json().catch(() => undefined);
  }

  return request.text().then((text) => text || undefined);
}

async function proxyRequest(request: NextRequest) {
  const method = request.method.toUpperCase();
  const locale = (
    request.nextUrl.searchParams.get('__locale') === 'en' ? 'en' : 'ar'
  ) as LocaleCode;
  const backendPath = normalizeBackendPath(
    request.nextUrl.searchParams.get('__path'),
  );

  if (!ALLOWED_METHODS.has(method) || !backendPath) {
    return NextResponse.json(
      { message: localizeApiMessage('Invalid API proxy request.', locale) },
      { status: 400 },
    );
  }

  try {
    const headers = new Headers();
    const acceptLanguage = request.headers.get('accept-language');
    if (acceptLanguage) headers.set('Accept-Language', acceptLanguage);

    const result = await apiFetch<unknown>(backendPath, {
      method,
      query: getForwardQuery(request.nextUrl.searchParams),
      body: await readRequestBody(request, method),
      headers,
    });

    return NextResponse.json(result);
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;
    const payload = error instanceof ApiError ? error.payload : null;
    const message = error instanceof Error ? error.message : null;

    return NextResponse.json(
      payload ?? {
        succeeded: false,
        message: localizeApiMessage(message, locale),
        statusCode: status,
      },
      { status },
    );
  }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
