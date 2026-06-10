import { NextRequest, NextResponse } from 'next/server';
import { ApiError, localizeApiMessage } from '@/lib/api/errors';
import { createHorse, getHorses } from '@/lib/api/horses-service';
import type { LocaleCode } from '@/lib/api/types';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const locale = (searchParams.get('locale') === 'en' ? 'en' : 'ar') as LocaleCode;

  try {
    const result = await getHorses({
      pageNumber: Number(searchParams.get('pageNumber') ?? 1),
      pageSize: Number(searchParams.get('pageSize') ?? 24),
      search: searchParams.get('search') ?? undefined,
      gender: searchParams.get('gender') ?? undefined,
      strain: searchParams.get('strain') ?? undefined,
      line: searchParams.get('line') ?? undefined,
      microship: searchParams.get('microship') ?? undefined,
      isActive:
        searchParams.get('isActive') === null
          ? undefined
          : searchParams.get('isActive') === 'true',
    });

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

export async function POST(request: NextRequest) {
  const locale = (request.nextUrl.searchParams.get('locale') === 'en' ? 'en' : 'ar') as LocaleCode;

  try {
    const formData = await request.formData();
    const result = await createHorse(formData);

    return NextResponse.json(result, { status: result.statusCode ?? 201 });
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;
    const message = error instanceof Error ? error.message : null;

    return NextResponse.json(
      { succeeded: false, message: localizeApiMessage(message, locale), statusCode: status },
      { status },
    );
  }
}
