import { NextRequest, NextResponse } from 'next/server';
import { ApiError, localizeApiMessage } from '@/lib/api/errors';
import { apiFetch } from '@/lib/api/http';
import type { ApiResult, ExternalHorseSummaryItem, LocaleCode } from '@/lib/api/types';

interface ExternalHorseSummaryRouteProps {
  params: Promise<{ studbookId: string }>;
}

export async function GET(request: NextRequest, { params }: ExternalHorseSummaryRouteProps) {
  const { studbookId } = await params;
  const locale = (request.nextUrl.searchParams.get('locale') === 'en' ? 'en' : 'ar') as LocaleCode;

  try {
    const result = await apiFetch<ApiResult<ExternalHorseSummaryItem>>(
      `/api/ExternalHorses/${studbookId}/summary`,
    );

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
