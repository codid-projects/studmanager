import { NextRequest, NextResponse } from 'next/server';
import {
  deleteSettingRecord,
  updateSettingRecord,
} from '@/lib/api/management-service';
import { apiRouteError } from '@/lib/api/route-response';
import type { LocaleCode, SettingRecordPayload } from '@/lib/api/types';

function getLocale(request: NextRequest) {
  return (request.nextUrl.searchParams.get('locale') === 'en' ? 'en' : 'ar') as LocaleCode;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const locale = getLocale(request);
  const { id } = await params;

  try {
    return NextResponse.json(
      await updateSettingRecord(Number(id), (await request.json()) as SettingRecordPayload),
    );
  } catch (error) {
    return apiRouteError(error, locale);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const locale = getLocale(request);
  const { id } = await params;

  try {
    return NextResponse.json(await deleteSettingRecord(Number(id)));
  } catch (error) {
    return apiRouteError(error, locale);
  }
}
