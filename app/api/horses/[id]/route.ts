import { NextRequest, NextResponse } from 'next/server';
import { ApiError, localizeApiMessage } from '@/lib/api/errors';
import { deleteHorse, getHorseWithListFallback } from '@/lib/api/horses-service';
import type { LocaleCode } from '@/lib/api/types';

interface HorseRouteProps {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: HorseRouteProps) {
  const { id } = await params;
  const locale = (request.nextUrl.searchParams.get('locale') === 'en' ? 'en' : 'ar') as LocaleCode;

  try {
    const result = await getHorseWithListFallback(id);
    return NextResponse.json(result);
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;
    const message = error instanceof Error ? error.message : null;

    return NextResponse.json(
      { message: localizeApiMessage(message, locale) },
      { status },
    );
  }
}

export async function DELETE(request: NextRequest, { params }: HorseRouteProps) {
  const { id } = await params;
  const locale = (request.nextUrl.searchParams.get('locale') === 'en' ? 'en' : 'ar') as LocaleCode;

  try {
    const result = await deleteHorse(id);
    return NextResponse.json(result ?? { succeeded: true, statusCode: 200 });
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;
    const message = error instanceof Error ? error.message : null;

    return NextResponse.json(
      { succeeded: false, message: localizeApiMessage(message, locale), statusCode: status },
      { status },
    );
  }
}
