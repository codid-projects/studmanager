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

  return (
    <div className="relative pt-14 sm:pt-20">
      {/* Image */}
      <div className="absolute left-1/2 top-0 z-10 h-24 w-24 -translate-x-1/2 overflow-hidden rounded-full bg-gray-200 ring-[10px] ring-[#faf5f2] sm:h-36 sm:w-36 sm:ring-[16px]">
        <Image
          src={horse.image || horsePlaceholder}
          alt={horseName}
          fill
          className="object-cover"
        />
      </div>

      {/* Card */}
      <div
        className={`bg-white rounded-[22px] shadow-sm hover:shadow-md transition-shadow duration-300 px-3 pb-4 pt-14 sm:rounded-[30px] sm:px-6 sm:pb-6 sm:pt-24 ${
          direction === 'rtl' ? 'text-right' : 'text-left'
        }`}
      >
        {hasActions ? (
          <div className={`absolute top-16 z-30 sm:top-24 ${direction === 'rtl' ? 'left-3 sm:left-5' : 'right-3 sm:right-5'}`}>
            <button
              type="button"
              onClick={() => setActionsOpen((open) => !open)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#eadfd9] bg-white text-[#3b2314] shadow-sm transition hover:bg-[#fbf8f4]"
              aria-label={actionsOpen ? (direction === 'rtl' ? 'إغلاق القائمة' : 'Close menu') : t('common.actions')}
              title={actionsOpen ? (direction === 'rtl' ? 'إغلاق القائمة' : 'Close menu') : t('common.actions')}
            >
              {actionsOpen ? <X className="h-4 w-4" /> : <MoreVertical className="h-4 w-4" />}
            </button>

            {actionsOpen ? (
              <div
                className={`absolute top-11 min-w-32 overflow-hidden rounded-2xl border border-[#eadfd9] bg-white py-1 shadow-lg ${
                  direction === 'rtl' ? 'left-0' : 'right-0'
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
                      direction === 'rtl' ? 'flex-row-reverse text-right' : 'text-left'
                    }`}
                  >
                    <Pencil className="h-4 w-4" />
                    <span>{t('common.edit')}</span>
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
                      direction === 'rtl' ? 'flex-row-reverse text-right' : 'text-left'
                    }`}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>{t('common.delete')}</span>
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Horse name */}
        <h3 className="mb-4 truncate text-center text-sm font-bold text-[#3b2314] sm:mb-6 sm:text-xl">
          {horseName}
        </h3>

        {/* Stats */}
        <div className="mb-4 grid grid-cols-3 gap-1 text-center sm:mb-6 sm:gap-3">
          <div className="flex min-w-0 flex-col items-center justify-start gap-1 rounded-xl bg-[#fbf8f4] px-1.5 py-2">
            <span className="block max-w-full truncate text-xs font-semibold text-[#3b2314] sm:text-base">
              {horse.metaValue}
            </span>
            <span className="block max-w-full truncate text-[10px] text-gray-500 sm:text-xs">
              {horse.metaLabel}
            </span>
          </div>

          <div className="flex min-w-0 flex-col items-center justify-start gap-1 rounded-xl bg-[#fbf8f4] px-1.5 py-2">
            <span className="block w-full text-center text-[10px] font-semibold leading-tight text-[#3b2314] sm:text-sm">
              {horse.birthDate}
            </span>
            <span className="block max-w-full truncate text-[10px] text-gray-500 sm:text-xs">
              {t('horses.birthDate')}
            </span>
          </div>

          <div className="flex min-w-0 flex-col items-center justify-start gap-1 rounded-xl bg-[#fbf8f4] px-1.5 py-2">
            <span className="block max-w-full truncate text-xs font-semibold text-[#3b2314] sm:text-base">
              {horse.type}
            </span>
            <span className="block max-w-full truncate text-[10px] text-gray-500 sm:text-xs">
              {t('horses.type')}
            </span>
          </div>
        </div>

        {/* Button */}
        <Link
          href={`/${locale}/horses/${horse.id}`}
          className="block w-full rounded-full border-2 border-[#3b2314] py-2 text-center text-xs font-semibold text-[#3b2314] transition-all duration-300 hover:bg-[#3b2314] hover:text-white sm:py-3 sm:text-base"
        >
          {t('horses.viewDetails')}
        </Link>
      </div>
    </div>
  );
};
