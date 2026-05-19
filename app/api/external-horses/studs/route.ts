import { NextRequest, NextResponse } from 'next/server';
import { ApiError, localizeApiMessage } from '@/lib/api/errors';
import { apiFetch } from '@/lib/api/http';
import type { ApiResult, ExternalStudSearchItem, LocaleCode, PagedResponse } from '@/lib/api/types';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const locale = (searchParams.get('locale') === 'en' ? 'en' : 'ar') as LocaleCode;

  try {
    const result = await apiFetch<ApiResult<PagedResponse<ExternalStudSearchItem>>>(
      '/api/ExternalHorses/search-external-studs',
      {
        query: {
          SearchTerm: searchParams.get('search') ?? searchParams.get('SearchTerm') ?? undefined,
          PageNumber: searchParams.get('pageNumber') ?? searchParams.get('PageNumber') ?? 1,
          PageSize: searchParams.get('pageSize') ?? searchParams.get('PageSize') ?? 12,
        },
      },
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
