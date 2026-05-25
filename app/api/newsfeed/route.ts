import { NextRequest, NextResponse } from 'next/server';
import { ApiError, localizeApiMessage } from '@/lib/api/errors';
import { getNewsfeed } from '@/lib/api/newsfeed-service';
import type { LocaleCode } from '@/lib/api/types';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const locale = (searchParams.get('locale') === 'en' ? 'en' : 'ar') as LocaleCode;

  try {
    const result = await getNewsfeed({
      mediaType: searchParams.get('mediaType') ?? undefined,
      categories: searchParams.get('categories') ?? undefined,
      pageNumber: Number(searchParams.get('pageNumber') ?? 1),
      pageSize: Number(searchParams.get('pageSize') ?? 10),
    });

    return NextResponse.json(result);
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;
    const message = error instanceof Error ? error.message : null;

    return NextResponse.json(
      { message: localizeApiMessage(message, locale) },
      { status },
    );
  }
}
