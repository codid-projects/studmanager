import { NextResponse } from 'next/server';
import { ApiError, localizeApiMessage } from './errors';
import type { LocaleCode } from './types';

export function apiRouteError(error: unknown, locale: LocaleCode) {
  const status = error instanceof ApiError ? error.status : 500;
  const message = error instanceof Error ? error.message : null;

  return NextResponse.json(
    { succeeded: false, message: localizeApiMessage(message, locale), statusCode: status },
    { status },
  );
}
