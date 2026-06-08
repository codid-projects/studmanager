'use client';

import { FC, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MoreVertical, Pencil, Trash2, X } from 'lucide-react';
import { useLocale, useTranslation } from '@/lib/locale-context';
import horsePlaceholder from '@/app/assets/imgs/horse-placehodler.png';

interface Horse {
  id: string;
  nameAr: string;
  nameEn: string;
  type: string;
  birthDate: string;
  metaLabel: string;
  metaValue: string;
  image: string;
  gender: string;
  isSold: boolean;
}

interface HorseCardProps {
  horse: Horse;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const HorseCard: FC<HorseCardProps> = ({
  horse,
  onEdit,
  onDelete,
}) => {
  const { t } = useTranslation();
  const { direction, locale } = useLocale();
  const [actionsOpen, setActionsOpen] = useState(false);

  const horseName = locale === 'ar' ? horse.nameAr : horse.nameEn;
  const hasActions = Boolean(onEdit || onDelete);
  const isRtl = direction === 'rtl';

  return (
    <div className="relative mx-auto w-full max-w-[360px] pt-[58px] xs:pt-[64px] sm:max-w-none sm:pt-[76px] lg:pt-[82px]">
      <div className="absolute left-1/2 top-0 z-20 h-[108px] w-[108px] -translate-x-1/2 overflow-hidden rounded-full bg-gray-200 ring-[9px] ring-[#faf5f2] xs:h-[116px] xs:w-[116px] sm:h-[142px] sm:w-[142px] sm:ring-[14px] lg:h-[154px] lg:w-[154px] lg:ring-[16px]">
        <Image
          src={horse.image || horsePlaceholder}
          alt={horseName}
          fill
          sizes="(max-width: 640px) 108px, (max-width: 1024px) 142px, 154px"
          className="object-cover"
        />
      </div>

      {hasActions ? (
        <div
          className={`absolute top-[74px] z-30 xs:top-[82px] sm:top-[100px] lg:top-[108px] ${
            isRtl ? 'left-3 sm:left-5' : 'right-3 sm:right-5'
          }`}
        >
          <button
            type="button"
            onClick={() => setActionsOpen((open) => !open)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#eadfd9] bg-white text-[#3b2314] shadow-sm transition hover:bg-[#fbf8f4] sm:h-10 sm:w-10"
            aria-label={
              actionsOpen
                ? isRtl
                  ? 'إغلاق القائمة'
                  : 'Close menu'
                : t('common.actions')
            }
            title={
              actionsOpen
                ? isRtl
                  ? 'إغلاق القائمة'
                  : 'Close menu'
                : t('common.actions')
            }
          >
            {actionsOpen ? (
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            ) : (
              <MoreVertical className="h-4 w-4 sm:h-5 sm:w-5" />
            )}
          </button>

          {actionsOpen ? (
            <div
              className={`absolute top-11 min-w-[136px] overflow-hidden rounded-2xl border border-[#eadfd9] bg-white py-1 shadow-lg sm:min-w-[148px] ${
                isRtl ? 'left-0' : 'right-0'
              }`}
            >
              {onEdit ? (
                <button
                  type="button"
                  onClick={() => {
                    setActionsOpen(false);
                    onEdit(horse.id);
                  }}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-sm font-semibold text-[#3b2314] transition hover:bg-[#fbf8f4] ${
                    isRtl ? 'flex-row-reverse text-right' : 'text-left'
                  }`}
                >
                  <Pencil className="h-4 w-4 shrink-0" />
                  <span className="truncate">{t('common.edit')}</span>
                </button>
              ) : null}

              {onDelete ? (
                <button
                  type="button"
                  onClick={() => {
                    setActionsOpen(false);
                    onDelete(horse.id);
                  }}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-sm font-semibold text-[#b3261e] transition hover:bg-[#fff3f3] ${
                    isRtl ? 'flex-row-reverse text-right' : 'text-left'
                  }`}
                >
                  <Trash2 className="h-4 w-4 shrink-0" />
                  <span className="truncate">{t('common.delete')}</span>
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      <div
        className={`flex min-h-[250px] w-full flex-col rounded-[24px] bg-white px-3 pb-4 pt-[64px] shadow-sm transition-shadow duration-300 hover:shadow-md xs:px-4 xs:pb-5 xs:pt-[70px] sm:min-h-[320px] sm:rounded-[30px] sm:px-5 sm:pb-6 sm:pt-[92px] lg:px-6 lg:pt-[102px] ${
          isRtl ? 'text-right' : 'text-left'
        }`}
      >
        <div
          className={`mb-3 flex min-h-7 items-center ${
            horse.isSold
              ? isRtl
                ? 'justify-end'
                : 'justify-start'
              : 'justify-center'
          }`}
        >
          {horse.isSold ? (
            <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200 sm:px-3 sm:py-1.5 sm:text-xs">
              <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
              <span className="truncate">{t('horses.sold')}</span>
            </span>
          ) : null}
        </div>

        <h3
          title={horseName}
          className="mb-4 line-clamp-2 min-h-[40px] text-center text-base font-bold leading-tight text-[#3b2314] sm:mb-5 sm:min-h-[56px] sm:text-xl"
        >
          {horseName}
        </h3>

        <div className="mb-4 grid grid-cols-1 gap-2 text-center min-[360px]:grid-cols-3 sm:mb-6 sm:gap-3">
          <div className="flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl bg-[#fbf8f4] px-2 py-2.5 sm:rounded-2xl sm:px-3 sm:py-3">
            <span
              title={horse.metaValue}
              className="block max-w-full truncate text-xs font-semibold text-[#3b2314] sm:text-base"
            >
              {horse.metaValue}
            </span>
            <span
              title={horse.metaLabel}
              className="block max-w-full truncate text-[10px] text-gray-500 sm:text-xs"
            >
              {horse.metaLabel}
            </span>
          </div>

          <div className="flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl bg-[#fbf8f4] px-2 py-2.5 sm:rounded-2xl sm:px-3 sm:py-3">
            <span
              title={horse.birthDate}
              className="block max-w-full truncate text-xs font-semibold leading-tight text-[#3b2314] sm:text-sm"
            >
              {horse.birthDate}
            </span>
            <span className="block max-w-full truncate text-[10px] text-gray-500 sm:text-xs">
              {t('horses.birthDate')}
            </span>
          </div>

          <div className="flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl bg-[#fbf8f4] px-2 py-2.5 sm:rounded-2xl sm:px-3 sm:py-3">
            <span
              title={horse.type}
              className="block max-w-full truncate text-xs font-semibold text-[#3b2314] sm:text-base"
            >
              {horse.type}
            </span>
            <span className="block max-w-full truncate text-[10px] text-gray-500 sm:text-xs">
              {t('horses.type')}
            </span>
          </div>
        </div>

        <Link
          href={`/${locale}/horses/${horse.id}`}
          className="mt-auto block w-full rounded-full border-2 border-[#3b2314] px-3 py-2.5 text-center text-xs font-semibold text-[#3b2314] transition-all duration-300 hover:bg-[#3b2314] hover:text-white sm:py-3 sm:text-base"
        >
          {t('horses.viewDetails')}
        </Link>
      </div>
    </div>
  );
};