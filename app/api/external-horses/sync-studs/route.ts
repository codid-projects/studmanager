import { NextRequest, NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api/http';
import { apiRouteError } from '@/lib/api/route-response';
import type { LocaleCode } from '@/lib/api/types';

export async function GET(request: NextRequest) {
  const locale = (request.nextUrl.searchParams.get('locale') === 'en' ? 'en' : 'ar') as LocaleCode;

  try {
    const result = await apiFetch('/api/ExternalHorses/sync_studs');
    return NextResponse.json(result ?? { succeeded: true });
  } catch (error) {
    return apiRouteError(error, locale);
  }
}
