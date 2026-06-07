import { NextRequest, NextResponse } from 'next/server';
import { createSupplement, getSupplements } from '@/lib/api/management-service';
import { apiRouteError } from '@/lib/api/route-response';
import type { LocaleCode, SupplementPayload } from '@/lib/api/types';

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const locale = (params.get('locale') === 'en' ? 'en' : 'ar') as LocaleCode;

  try {
    return NextResponse.json(
      await getSupplements(
        Number(params.get('pageNumber') ?? 1),
        Number(params.get('pageSize') ?? 20),
      ),
    );
  } catch (error) {
    return apiRouteError(error, locale);
  }
}

export async function POST(request: NextRequest) {
  const locale = (request.nextUrl.searchParams.get('locale') === 'en' ? 'en' : 'ar') as LocaleCode;

  try {
    return NextResponse.json(
      await createSupplement((await request.json()) as SupplementPayload),
    );
  } catch (error) {
    return apiRouteError(error, locale);
  }
}
