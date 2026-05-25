import { NextRequest, NextResponse } from 'next/server';
import { ApiError, localizeApiMessage } from '@/lib/api/errors';
import { getDashboardActivities } from '@/lib/api/dashboard-service';
import type { ActivityTypeEnum, LocaleCode } from '@/lib/api/types';

function toActivityType(value: string | null): ActivityTypeEnum | undefined {
  const numeric = Number(value);
  return numeric === 1 || numeric === 2 || numeric === 3 ? numeric : undefined;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const locale = (searchParams.get('locale') === 'en' ? 'en' : 'ar') as LocaleCode;

  try {
    const result = await getDashboardActivities({
      type: toActivityType(searchParams.get('type')),
      pageNumber: Number(searchParams.get('pageNumber') ?? 1),
      pageSize: Number(searchParams.get('pageSize') ?? 10),
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
