'use client';

import { useLocale } from '@/lib/locale-context';

export function HorseProfileSkeleton() {
  const { direction } = useLocale();
  const isRTL = direction === 'rtl';

  return (
    <div className="animate-pulse pb-12">
      <div className="relative mb-16">
        <div className="h-80 rounded-3xl bg-white shadow-sm" />
        <div
          className={`absolute -bottom-16 h-40 w-40 rounded-full border-4 border-[#fdfbf7] bg-[#ece2da] shadow-md ${
            isRTL ? 'right-12' : 'left-12'
          }`}
        />
      </div>

      <div className="mb-8 flex items-center justify-between px-4 md:px-12">
        <div className="h-10 w-64 rounded-xl bg-white" />
        <div className="h-12 w-44 rounded-xl bg-white" />
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-6">
        <div className="h-48 rounded-3xl bg-white shadow-sm" />
        <div className="h-48 rounded-3xl bg-white shadow-sm" />
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="h-12 w-28 rounded-xl bg-white" />
        ))}
      </div>

      <div className="h-[520px] rounded-3xl bg-white shadow-sm" />
    </div>
  );
}
