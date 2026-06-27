export type ApiTransportMode = 'direct' | 'server';

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_STUDMANAGER_API_URL || 'http://localhost:5147';

export const API_TRANSPORT_MODE: ApiTransportMode =
  process.env.NEXT_PUBLIC_STUDMANAGER_API_MODE === 'server' ? 'server' : 'direct';

export const isDirectApiMode = API_TRANSPORT_MODE === 'direct';
