import { NextRequest, NextResponse } from 'next/server';
import { ApiError, localizeApiMessage } from '@/lib/api/errors';
import { setHorseDeceasedStatus } from '@/lib/api/horses-service';
import type { LocaleCode } from '@/lib/api/types';

interface RouteProps { params: Promise<{ id: string }>; }

export async function POST(request: NextRequest, { params }: RouteProps) {
  const { id } = await params;
  const locale = (request.nextUrl.searchParams.get('locale') === 'en' ? 'en' : 'ar') as LocaleCode;

  try {
    const body = await request.json();
    return NextResponse.json(await setHorseDeceasedStatus(id, {
      isDeceased: Boolean(body.isDeceased),
      deceasedAt: typeof body.deceasedAt === 'string' && body.deceasedAt ? body.deceasedAt : null,
      deceasedReason: typeof body.deceasedReason === 'string' && body.deceasedReason.trim()
        ? body.deceasedReason.trim()
        : null,
    }));
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;
    const message = error instanceof Error ? error.message : null;
    return NextResponse.json(
      { succeeded: false, message: localizeApiMessage(message, locale), statusCode: status },
      { status },
    );
  }
}
