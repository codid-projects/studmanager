'use client';

import { FC } from 'react';
import { useLocale } from '@/lib/locale-context';

export interface AnalyticsSubTab {
  id: string;
  label: string;
}

interface AnalyticsSubTabBarProps {
  tabs: AnalyticsSubTab[];
  activeId: string;
  onChange: (id: string) => void;
  ariaLabel?: string;
}

export const AnalyticsSubTabBar: FC<AnalyticsSubTabBarProps> = ({
  tabs,
  activeId,
  onChange,
  ariaLabel,
}) => {
  const { direction } = useLocale();

  return (
    <div
      dir={direction}
      className="flex flex-wrap gap-1.5 rounded-2xl border border-[#eadfd9] bg-[#faf5f2] p-1.5 shadow-sm"
    >
      <div role="tablist" aria-label={ariaLabel} className="flex min-w-0 flex-1 flex-wrap gap-1.5">
        {tabs.map((tab) => {
          const selected = activeId === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onChange(tab.id)}
              className={`min-h-[44px] min-w-0 flex-1 basis-[min(100%,220px)] rounded-xl px-4 py-2.5 text-center text-sm font-semibold transition-all duration-200 sm:flex-none sm:basis-auto ${
                selected
                  ? 'bg-[#3d2a1b] text-white shadow-md shadow-[#3d2a1b]/25'
                  : 'text-[#7a6c63] hover:bg-white hover:text-[#3b2314] hover:shadow-sm'
              }`}
            >
              <span className="line-clamp-2 leading-snug">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
