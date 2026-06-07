import { NextRequest, NextResponse } from 'next/server';
import { createContact, getContacts, updateContact } from '@/lib/api/management-service';
import { apiRouteError } from '@/lib/api/route-response';
import type { ContactPayload, LocaleCode } from '@/lib/api/types';

function localeFrom(request: NextRequest) {
  return (request.nextUrl.searchParams.get('locale') === 'en' ? 'en' : 'ar') as LocaleCode;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const locale = localeFrom(request);

  try {
    const result = await getContacts({
      pageNumber: Number(params.get('pageNumber') ?? 1),
      pageSize: Number(params.get('pageSize') ?? 20),
      groupId: params.get('groupId') ? Number(params.get('groupId')) : undefined,
      search: params.get('search') ?? undefined,
    });
    return NextResponse.json(result);
  } catch (error) {
    return apiRouteError(error, locale);
  }
}

export async function POST(request: NextRequest) {
  const locale = localeFrom(request);

  try {
    const result = await createContact((await request.json()) as ContactPayload);
    return NextResponse.json(result);
  } catch (error) {
    return apiRouteError(error, locale);
  }
}

export async function PUT(request: NextRequest) {
  const locale = localeFrom(request);

  try {
    const result = await updateContact(
      (await request.json()) as ContactPayload & { id: number },
    );
    return NextResponse.json(result);
  } catch (error) {
    return apiRouteError(error, locale);
  }
}
