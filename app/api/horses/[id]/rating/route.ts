import { NextRequest, NextResponse } from 'next/server';
import { ApiError, localizeApiMessage } from '@/lib/api/errors';
import { getHorseRating, saveHorseRating } from '@/lib/api/horses-service';
import type { HorseRatingPayload, LocaleCode } from '@/lib/api/types';

interface RouteProps { params: Promise<{ id: string }>; }

function localeOf(request: NextRequest) {
  return (request.nextUrl.searchParams.get('locale') === 'en' ? 'en' : 'ar') as LocaleCode;
}

function failure(error: unknown, locale: LocaleCode) {
  const status = error instanceof ApiError ? error.status : 500;
  const message = error instanceof Error ? error.message : null;
  return NextResponse.json(
    { succeeded: false, message: localizeApiMessage(message, locale), statusCode: status },
    { status },
  );
}

export async function GET(request: NextRequest, { params }: RouteProps) {
  const { id } = await params;
  try {
    return NextResponse.json({ succeeded: true, statusCode: 200, data: await getHorseRating(id) });
  } catch (error) {
    return failure(error, localeOf(request));
  }
}

export async function PUT(request: NextRequest, { params }: RouteProps) {
  const { id } = await params;
  try {
    const body = await request.json() as HorseRatingPayload;
    return NextResponse.json({ succeeded: true, statusCode: 200, data: await saveHorseRating(id, body) });
  } catch (error) {
    return failure(error, localeOf(request));
  }
}
