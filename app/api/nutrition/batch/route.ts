import { NextRequest, NextResponse } from 'next/server';
import { deleteNutritionBatch } from '@/lib/api/nutrition-service';
import { apiRouteError } from '@/lib/api/route-response';
import type { LocaleCode } from '@/lib/api/types';

export async function DELETE(request: NextRequest) {
  const locale = (request.nextUrl.searchParams.get('locale') === 'en' ? 'en' : 'ar') as LocaleCode;

  try {
    return NextResponse.json(await deleteNutritionBatch((await request.json()) as number[]));
  } catch (error) {
    return apiRouteError(error, locale);
  }
}
