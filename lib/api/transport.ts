export type ApiTransportMode = 'direct' | 'server';

function normalizeApiBaseUrl(value: string | undefined) {
  const trimmed = value?.trim().replace(/\/+$/, '');
  if (!trimmed) return '';

  try {
    return new URL(trimmed).toString().replace(/\/+$/, '');
  } catch {
    return '';
  }
}

const publicApiBaseUrl = normalizeApiBaseUrl(
  process.env.NEXT_PUBLIC_STUDMANAGER_API_URL,
);
const serverApiBaseUrl = normalizeApiBaseUrl(process.env.STUDMANAGER_API_URL);

export const API_BASE_URL = serverApiBaseUrl || publicApiBaseUrl;

export const API_TRANSPORT_MODE: ApiTransportMode =
  process.env.NEXT_PUBLIC_STUDMANAGER_API_MODE === 'direct' && publicApiBaseUrl
    ? 'direct'
    : 'server';

export const isDirectApiMode = API_TRANSPORT_MODE === 'direct';

export function getApiBaseUrl() {
  if (!API_BASE_URL) {
    throw new Error('Missing STUDMANAGER_API_URL environment variable.');
  }

  return API_BASE_URL;
}

export function buildBackendUrl(path: string) {
  if (path.startsWith('http')) return path;
  return new URL(path, getApiBaseUrl()).toString();
}

export function describeBackendEndpoint(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (!API_BASE_URL) return `STUDMANAGER_API_URL${normalizedPath}`;

  return new URL(normalizedPath, API_BASE_URL).toString();
}

export function resolveBackendAssetUrl(path: string) {
  if (path.startsWith('http')) return path;

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (API_BASE_URL) return new URL(normalizedPath, API_BASE_URL).toString();

  const proxyUrl = new URL('/api/backend-media', 'http://studmanager.local');
  proxyUrl.searchParams.set('__path', normalizedPath);

  return `${proxyUrl.pathname}${proxyUrl.search}`;
}
