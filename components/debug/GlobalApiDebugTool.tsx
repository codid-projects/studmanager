'use client';

import { useEffect, useMemo, useState } from 'react';
import { API_BASE_URL } from '@/lib/api/transport';
import { ApiDebugInspector, type ApiDebugEntry } from './ApiDebugInspector';

const API_BASE = API_BASE_URL;

function parseBody(body: BodyInit | null | undefined) {
  if (body instanceof FormData) {
    return Array.from(body.entries()).reduce<Record<string, unknown[]>>((acc, [key, value]) => {
      const displayValue = value instanceof File
        ? { name: value.name, type: value.type, size: value.size }
        : value;
      acc[key] = [...(acc[key] ?? []), displayValue];
      return acc;
    }, {});
  }

  if (!body || typeof body !== 'string') return body ?? null;

  try {
    return JSON.parse(body);
  } catch {
    return body;
  }
}

function parseResponse(text: string) {
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function endpointMeta(pathWithQuery: string, method: string, payload: unknown) {
  const url = new URL(pathWithQuery, window.location.origin);
  const path = url.pathname;
  const isBackendDirect = url.origin === API_BASE;
  const nextServicePrefix = isBackendDirect
    ? 'Direct browser transport: lib/api/client.ts. Phase 2 switch: npm run api:server.'
    : '';

  if (path === '/api/auth/login') {
    return {
      label: 'Login',
      backendEndpoint: `${API_BASE}/api/users/login`,
      nextEndpoint: '/api/auth/login',
      nextService: 'app/api/auth/login/route.ts -> lib/api/auth-service.ts:loginUser',
    };
  }

  if (path === '/api/users/login') {
    return {
      label: 'Login',
      backendEndpoint: `${API_BASE}/api/users/login`,
      nextEndpoint: '/api/auth/login',
      nextService: nextServicePrefix,
    };
  }

  if (path === '/api/horses') {
    const pageNumber = url.searchParams.get('pageNumber') ?? '1';
    const pageSize = url.searchParams.get('pageSize') ?? '24';
    const search = url.searchParams.get('search');
    const backend = new URL(`${API_BASE}/api/Horses`);
    backend.searchParams.set('pageNumber', pageNumber);
    backend.searchParams.set('pageSize', pageSize);
    if (search) backend.searchParams.set('search', search);

    return {
      label: 'Horses list',
      backendEndpoint: backend.toString(),
      nextEndpoint: `${path}${url.search}`,
      nextService: 'app/api/horses/route.ts -> lib/api/horses-service.ts:getHorses',
    };
  }

  if (path === '/api/Horses') {
    const pageNumber = url.searchParams.get('pageNumber') ?? '1';
    const pageSize = url.searchParams.get('pageSize') ?? '24';
    const serverProxy = new URL('/api/horses', window.location.origin);
    serverProxy.searchParams.set('pageNumber', pageNumber);
    serverProxy.searchParams.set('pageSize', pageSize);

    return {
      label: method === 'POST' ? 'Create horse' : 'Horses list',
      backendEndpoint: url.toString(),
      nextEndpoint: `${serverProxy.pathname}${serverProxy.search}`,
      nextService: method === 'POST'
        ? `${nextServicePrefix} Server fallback: app/api/horses/route.ts -> lib/api/horses-service.ts:createHorse`
        : nextServicePrefix,
    };
  }

  const horseDetailMatch = path.match(/^\/api\/Horses\/([^/]+)$/);
  if (horseDetailMatch) {
    return {
      label: 'Horse profile detail',
      backendEndpoint: url.toString(),
      nextEndpoint: `Server render: /[locale]/horses/${horseDetailMatch[1]}`,
      nextService: `${nextServicePrefix} Server fallback: app/[locale]/horses/[id]/page.tsx -> lib/api/horses-service.ts:getHorseWithListFallback`,
    };
  }

  if (path === '/api/horses/studbook') {
    const backend = new URL(`${API_BASE}/api/ExternalHorses/search-external-horses`);
    backend.searchParams.set('SearchTerm', url.searchParams.get('search') ?? '');
    backend.searchParams.set('PageNumber', url.searchParams.get('pageNumber') ?? '1');
    backend.searchParams.set('PageSize', url.searchParams.get('pageSize') ?? '12');

    return {
      label: 'Studbook horse search',
      backendEndpoint: backend.toString(),
      nextEndpoint: `${path}${url.search}`,
      nextService: 'app/api/horses/studbook/route.ts -> lib/api/horses-service.ts:searchStudbookHorses',
    };
  }

  if (path === '/api/ExternalHorses/search-external-horses') {
    const serverProxy = new URL('/api/horses/studbook', window.location.origin);
    serverProxy.searchParams.set('search', url.searchParams.get('SearchTerm') ?? '');
    serverProxy.searchParams.set('pageNumber', url.searchParams.get('PageNumber') ?? '1');
    serverProxy.searchParams.set('pageSize', url.searchParams.get('PageSize') ?? '12');

    return {
      label: 'Studbook horse search',
      backendEndpoint: url.toString(),
      nextEndpoint: `${serverProxy.pathname}${serverProxy.search}`,
      nextService: nextServicePrefix,
    };
  }

  if (path === '/api/horses/import') {
    return {
      label: 'Import Studbook horse',
      backendEndpoint: `${API_BASE}/api/ExternalHorses/import-horse`,
      nextEndpoint: '/api/horses/import',
      nextService: 'app/api/horses/import/route.ts -> lib/api/horses-service.ts:importHorse',
    };
  }

  if (path === '/api/ExternalHorses/import-horse') {
    return {
      label: 'Import Studbook horse',
      backendEndpoint: `${API_BASE}/api/ExternalHorses/import-horse`,
      nextEndpoint: '/api/horses/import',
      nextService: nextServicePrefix,
    };
  }

  const relatedMatch = path.match(/^\/api\/ExternalHorses\/([^/]+)\/(offsprings|siblings)$/);
  if (relatedMatch) {
    return {
      label: relatedMatch[2] === 'offsprings' ? 'Horse offsprings' : 'Horse siblings',
      backendEndpoint: url.toString(),
      nextEndpoint: `Server render: /[locale]/horses/${relatedMatch[1]}`,
      nextService: `${nextServicePrefix} Server fallback: app/[locale]/horses/[id]/page.tsx -> lib/api/horses-service.ts`,
    };
  }

  return {
    label: `${method} ${path}`,
    backendEndpoint: 'Unknown backend endpoint',
    nextEndpoint: `${path}${url.search}`,
    nextService: 'Unknown Next service',
  };
}

function shouldInspect(input: RequestInfo | URL) {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
  const parsed = new URL(url, window.location.origin);

  return (
    (parsed.origin === window.location.origin && parsed.pathname.startsWith('/api/')) ||
    (parsed.origin === API_BASE && parsed.pathname.startsWith('/api/'))
  );
}

export function GlobalApiDebugTool() {
  const [entries, setEntries] = useState<ApiDebugEntry[]>([]);

  const addEntry = (entry: ApiDebugEntry) => {
    setEntries((current) => [entry, ...current].slice(0, 40));
  };

  useEffect(() => {
    const handleExternalEntry = (event: Event) => {
      const detail = (event as CustomEvent<ApiDebugEntry>).detail;
      if (!detail?.id) return;
      addEntry(detail);
    };

    window.addEventListener('api-debug-entry', handleExternalEntry);

    const originalFetch = window.fetch.bind(window);

    window.fetch = async (input, init) => {
      if (!shouldInspect(input)) {
        return originalFetch(input, init);
      }

      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      const parsed = new URL(url, window.location.origin);
      const method = (init?.method ?? (input instanceof Request ? input.method : 'GET')).toUpperCase();
      const payload = method === 'GET'
        ? Object.fromEntries(parsed.searchParams.entries())
        : parseBody(init?.body ?? (input instanceof Request ? null : null));
      const meta = endpointMeta(parsed.toString(), method, payload);
      const id = `${method}-${parsed.pathname}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      try {
        const response = await originalFetch(input, init);
        const text = await response.clone().text().catch(() => '');

        addEntry({
          id,
          label: meta.label,
          method,
          backendEndpoint: meta.backendEndpoint,
          nextEndpoint: meta.nextEndpoint,
          nextService: meta.nextService,
          replayUrl: parsed.toString(),
          payload,
          status: response.status,
          response: parseResponse(text),
          createdAt: new Date().toLocaleTimeString(),
        });

        return response;
      } catch (error) {
        addEntry({
          id,
          label: meta.label,
          method,
          backendEndpoint: meta.backendEndpoint,
          nextEndpoint: meta.nextEndpoint,
          nextService: meta.nextService,
          replayUrl: parsed.toString(),
          payload,
          error: error instanceof Error ? error.message : 'Request failed',
          createdAt: new Date().toLocaleTimeString(),
        });

        throw error;
      }
    };

    return () => {
      window.removeEventListener('api-debug-entry', handleExternalEntry);
      window.fetch = originalFetch;
    };
  }, []);

  const handlers = useMemo(
    () => ({
      clear: () => setEntries([]),
      replay: async (entry: ApiDebugEntry) => {
        const body = entry.method === 'GET' ? undefined : JSON.stringify(entry.payload ?? {});

        await fetch(entry.replayUrl ?? entry.nextEndpoint, {
          method: entry.method,
          headers: entry.method === 'GET' ? undefined : { 'Content-Type': 'application/json' },
          body,
        });
      },
    }),
    [],
  );

  return (
    <ApiDebugInspector
      entries={entries}
      onClear={handlers.clear}
      onReplay={handlers.replay}
    />
  );
}
