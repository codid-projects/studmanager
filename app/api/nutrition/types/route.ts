import { NextRequest, NextResponse } from 'next/server';
import { getNutritionTypes } from '@/lib/api/nutrition-service';
import { apiRouteError } from '@/lib/api/route-response';
import type { LocaleCode } from '@/lib/api/types';

export async function GET(request: NextRequest) {
  const locale = (request.nextUrl.searchParams.get('locale') === 'en' ? 'en' : 'ar') as LocaleCode;

  try {
    return NextResponse.json(await getNutritionTypes());
  } catch (error) {
    return apiRouteError(error, locale);
  }
}
