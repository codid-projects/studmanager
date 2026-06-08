'use client';

import { useLocale, useTranslation } from '@/lib/locale-context';
import type { PendingSettingCategory } from './SettingsTabs';
import { Edit2, Trash2 } from 'lucide-react';

interface SettingsTableProps {
  activeTab: PendingSettingCategory;
}

export function SettingsTable({ activeTab }: SettingsTableProps) {
  const { direction } = useLocale();
  const { t } = useTranslation();
  const isRTL = direction === 'rtl';

  const columns: Record<PendingSettingCategory, { key: string; label: string }[]> = {
    housing: [
      { key: 'numPlaces', label: t('settings.numPlaces') },
      { key: 'numHorses', label: t('settings.numHorses') },
    ],
    bloodTest: [
      { key: 'labName', label: t('settings.labName') },
      { key: 'sampleReason', label: t('settings.sampleReason') },
      { key: 'followUpNumber', label: t('settings.followUpNumber') },
    ],
    wormDose: [
      { key: 'doseType', label: t('settings.doseType') },
      { key: 'doseResponsible', label: t('settings.doseResponsible') },
    ],
    hoofLegCare: [
      { key: 'farrierName', label: t('settings.farrierName') },
      { key: 'farrierNumber', label: t('settings.farrierNumber') },
      { key: 'trimmingType', label: t('settings.trimmingType') },
    ],
    injuries: [
      { key: 'practitionerName', label: t('settings.practitionerName') },
      { key: 'farrierNumber', label: t('settings.farrierNumber') },
    ],
    medicalCare: [
      { key: 'careType', label: t('settings.careType') },
      { key: 'followUpNumber', label: t('settings.followUpNumber') },
    ],
  };

  const activeCols = columns[activeTab] || [];

  // Dynamic mock data generator based on activeTab
  const generateMockData = () => {
    const base = [
      { id: 1, val1: 'Value 1', val2: 'Value 2', val3: '01010101010' },
      { id: 2, val1: 'Value 1', val2: 'Value 2', val3: '01010101010' },
      { id: 3, val1: 'Value 1', val2: 'Value 2', val3: '01010101010' },
      { id: 4, val1: 'Value 1', val2: 'Value 2', val3: '01010101010' },
    ];

    switch (activeTab) {
      case 'housing':
        return base.map(row => ({ ...row, val1: '100', val2: '50' }));
      case 'bloodTest':
        return base.map(row => ({ ...row, val1: t('settings.labName'), val2: t('settings.sampleReason'), val3: '01010101010' }));
      case 'wormDose':
        return base.map(row => ({ ...row, val1: t('settings.doseType'), val2: t('settings.doseResponsible') }));
      case 'hoofLegCare':
        return base.map(row => ({ ...row, val1: t('settings.farrierName'), val2: '01010101010', val3: t('settings.trimmingType') }));
      case 'injuries':
        return base.map(row => ({ ...row, val1: t('settings.practitionerName'), val2: '01010101010' }));
      case 'medicalCare':
        return base.map(row => ({ ...row, val1: t('settings.careType'), val2: '01010101010' }));
      default:
        return base;
    }
  };

  const data = generateMockData();

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#3B2B20] text-white">
              {activeCols.map((col) => (
                <th
                  key={col.key}
                  className={`py-4 px-6 text-sm font-bold ${isRTL ? 'text-right' : 'text-left'}`}
                >
                  {col.label}
                </th>
              ))}
              <th className={`py-4 px-6 text-sm font-bold text-center`}>
                {t('common.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="text-[1.05rem] text-[#20203C] hover:[&_tr]:bg-gray-50 transition-colors">
            {data.map((row) => (
              <tr key={row.id} className="border-b border-gray-50 last:border-0 transition-colors">
                {activeCols.map((_, colIdx) => (
                  <td key={colIdx} className={`py-4 px-6 text-sm text-[#20203C] font-medium ${isRTL ? 'text-right' : 'text-left'}`}>
                    {colIdx === 0 ? row.val1 : colIdx === 1 ? row.val2 : row.val3}
                  </td>
                ))}
                <td className="py-4 px-6">
                  <div className="flex items-center justify-center gap-3">
                    <button className="p-2 text-[#E53E3E] hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={18} />
                    </button>
                    <span className="w-px h-6 bg-gray-200" />
                    <button className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg transition-colors">
                      <Edit2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
