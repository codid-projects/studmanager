import { NextRequest, NextResponse } from 'next/server';
import { ApiError, localizeApiMessage } from '@/lib/api/errors';
import { apiFetch } from '@/lib/api/http';
import type { LocaleCode } from '@/lib/api/types';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const locale = (searchParams.get('locale') === 'en' ? 'en' : 'ar') as LocaleCode;
  const horseMotherId = searchParams.get('horseMotherId');
  const horseFotherId = searchParams.get('horseFotherId') ?? searchParams.get('horseFatherId');
  const levels = searchParams.get('levels') ?? '6';

  if (!horseMotherId || !horseFotherId) {
    return NextResponse.json(
      {
        succeeded: false,
        message: locale === 'ar' ? 'اختر الأب والأم أولاً.' : 'Select father and mother first.',
        statusCode: 400,
      },
      { status: 400 },
    );
  }

  try {
    const result = await apiFetch('/api/Horses/TestMating', {
      query: {
        horseMotherId,
        horseFotherId,
        levels,
      },
    });

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
