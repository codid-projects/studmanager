import { NextRequest, NextResponse } from 'next/server';
import { ApiError, localizeApiMessage } from '@/lib/api/errors';
import { getAllHorseTagNames } from '@/lib/api/horses-service';
import type { LocaleCode } from '@/lib/api/types';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const locale = (searchParams.get('locale') === 'en' ? 'en' : 'ar') as LocaleCode;

  try {
    const names = await getAllHorseTagNames();

    return NextResponse.json({ succeeded: true, data: names });
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;
    const message = error instanceof Error ? error.message : null;

    return NextResponse.json(
      { message: localizeApiMessage(message, locale) },
      { status },
    );
  }
}
