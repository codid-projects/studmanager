import type { LocaleCode } from "./types";

const ARABIC_MESSAGE_MAP: Record<string, string> = {
  "invalid credentials": "اسم المستخدم أو كلمة المرور غير صحيحة.",
  "login successful": "تم تسجيل الدخول بنجاح.",
  "failed to fetch": "حدث خطأ ما. يرجى المحاولة مرة أخرى لاحقاً.",
  unauthorized: "انتهت صلاحية الجلسة أو لا تملك صلاحية الوصول.",
  forbidden: "لا تملك صلاحية تنفيذ هذا الإجراء.",
  "not found": "حدث خطأ ما، يرجى المحاولة مرة أخرى.",
  "internal server error": "حدث خطأ في الخادم. يرجى المحاولة مرة أخرى.",
  success: "تم بنجاح.",
};

const ARABIC_FIELD_MAP: Record<string, string> = {
  FoalName: "اسم المهر بالإنجليزية",
  FoalNameAr: "اسم المهر بالعربية",
  Gender: "الجنس",
  BirthDate: "تاريخ الولادة",
  ProfileId: "الخيل",
  StallionProfileId: "الفحل الأب",
  MareId: "الفرس الأم",
  RecordDate: "التاريخ",
  VeterinarianName: "الطبيب أو المسؤول",
  FoalWeightKg: "وزن المولود",
  Cost: "التكلفة",
  Quantity: "الكمية",
};

export function getFriendlyApiErrorMessage(locale: LocaleCode) {
  return locale === "ar"
    ? "حدث خطأ ما. يرجى المحاولة مرة أخرى لاحقاً."
    : "Something went wrong. Please try again later.";
}

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

export function localizeApiMessage(
  message: string | null | undefined,
  locale: LocaleCode,
) {
  if (!message) {
    return getFriendlyApiErrorMessage(locale);
  }

  if (message.trim().toLowerCase() === "failed to fetch") {
    return getFriendlyApiErrorMessage(locale);
  }

  if (locale !== "ar") return message;

  const requiredMatch = message.match(
    /(?:The\s+)?([A-Za-z][A-Za-z0-9]*)\s+field\s+is\s+required|([A-Za-z][A-Za-z0-9]*)\s+is\s+required/i,
  );
  if (requiredMatch) {
    const field = requiredMatch[1] ?? requiredMatch[2];
    return `${ARABIC_FIELD_MAP[field] ?? field} مطلوب.`;
  }
  if (/failed to (save|register).*foal/i.test(message))
    return "تعذر تسجيل المولود. تحقق من بيانات المهر والأبوين ثم حاول مرة أخرى.";
  if (/profile id mismatch/i.test(message))
    return "بيانات الخيل المختارة لا تطابق سجل التربية.";
  if (/must be male or female/i.test(message))
    return "يرجى اختيار جنس المولود.";

  const normalized = message.trim().toLowerCase().replace(/\.$/, "");
  return ARABIC_MESSAGE_MAP[normalized] ?? message;
}

export function getPayloadMessage(payload: unknown) {
  if (!payload || typeof payload !== "object") return null;

  const record = payload as Record<string, unknown>;
  if (record.errors && typeof record.errors === "object") {
    const messages = Object.entries(
      record.errors as Record<string, unknown>,
    ).flatMap(([field, value]) =>
      Array.isArray(value)
        ? value.map((message) => `${field}: ${String(message)}`)
        : [`${field}: ${String(value)}`],
    );
    if (messages.length) return messages.join(" ");
  }
  const message = record.message ?? record.detail ?? record.title;

  if (typeof message === "string") return message;
  if (Array.isArray(record.messages))
    return record.messages.filter(Boolean).join(" ");

  return null;
}
