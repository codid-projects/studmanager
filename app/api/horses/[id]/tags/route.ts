import { NextRequest, NextResponse } from 'next/server';
import { ApiError, localizeApiMessage } from '@/lib/api/errors';
import { addHorseTag, getHorseTags } from '@/lib/api/horses-service';
import type { LocaleCode } from '@/lib/api/types';

interface HorseTagsRouteProps {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: HorseTagsRouteProps) {
  const { id } = await params;
  const locale = (request.nextUrl.searchParams.get('locale') === 'en' ? 'en' : 'ar') as LocaleCode;
  const idType = request.nextUrl.searchParams.get('idType') ?? undefined;

  try {
    return NextResponse.json({ succeeded: true, statusCode: 200, data: await getHorseTags(id, idType) });
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;
    const message = error instanceof Error ? error.message : null;

    return NextResponse.json(
      { succeeded: false, message: localizeApiMessage(message, locale), statusCode: status },
      { status },
    );
  }
}

export async function POST(request: NextRequest, { params }: HorseTagsRouteProps) {
  const { id } = await params;
  const locale = (request.nextUrl.searchParams.get('locale') === 'en' ? 'en' : 'ar') as LocaleCode;
  const idType = request.nextUrl.searchParams.get('idType') ?? undefined;

  try {
    const body = await request.json();
    return NextResponse.json({
      succeeded: true,
      statusCode: 200,
      data: await addHorseTag(
        id,
        {
          name: body?.name ?? '',
          englishName: body?.englishName ?? null,
          arabicName: body?.arabicName ?? null,
        },
        idType,
      ),
    });
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;
    const message = error instanceof Error ? error.message : null;

    return NextResponse.json(
      { succeeded: false, message: localizeApiMessage(message, locale), statusCode: status },
      { status },
    );
  }
}
