'use client';

import { Tablets, UsersRound } from 'lucide-react';
import { useLocale, useTranslation } from '@/lib/locale-context';

export type IntegratedSettingCategory = 'contactGroups' | 'supplements';
export type PendingSettingCategory =
  | 'housing'
  | 'bloodTest'
  | 'wormDose'
  | 'hoofLegCare'
  | 'injuries'
  | 'medicalCare';
export type SettingCategory = IntegratedSettingCategory | PendingSettingCategory;

interface SettingsTabsProps {
  activeTab: SettingCategory;
  onTabChange: (tab: SettingCategory) => void;
}

type SettingsCategoryItem = {
  id: SettingCategory;
  labelKey: string;
  icon?: string;
  integrated: boolean;
};

const categories: SettingsCategoryItem[] = [
  { id: 'contactGroups', labelKey: 'contactGroups', integrated: true },
  { id: 'supplements', labelKey: 'supplements', integrated: true },
  { id: 'housing', labelKey: 'housing', icon: '/settings/الإيواء.svg', integrated: false },
  { id: 'bloodTest', labelKey: 'bloodTest', icon: '/settings/تحليل الدم.svg', integrated: false },
  { id: 'wormDose', labelKey: 'wormDose', icon: '/settings/جرعة الديدان.svg', integrated: false },
  { id: 'hoofLegCare', labelKey: 'hoofLegCare', icon: '/settings/العناية بالحافر  و الساق.svg', integrated: false },
  { id: 'injuries', labelKey: 'injuries', icon: '/settings/الإصابات.svg', integrated: false },
  { id: 'medicalCare', labelKey: 'medicalCare', icon: '/settings/الرعاية الطبية.svg', integrated: false },
];

export function isIntegratedSetting(tab: SettingCategory): tab is IntegratedSettingCategory {
  return tab === 'contactGroups' || tab === 'supplements';
}

export function SettingsTabs({ activeTab, onTabChange }: SettingsTabsProps) {
  const { direction } = useLocale();
  const { t } = useTranslation();
  const isRTL = direction === 'rtl';

  return (
    <div className={`flex flex-col gap-1 w-full sm:w-64 bg-white transition-all duration-300 ${isRTL ? 'border-l border-gray-100' : 'border-r border-gray-100'
      }`}>
      {categories.map((cat) => (
        <button
          key={cat.id}
          type="button"
          onClick={() => onTabChange(cat.id)}
          className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 ${
            activeTab === cat.id
              ? `bg-[#F2EADA] text-[#4B2F1A] ${isRTL ? 'border-l-4' : 'border-r-4'} border-[#4B2F1A]`
              : 'text-gray-600 hover:bg-gray-50'
          } ${cat.integrated ? 'opacity-100' : 'opacity-45'} ${isRTL ? '' : 'flex-row justify-start'}`}
        >
          {cat.id === 'contactGroups' ? (
            <UsersRound className="h-6 w-6 shrink-0" />
          ) : cat.id === 'supplements' ? (
            <Tablets className="h-6 w-6 shrink-0" />
          ) : (
            <img src={cat.icon} alt="" className="w-6 h-6 object-contain" />
          )}
          <span className="min-w-0 flex-1 text-start">{t(`settings.${cat.labelKey}`)}</span>
          {!cat.integrated && (
            <span className="shrink-0 rounded-full bg-gray-100 px-2 py-1 text-[10px] text-gray-500">
              {t('settings.pending')}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
