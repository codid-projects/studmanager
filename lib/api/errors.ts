import type { LocaleCode } from './types';

const ARABIC_MESSAGE_MAP: Record<string, string> = {
  'invalid credentials': 'اسم المستخدم أو كلمة المرور غير صحيحة.',
  'login successful': 'تم تسجيل الدخول بنجاح.',
  unauthorized: 'انتهت صلاحية الجلسة أو لا تملك صلاحية الوصول.',
  forbidden: 'لا تملك صلاحية تنفيذ هذا الإجراء.',
  'not found': 'العنصر المطلوب غير موجود.',
  'internal server error': 'حدث خطأ في الخادم. يرجى المحاولة مرة أخرى.',
  success: 'تم بنجاح.',
};

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

export function localizeApiMessage(message: string | null | undefined, locale: LocaleCode) {
  if (!message) {
    return locale === 'ar' ? 'حدث خطأ غير متوقع.' : 'Something went wrong.';
  }

  if (locale !== 'ar') return message;

  const normalized = message.trim().toLowerCase().replace(/\.$/, '');
  return ARABIC_MESSAGE_MAP[normalized] ?? message;
}

export function getPayloadMessage(payload: unknown) {
  if (!payload || typeof payload !== 'object') return null;

  const record = payload as Record<string, unknown>;
  const message = record.message ?? record.detail ?? record.title;

  if (typeof message === 'string') return message;
  if (Array.isArray(record.messages)) return record.messages.filter(Boolean).join(' ');

  return null;
}
