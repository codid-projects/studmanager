export type ApiTransportMode = 'direct' | 'server';

const configuredApiBaseUrl = process.env.NEXT_PUBLIC_STUDMANAGER_API_URL?.trim();

export const API_BASE_URL =
  configuredApiBaseUrl || 'https://studmanagerapi-dev.studmarket.net';

export const API_TRANSPORT_MODE: ApiTransportMode =
  process.env.NEXT_PUBLIC_STUDMANAGER_API_MODE === 'server' ? 'server' : 'direct';

export const isDirectApiMode = API_TRANSPORT_MODE === 'direct';
