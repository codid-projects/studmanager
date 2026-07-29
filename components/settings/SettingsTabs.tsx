'use client';

import {
  Activity,
  Award,
  Bone,
  BriefcaseMedical,
  BugOff,
  ClipboardCheck,
  ClipboardList,
  ContactRound,
  Dumbbell,
  Footprints,
  HeartPulse,
  Pill,
  Scissors,
  ShieldPlus,
  Syringe,
  Tablets,
  TestTube2,
  UsersRound,
  Weight,
} from 'lucide-react';
import { useTranslation } from '@/lib/locale-context';
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

const TAB_ICONS = {
  contactGroups: UsersRound,
  supplements: Tablets,
  bloodTest: TestTube2,
  wormDose: BugOff,
  hoofLegCare: Footprints,
  shoeing: Bone,
  injuries: BriefcaseMedical,
  medicalCare: HeartPulse,
  medications: Pill,
  medicationReasons: ClipboardCheck,
  xRay: Activity,
  vaccinations: Syringe,
  vaccinationReasons: ShieldPlus,
  growth: Weight,
  trainings: Dumbbell,
  competitions: Award,
  haircuts: Scissors,
} satisfies Partial<Record<SettingCategory, typeof ClipboardList>>;

export function SettingsTabs({ activeTab, onTabChange }: SettingsTabsProps) {
  const { t } = useTranslation();

  return (
    <div className="border-b border-[#efe7df] bg-[#fffdfb] px-3 py-3">
      <div className="flex w-full gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
        {SETTINGS_CATEGORY_ITEMS.map((cat) => {
          const Icon = TAB_ICONS[cat.id] ?? ContactRound;
          const active = activeTab === cat.id;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onTabChange(cat.id)}
              className={`group flex min-h-[48px] shrink-0 items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-bold transition-all duration-200 ${
                active
                  ? 'border-[#4B2F1A] bg-[#3b2b20] text-white shadow-[0_10px_22px_rgba(59,43,32,0.18)]'
                  : 'border-[#eadfd6] bg-white text-[#5f5147] hover:border-[#cdb9a8] hover:bg-[#fbf7f2]'
              }`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition ${
                  active ? 'bg-white/15 text-white' : 'bg-[#f4ede6] text-[#6f5b4d] group-hover:bg-[#eee2d8]'
                }`}
              >
                <Icon className="h-[18px] w-[18px]" />
              </span>
              <span className="whitespace-nowrap">{t(`settings.${cat.labelKey}`)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
