import { NextRequest, NextResponse } from 'next/server';
import { deleteContact } from '@/lib/api/management-service';
import { apiRouteError } from '@/lib/api/route-response';
import type { LocaleCode } from '@/lib/api/types';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const locale = (request.nextUrl.searchParams.get('locale') === 'en' ? 'en' : 'ar') as LocaleCode;

  try {
    const { id } = await context.params;
    return NextResponse.json(await deleteContact(Number(id)));
  } catch (error) {
    return apiRouteError(error, locale);
  }
}
