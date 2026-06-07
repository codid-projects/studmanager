import { NextRequest, NextResponse } from 'next/server';
import { createNutrition, getNutrition } from '@/lib/api/nutrition-service';
import { apiRouteError } from '@/lib/api/route-response';
import type { CreateNutritionPayload, LocaleCode, NutritionTypeId } from '@/lib/api/types';

function localeFrom(request: NextRequest) {
  return (request.nextUrl.searchParams.get('locale') === 'en' ? 'en' : 'ar') as LocaleCode;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const locale = localeFrom(request);

  try {
    return NextResponse.json(
      await getNutrition({
        type: params.get('type') ? (Number(params.get('type')) as NutritionTypeId) : undefined,
        search: params.get('search') ?? undefined,
        pageNumber: Number(params.get('pageNumber') ?? 1),
        pageSize: Number(params.get('pageSize') ?? 10),
      }),
    );
  } catch (error) {
    return apiRouteError(error, locale);
  }
}

export async function POST(request: NextRequest) {
  const locale = localeFrom(request);

  try {
    return NextResponse.json(
      await createNutrition((await request.json()) as CreateNutritionPayload),
    );
  } catch (error) {
    return apiRouteError(error, locale);
  }
}
