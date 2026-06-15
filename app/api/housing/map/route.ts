import { NextRequest, NextResponse } from 'next/server';
import { ApiError, localizeApiMessage } from '@/lib/api/errors';
import { getHousingMap } from '@/lib/api/horses-service';
import type { LocaleCode } from '@/lib/api/types';

export async function GET(request: NextRequest) {
  const locale = (
    request.nextUrl.searchParams.get('locale') === 'en' ? 'en' : 'ar'
  ) as LocaleCode;
  const mapKey = request.nextUrl.searchParams.get('mapKey') ?? undefined;
  const entityType = request.nextUrl.searchParams.get('entityType') ?? undefined;
  const entityId = request.nextUrl.searchParams.get('entityId') ?? undefined;

  try {
    return NextResponse.json({
      succeeded: true,
      statusCode: 200,
      data: await getHousingMap({ mapKey, entityType, entityId }),
    });
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;
    const message = error instanceof Error ? error.message : null;

    return NextResponse.json(
      {
        succeeded: false,
        message: localizeApiMessage(message, locale),
        statusCode: status,
      },
      { status },
    );
  }
}
