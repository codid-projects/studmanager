import type { LocaleCode } from './types';

const normalizeKey = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');

export const HORSE_COLOR_TRANSLATIONS: Record<string, { en: string; ar: string }> = {
  black: { en: 'Black', ar: 'أسود' },
  bay: { en: 'Bay', ar: 'كميت' },
  'dark bay': { en: 'Dark Bay', ar: 'كميت داكن' },
  brown: { en: 'Brown', ar: 'بني' },
  palomino: { en: 'Palomino', ar: 'أشقر ذهبي' },
  chesnut: { en: 'Chesnut', ar: 'أشقر' },
  chestnut: { en: 'Chestnut', ar: 'أشقر' },
  'liver chesnut': { en: 'Liver Chesnut', ar: 'أشقر كبدي' },
  'liver chestnut': { en: 'Liver Chestnut', ar: 'أشقر كبدي' },
  grey: { en: 'Grey', ar: 'رمادي' },
  gray: { en: 'Gray', ar: 'رمادي' },
  blue: { en: 'Blue', ar: 'أزرق' },
  roan: { en: 'Roan', ar: 'أشهب مرقط' },
  'dapple grey': { en: 'Dapple Grey', ar: 'رمادي مبقع' },
  'flea biten': { en: 'Flea Biten', ar: 'أشهب منقط' },
  'flea bitten': { en: 'Flea Bitten', ar: 'أشهب منقط' },
};

export const COUNTRY_TRANSLATIONS: Record<string, { en: string; ar: string }> = {
  egypt: { en: 'Egypt', ar: 'مصر' },
  'saudi arabia': { en: 'Saudi Arabia', ar: 'السعودية' },
  libya: { en: 'Libya', ar: 'ليبيا' },
  sudan: { en: 'Sudan', ar: 'السودان' },
  algeria: { en: 'Algeria', ar: 'الجزائر' },
  bahrain: { en: 'Bahrain', ar: 'البحرين' },
  iraq: { en: 'Iraq', ar: 'العراق' },
  jordan: { en: 'Jordan', ar: 'الأردن' },
  kuwait: { en: 'Kuwait', ar: 'الكويت' },
  lebanon: { en: 'Lebanon', ar: 'لبنان' },
  morocco: { en: 'Morocco', ar: 'المغرب' },
  oman: { en: 'Oman', ar: 'عمان' },
  qatar: { en: 'Qatar', ar: 'قطر' },
  'united arab emirates': { en: 'United Arab Emirates', ar: 'الإمارات' },
  uae: { en: 'United Arab Emirates', ar: 'الإمارات' },
};

export function localizeColor(value: string | null | undefined, locale: LocaleCode) {
  if (!value) return locale === 'ar' ? 'غير معروف' : 'Unknown';

  const match = HORSE_COLOR_TRANSLATIONS[normalizeKey(value)];
  if (!match) return value;

  return locale === 'ar' ? match.ar : match.en;
}

export function localizeCountry(value: string | null | undefined, locale: LocaleCode) {
  if (!value) return '-';

  const match = COUNTRY_TRANSLATIONS[normalizeKey(value)];
  if (!match) return value;

  return locale === 'ar' ? match.ar : match.en;
}

export function getLocalizedName(
  englishName?: string | null,
  arabicName?: string | null,
  isArabic?: boolean,
) {
  if (isArabic) return arabicName || englishName || '-';
  return englishName || arabicName || '-';
}
