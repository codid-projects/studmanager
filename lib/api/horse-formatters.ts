import type {
  HorseInfoDto,
  HorseListItemDto,
  LocaleCode,
  RelatedHorseDto,
  StudbookHorseDto,
} from './types';
import horsePlaceholder from '@/app/assets/imgs/horse-placehodler.png';
import { localizeColor, localizeCountry } from './localization';

export const DEFAULT_HORSE_IMAGE = horsePlaceholder.src;

function unknown(locale: LocaleCode) {
  return locale === 'ar' ? 'غير معروف' : 'Unknown';
}

function localizedLabel(locale: LocaleCode, ar: string, en: string) {
  return locale === 'ar' ? ar : en;
}

function firstPresent(...values: Array<string | null | undefined>) {
  return values.find((value) => value && value.trim()) ?? null;
}

export function mediaUrl(value: string | { url?: string | null } | null | undefined) {
  if (typeof value === 'string') return value;
  return value?.url ?? null;
}

export function mediaUrls(values: Array<string | { url?: string | null }> | null | undefined) {
  return (values ?? []).map(mediaUrl).filter((url): url is string => Boolean(url?.trim()));
}

function horseMeta(
  locale: LocaleCode,
  candidates: Array<{ labelAr: string; labelEn: string; value: string | null | undefined }>,
) {
  const matched = candidates.find((candidate) => candidate.value?.trim());

  if (matched) {
    return {
      metaLabel: localizedLabel(locale, matched.labelAr, matched.labelEn),
      metaValue: matched.value as string,
    };
  }

  return {
    metaLabel: localizedLabel(locale, 'اللون', 'Color'),
    metaValue: unknown(locale),
  };
}

export function formatDate(value: string | null | undefined) {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('en-GB').format(date);
}

export function localizeGender(gender: string | null | undefined, locale: LocaleCode) {
  if (!gender) return '-';
  if (locale !== 'ar') return gender;

  const value = gender.toLowerCase();
  if (value.includes('female') || value.includes('mare') || value.includes('filly')) return 'أنثى';
  if (value.includes('male') || value.includes('stallion') || value.includes('colt')) return 'ذكر';

  return gender;
}

export function horseDisplayName(
  horse: Pick<HorseListItemDto, 'arabicName' | 'englishName' | 'knownAs'>,
  locale: LocaleCode,
) {
  return (
    (locale === 'ar' ? horse.arabicName : horse.englishName) ??
    horse.knownAs ??
    horse.englishName ??
    horse.arabicName ??
    '-'
  );
}

export function toHorseCardModel(horse: HorseListItemDto, locale: LocaleCode) {
  const localId = horse.localId ?? horse.id;
  const strain = locale === 'ar' ? horse.strainAr : horse.strainEn;
  const meta = horseMeta(locale, [
    { labelAr: 'الرسن', labelEn: 'Strain', value: strain },
    { labelAr: 'اللون', labelEn: 'Color', value: horse.color ? localizeColor(horse.color, locale) : null },
    { labelAr: 'الخط الخاص', labelEn: 'Special line', value: firstPresent(horse.specialAr, horse.specialEn) },
  ]);

  return {
    id: String(localId),
    nameAr: horse.arabicName ?? horse.englishName ?? '-',
    nameEn: horse.englishName ?? horse.arabicName ?? '-',
    type: localizeGender(horse.gender, locale),
    birthDate: formatDate(horse.dateofBirth),
    ...meta,
    image: horse.horseProfileImage || mediaUrl(horse.images?.[0]) || DEFAULT_HORSE_IMAGE,
    gender: horse.gender ?? '',
  };
}

export function toStudbookCardModel(horse: StudbookHorseDto, locale: LocaleCode) {
  const meta = horseMeta(locale, [
    { labelAr: 'اللون', labelEn: 'Color', value: horse.color ? localizeColor(horse.color, locale) : null },
    { labelAr: 'الرسن', labelEn: 'Strain', value: firstPresent(horse.strainAr, horse.strain) },
    { labelAr: 'الخط الخاص', labelEn: 'Special line', value: firstPresent(horse.specialLineAr, horse.specialLine) },
    { labelAr: 'ولد في', labelEn: 'Born in', value: horse.bornIn },
    { labelAr: 'حالياً في', labelEn: 'Currently in', value: horse.currentlyIn },
  ]);

  return {
    id: String(horse.id),
    nameAr: horse.arabicName ?? horse.englishName ?? '-',
    nameEn: horse.englishName ?? horse.arabicName ?? '-',
    type: localizeGender(horse.gender, locale),
    birthDate: formatDate(horse.dateofBirth),
    image: horse.horseProfileImage || mediaUrl(horse.images?.[0]) || DEFAULT_HORSE_IMAGE,
    ...meta,
    strain: horse.strain,
    specialLine: horse.specialLine,
    strainAr: horse.strainAr,
    specialLineAr: horse.specialLineAr,
  };
}

export function toProfileHorseModel(horse: HorseInfoDto, locale: LocaleCode) {
  const localId = horse.localId ?? horse.id;

  return {
    id: String(localId),
    localId,
    studbookId: horse.studbookId,
    nameAr: horse.arabicName ?? horse.englishName ?? '-',
    nameEn: horse.englishName ?? horse.arabicName ?? '-',
    type: horse.type ?? localizeGender(horse.gender, locale),
    gender: horse.gender ?? '',
    birthDate: formatDate(horse.dateofBirth),
    features: horse.isActive ? 1 : 0,
    image: horse.horseProfileImage || DEFAULT_HORSE_IMAGE,
    pedigreeImage: '/brand/image.png',
    maleOffspring: 0,
    femaleOffspring: 0,
    maleResults: 0,
    femaleResults: 0,
    origin: localizeCountry(horse.bornIn, locale),
    registrationNumber: horse.registrationNumber ?? '-',
    color: localizeColor(horse.color, locale),
    raw: horse,
  };
}

export function relatedHorseName(horse: RelatedHorseDto, locale: LocaleCode) {
  return locale === 'ar'
    ? horse.arabicName ?? horse.englishName ?? '-'
    : horse.englishName ?? horse.arabicName ?? '-';
}
