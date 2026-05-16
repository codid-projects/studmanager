'use client';

import { FC } from 'react';
import Image from 'next/image';
import Link from 'next/link';
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
}) => {
  const { t } = useTranslation();
  const { direction, locale } = useLocale();

  const horseName = locale === 'ar' ? horse.nameAr : horse.nameEn;

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
