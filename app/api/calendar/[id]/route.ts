import { NextRequest, NextResponse } from 'next/server';
import { apiRouteError } from '@/lib/api/route-response';
import { deleteCalendarEvent, updateCalendarEvent } from '@/lib/api/calendar-service';
import type { LocaleCode } from '@/lib/api/types';

type RouteContext = {
  params: Promise<{ id: string }>;
};

function getLocale(request: NextRequest): LocaleCode {
  return request.nextUrl.searchParams.get('locale') === 'en' ? 'en' : 'ar';
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const locale = getLocale(request);
  const { id } = await context.params;

  try {
    const result = await updateCalendarEvent(Number(id), await request.json());
    return NextResponse.json(result);
  } catch (error) {
    return apiRouteError(error, locale);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const locale = getLocale(request);
  const { id } = await context.params;

  try {
    const result = await deleteCalendarEvent(Number(id));
    return NextResponse.json(result);
  } catch (error) {
    return apiRouteError(error, locale);
  }
}
