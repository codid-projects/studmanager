'use client';

import { useLocale, useTranslation } from '@/lib/locale-context';
import type { PendingSettingCategory } from './SettingsTabs';

interface SettingsFormProps {
  activeTab: PendingSettingCategory;
}

export function SettingsForm({ activeTab }: SettingsFormProps) {
  const { direction } = useLocale();
  const { t } = useTranslation();
  const isRTL = direction === 'rtl';

  const fields: Record<PendingSettingCategory, { key: string; label: string; placeholder: string; hasPhoneIcon?: boolean }[]> = {
    housing: [
      { key: 'numPlaces', label: t('settings.numPlaces'), placeholder: t('settings.numPlaces') },
      { key: 'numHorses', label: t('settings.numHorses'), placeholder: t('settings.numHorses') },
    ],
    bloodTest: [
      { key: 'labName', label: t('settings.labName'), placeholder: t('settings.labName') },
      { key: 'followUpNumber', label: t('settings.followUpNumber'), placeholder: t('settings.followUpNumber'), hasPhoneIcon: true },
      { key: 'sampleReason', label: t('settings.sampleReason'), placeholder: t('settings.sampleReason') },
    ],
    wormDose: [
      { key: 'doseType', label: t('settings.doseType'), placeholder: t('settings.doseType') },
      { key: 'doseResponsible', label: t('settings.doseResponsible'), placeholder: t('settings.doseResponsible') },
    ],
    hoofLegCare: [
      { key: 'farrierName', label: t('settings.farrierName'), placeholder: t('settings.farrierName') },
      { key: 'farrierNumber', label: t('settings.farrierNumber'), placeholder: t('settings.farrierNumber'), hasPhoneIcon: true },
      { key: 'trimmingType', label: t('settings.trimmingType'), placeholder: t('settings.trimmingType') },
    ],
    injuries: [
      { key: 'practitionerName', label: t('settings.practitionerName'), placeholder: t('settings.practitionerName') },
      { key: 'farrierNumber', label: t('settings.farrierNumber'), placeholder: t('settings.farrierNumber'), hasPhoneIcon: true },
    ],
    medicalCare: [
      { key: 'careType', label: t('settings.careType'), placeholder: t('settings.careType') },
      { key: 'followUpNumber', label: t('settings.followUpNumber'), placeholder: t('settings.followUpNumber'), hasPhoneIcon: true },
    ],
  };

  const activeFields = fields[activeTab] || [];

  return (
    <div className="bg-white p-6 flex-1 h-full min-h-[300px] flex flex-col">
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 ${isRTL ? 'text-right' : 'text-left'}`}>
        {activeFields.map((field, idx) => (
          <div key={idx} className={`flex flex-col gap-1.5 ${field.key === 'sampleReason' || field.key === 'trimmingType' ? 'md:col-span-2' : ''}`}>
            <div className="relative">
              <input
                type="text"
                placeholder={field.placeholder}
                className={`w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#4B2F1A] focus:border-transparent transition-all ${
                  isRTL ? `text-right ${field.hasPhoneIcon ? 'pl-10' : ''}` : `text-left ${field.hasPhoneIcon ? 'pr-10' : ''}`
                }`}
              />
               {field.hasPhoneIcon && (
                <div className={`absolute top-1/2 -translate-y-1/2 text-gray-400 ${isRTL ? 'left-3' : 'right-3'}`}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className={`mt-auto flex ${isRTL ? 'justify-start' : 'justify-end'}`}>
        <button className="bg-[#311C11] text-white px-10 py-3 rounded-xl font-bold hover:bg-[#4B2F1A] transition-colors flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16L21 8V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M17 21V13H7V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M7 3V8H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {t('common.save')}
        </button>
      </div>
    </div>
  );
}
