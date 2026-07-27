import { NextRequest, NextResponse } from 'next/server';
import {
  createSettingRecord,
  getSettingRecords,
} from '@/lib/api/management-service';
import { apiRouteError } from '@/lib/api/route-response';
import type { LocaleCode, SettingRecordPayload } from '@/lib/api/types';

function getLocale(request: NextRequest) {
  return (request.nextUrl.searchParams.get('locale') === 'en' ? 'en' : 'ar') as LocaleCode;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const locale = getLocale(request);

  try {
    return NextResponse.json(
      await getSettingRecords(
        Number(params.get('category') ?? 1),
        Number(params.get('pageNumber') ?? 1),
        Number(params.get('pageSize') ?? 100),
      ),
    );
  } catch (error) {
    return apiRouteError(error, locale);
  }
}

export async function POST(request: NextRequest) {
  const locale = getLocale(request);

  try {
    return NextResponse.json(
      await createSettingRecord((await request.json()) as SettingRecordPayload),
    );
  } catch (error) {
    return apiRouteError(error, locale);
  }
}
