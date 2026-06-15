import { NextRequest, NextResponse } from 'next/server';
import { apiRouteError } from '@/lib/api/route-response';
import { createCalendarEvent, getCalendarEvents } from '@/lib/api/calendar-service';
import type { LocaleCode } from '@/lib/api/types';

function getLocale(request: NextRequest): LocaleCode {
  return request.nextUrl.searchParams.get('locale') === 'en' ? 'en' : 'ar';
}

export async function GET(request: NextRequest) {
  const locale = getLocale(request);
  const searchParams = request.nextUrl.searchParams;

  try {
    const result = await getCalendarEvents({
      from: searchParams.get('from') ?? '',
      to: searchParams.get('to') ?? '',
    });

    return NextResponse.json(result);
  } catch (error) {
    return apiRouteError(error, locale);
  }
}

export async function POST(request: NextRequest) {
  const locale = getLocale(request);

  try {
    const result = await createCalendarEvent(await request.json());
    return NextResponse.json(result);
  } catch (error) {
    return apiRouteError(error, locale);
  }
}
