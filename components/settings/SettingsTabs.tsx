'use client';

import { ClipboardList, Tablets, UsersRound } from 'lucide-react';
import { useLocale, useTranslation } from '@/lib/locale-context';
import {
  SETTINGS_CATEGORY_ITEMS,
  getSettingRecordCategory,
  isIntegratedSetting,
  SETTING_RECORD_CATEGORY,
  type BackendSettingCategory,
  type IntegratedSettingCategory,
  type SettingCategory,
} from '@/lib/settings-record-categories';

export {
  SETTINGS_CATEGORY_ITEMS,
  SETTING_RECORD_CATEGORY,
  getSettingRecordCategory,
  isIntegratedSetting,
  type BackendSettingCategory,
  type IntegratedSettingCategory,
  type SettingCategory,
};

interface SettingsTabsProps {
  activeTab: SettingCategory;
  onTabChange: (tab: SettingCategory) => void;
}

export function SettingsTabs({ activeTab, onTabChange }: SettingsTabsProps) {
  const { direction } = useLocale();
  const { t } = useTranslation();
  const isRTL = direction === 'rtl';

  return (
    <div className={`flex flex-col gap-1 w-full sm:w-64 bg-white transition-all duration-300 ${isRTL ? 'border-l border-gray-100' : 'border-r border-gray-100'
      }`}>
      {SETTINGS_CATEGORY_ITEMS.map((cat) => (
        <button
          key={cat.id}
          type="button"
          onClick={() => onTabChange(cat.id)}
          className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 ${
            activeTab === cat.id
              ? `bg-[#F2EADA] text-[#4B2F1A] ${isRTL ? 'border-l-4' : 'border-r-4'} border-[#4B2F1A]`
              : 'text-gray-600 hover:bg-gray-50'
          } ${isRTL ? '' : 'flex-row justify-start'}`}
        >
          {cat.id === 'contactGroups' ? (
            <UsersRound className="h-6 w-6 shrink-0" />
          ) : cat.id === 'supplements' ? (
            <Tablets className="h-6 w-6 shrink-0" />
          ) : cat.icon ? (
            <img src={cat.icon} alt="" className="w-6 h-6 object-contain" />
          ) : (
            <ClipboardList className="h-6 w-6 shrink-0" />
          )}
          <span className="min-w-0 flex-1 text-start">{t(`settings.${cat.labelKey}`)}</span>
        </button>
      ))}
    </div>
  );
}
