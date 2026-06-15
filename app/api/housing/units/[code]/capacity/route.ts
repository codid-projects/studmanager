import { NextRequest, NextResponse } from 'next/server';
import { ApiError, localizeApiMessage } from '@/lib/api/errors';
import { apiFetch } from '@/lib/api/http';
import type {
  ApiResult,
  HousingUnitDto,
  LocaleCode,
  UpdateHousingUnitCapacityPayload,
} from '@/lib/api/types';

interface RouteProps {
  params: Promise<{ code: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteProps) {
  const { code } = await params;
  const locale = (
    request.nextUrl.searchParams.get('locale') === 'en' ? 'en' : 'ar'
  ) as LocaleCode;
  const payload = (await request.json()) as UpdateHousingUnitCapacityPayload;

  try {
    const result = await apiFetch<ApiResult<HousingUnitDto>>(
      `/api/Housing/units/${encodeURIComponent(code)}/capacity`,
      {
        method: 'PATCH',
        body: payload,
      },
    );

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
