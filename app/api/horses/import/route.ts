import { NextRequest, NextResponse } from 'next/server';
import { ApiError, localizeApiMessage } from '@/lib/api/errors';
import { importHorse } from '@/lib/api/horses-service';
import type { LocaleCode } from '@/lib/api/types';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const locale = (body?.locale === 'en' ? 'en' : 'ar') as LocaleCode;

  if (!body?.studbookId) {
    return NextResponse.json(
      { message: locale === 'ar' ? 'يرجى اختيار خيل من Studbook.' : 'Please select a Studbook horse.' },
      { status: 400 },
    );
  }

  try {
    const result = await importHorse({
      studbookId: Number(body.studbookId),
      strain: body.strain ?? null,
      specialLine: body.specialLine ?? null,
      strainAr: body.strainAr ?? null,
      specialLineAr: body.specialLineAr ?? null,
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
