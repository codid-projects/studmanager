import categoryData from './settings-record-categories.json';

export type IntegratedSettingCategory = 'contactGroups' | 'supplements';

export type SettingRecordCategory =
  | 'bloodTest'
  | 'wormDose'
  | 'injuries'
  | 'medicalCare'
  | 'medications'
  | 'medicationReasons'
  | 'xRay'
  | 'vaccinations'
  | 'vaccinationReasons'
  | 'shoeing'
  | 'hoofLegCare'
  | 'trainings'
  | 'competitions'
  | 'haircuts'
  | 'growth';

export type SettingCategory = IntegratedSettingCategory | SettingRecordCategory;
export type BackendSettingCategory = SettingCategory;

export type SettingsCategoryItem = {
  id: SettingCategory;
  labelKey: string;
  icon?: string;
};

export const SETTING_RECORD_CATEGORY = categoryData.recordCategories as Record<SettingRecordCategory, number>;

export const SETTINGS_CATEGORY_ITEMS = categoryData.items as SettingsCategoryItem[];

export function isSettingRecordCategory(tab: SettingCategory): tab is SettingRecordCategory {
  return Object.prototype.hasOwnProperty.call(SETTING_RECORD_CATEGORY, tab);
}

export function isIntegratedSetting(tab: SettingCategory): tab is BackendSettingCategory {
  return SETTINGS_CATEGORY_ITEMS.some((item) => item.id === tab);
}

export function getSettingRecordCategory(tab: SettingCategory) {
  return isSettingRecordCategory(tab) ? SETTING_RECORD_CATEGORY[tab] : undefined;
}
