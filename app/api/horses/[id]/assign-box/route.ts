import { NextRequest, NextResponse } from 'next/server';
import { ApiError, localizeApiMessage } from '@/lib/api/errors';
import { assignHorseToHousing } from '@/lib/api/horses-service';
import type { LocaleCode } from '@/lib/api/types';

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteProps) {
  const { id } = await params;
  const locale = (
    request.nextUrl.searchParams.get('locale') === 'en' ? 'en' : 'ar'
  ) as LocaleCode;
  const box = request.nextUrl.searchParams.get('box') ?? '';
  const mapKey = request.nextUrl.searchParams.get('mapKey') ?? undefined;
  const entityType = request.nextUrl.searchParams.get('entityType') ?? undefined;
  const entityId = request.nextUrl.searchParams.get('entityId') ?? undefined;

  try {
    const result = await assignHorseToHousing(id, box, { mapKey, entityType, entityId });
    return NextResponse.json(result, { status: result.statusCode ?? 200 });
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
