import { NextRequest, NextResponse } from 'next/server';
import { ApiError, localizeApiMessage } from '@/lib/api/errors';
import { apiFetch } from '@/lib/api/http';
import type { ApiResult, DefaultStudDto, LocaleCode } from '@/lib/api/types';

export async function GET(request: NextRequest) {
  const locale = (request.nextUrl.searchParams.get('locale') === 'en' ? 'en' : 'ar') as LocaleCode;

  try {
    const result = await apiFetch<ApiResult<DefaultStudDto>>('/default');

    return NextResponse.json(result);
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;
    const message = error instanceof Error ? error.message : null;

    return NextResponse.json(
      { succeeded: false, message: localizeApiMessage(message, locale), statusCode: status },
      { status },
    );
  }
}
