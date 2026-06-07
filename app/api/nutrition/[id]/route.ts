import { NextRequest, NextResponse } from 'next/server';
import { deleteNutrition, updateNutrition } from '@/lib/api/nutrition-service';
import { apiRouteError } from '@/lib/api/route-response';
import type { LocaleCode, UpdateNutritionPayload } from '@/lib/api/types';

type Context = { params: Promise<{ id: string }> };

function localeFrom(request: NextRequest) {
  return (request.nextUrl.searchParams.get('locale') === 'en' ? 'en' : 'ar') as LocaleCode;
}

export async function PUT(request: NextRequest, context: Context) {
  const locale = localeFrom(request);

  try {
    const { id } = await context.params;
    return NextResponse.json(
      await updateNutrition(Number(id), (await request.json()) as UpdateNutritionPayload),
    );
  } catch (error) {
    return apiRouteError(error, locale);
  }
}

export async function DELETE(request: NextRequest, context: Context) {
  const locale = localeFrom(request);

  try {
    const { id } = await context.params;
    return NextResponse.json(await deleteNutrition(Number(id)));
  } catch (error) {
    return apiRouteError(error, locale);
  }
}
