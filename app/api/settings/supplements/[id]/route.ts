import { NextRequest, NextResponse } from 'next/server';
import { deleteSupplement, updateSupplement } from '@/lib/api/management-service';
import { apiRouteError } from '@/lib/api/route-response';
import type { LocaleCode, SupplementPayload } from '@/lib/api/types';

type Context = { params: Promise<{ id: string }> };

function localeFrom(request: NextRequest) {
  return (request.nextUrl.searchParams.get('locale') === 'en' ? 'en' : 'ar') as LocaleCode;
}

export async function PUT(request: NextRequest, context: Context) {
  const locale = localeFrom(request);

  try {
    const { id } = await context.params;
    const payload = (await request.json()) as SupplementPayload;
    return NextResponse.json(await updateSupplement(Number(id), payload));
  } catch (error) {
    return apiRouteError(error, locale);
  }
}

export async function DELETE(request: NextRequest, context: Context) {
  const locale = localeFrom(request);

  try {
    const { id } = await context.params;
    return NextResponse.json(await deleteSupplement(Number(id)));
  } catch (error) {
    return apiRouteError(error, locale);
  }
}
