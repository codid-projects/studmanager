import { NextRequest, NextResponse } from 'next/server';
import { deleteContactGroup, updateContactGroup } from '@/lib/api/management-service';
import { apiRouteError } from '@/lib/api/route-response';
import type { ContactGroupPayload, LocaleCode } from '@/lib/api/types';

type Context = { params: Promise<{ id: string }> };

function localeFrom(request: NextRequest) {
  return (request.nextUrl.searchParams.get('locale') === 'en' ? 'en' : 'ar') as LocaleCode;
}

export async function PUT(request: NextRequest, context: Context) {
  const locale = localeFrom(request);

  try {
    const { id } = await context.params;
    const payload = (await request.json()) as ContactGroupPayload;
    return NextResponse.json(await updateContactGroup(Number(id), payload));
  } catch (error) {
    return apiRouteError(error, locale);
  }
}

export async function DELETE(request: NextRequest, context: Context) {
  const locale = localeFrom(request);

  try {
    const { id } = await context.params;
    return NextResponse.json(await deleteContactGroup(Number(id)));
  } catch (error) {
    return apiRouteError(error, locale);
  }
}
