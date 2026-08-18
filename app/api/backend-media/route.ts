import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthToken } from '@/lib/api/http';
import { buildBackendUrl } from '@/lib/api/transport';

function normalizeMediaPath(value: string | null) {
  const trimmed = value?.trim();
  if (!trimmed || trimmed.startsWith('http') || trimmed.startsWith('//')) {
    return null;
  }

  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

export async function GET(request: NextRequest) {
  const mediaPath = normalizeMediaPath(
    request.nextUrl.searchParams.get('__path'),
  );

  if (!mediaPath) {
    return NextResponse.json({ message: 'Invalid media path.' }, { status: 400 });
  }

  const headers = new Headers();
  const token = await getServerAuthToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(buildBackendUrl(mediaPath), {
    headers,
    cache: 'no-store',
  });

  const responseHeaders = new Headers();
  const contentType = response.headers.get('content-type');
  if (contentType) responseHeaders.set('Content-Type', contentType);

  return new NextResponse(response.body, {
    status: response.status,
    headers: responseHeaders,
  });
}
