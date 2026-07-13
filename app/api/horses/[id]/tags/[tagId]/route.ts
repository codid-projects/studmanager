import { NextRequest, NextResponse } from 'next/server';
import { ApiError, localizeApiMessage } from '@/lib/api/errors';
import { deleteHorseTag, updateHorseTag } from '@/lib/api/horses-service';
import type { LocaleCode } from '@/lib/api/types';

interface HorseTagRouteProps {
  params: Promise<{ id: string; tagId: string }>;
}

export async function PUT(request: NextRequest, { params }: HorseTagRouteProps) {
  const { id, tagId } = await params;
  const locale = (request.nextUrl.searchParams.get('locale') === 'en' ? 'en' : 'ar') as LocaleCode;
  const idType = request.nextUrl.searchParams.get('idType') ?? undefined;

  try {
    const body = await request.json();
    return NextResponse.json({
      succeeded: true,
      statusCode: 200,
      data: await updateHorseTag(id, Number(tagId), body?.name ?? '', idType),
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

export async function DELETE(request: NextRequest, { params }: HorseTagRouteProps) {
  const { id, tagId } = await params;
  const locale = (request.nextUrl.searchParams.get('locale') === 'en' ? 'en' : 'ar') as LocaleCode;
  const idType = request.nextUrl.searchParams.get('idType') ?? undefined;

  try {
    return NextResponse.json({
      succeeded: true,
      statusCode: 200,
      data: await deleteHorseTag(id, Number(tagId), idType),
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
