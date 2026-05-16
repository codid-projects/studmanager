'use client';

import type { LocaleCode, RelatedHorseDto } from '@/lib/api/types';
import { formatDate, localizeGender, relatedHorseName } from '@/lib/api/horse-formatters';
import { useLocale } from '@/lib/locale-context';

interface RelatedHorsesTableProps {
  rows: RelatedHorseDto[];
  title: string;
  error?: string;
}

export function RelatedHorsesTable({ rows, title, error = '' }: RelatedHorsesTableProps) {
  const { locale, direction } = useLocale();
  const isRTL = direction === 'rtl';

  return (
    <div className={`mb-12 ${isRTL ? 'text-right' : 'text-left'}`}>
      <div className="mb-6 flex">
        <h2 className="text-2xl font-bold text-[#2a2a2a]">{title}</h2>
      </div>

      {error ? (
        <div className="mb-4 rounded-2xl border border-[#f2c7c7] bg-[#fff3f3] px-4 py-3 text-sm text-[#b04444]">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-center text-sm">
            <thead className="bg-[#3d2a1b] text-white">
              <tr>
                <th className="px-6 py-4 font-semibold">{isRTL ? 'الإسم' : 'Name'}</th>
                <th className="px-6 py-4 font-semibold">{isRTL ? 'تاريخ الميلاد' : 'Birth Date'}</th>
                <th className="px-6 py-4 font-semibold">{isRTL ? 'النوع' : 'Gender'}</th>
                <th className="px-6 py-4 font-semibold">{isRTL ? 'الأب' : 'Father'}</th>
                <th className="px-6 py-4 font-semibold">{isRTL ? 'الأم' : 'Mother'}</th>
              </tr>
            </thead>
            <tbody>
              {rows.length ? (
                rows.map((row, index) => (
                  <tr key={`${row.englishName}-${row.arabicName}-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                    <td className="border-b border-gray-100 px-6 py-4">{relatedHorseName(row, locale as LocaleCode)}</td>
                    <td className="border-b border-gray-100 px-6 py-4">{formatDate(row.dateOfBirth)}</td>
                    <td className="border-b border-gray-100 px-6 py-4">{localizeGender(row.gender, locale as LocaleCode)}</td>
                    <td className="border-b border-gray-100 px-6 py-4">
                      {locale === 'ar' ? row.fatherArabicName ?? row.fatherEnglishName ?? '-' : row.fatherEnglishName ?? row.fatherArabicName ?? '-'}
                    </td>
                    <td className="border-b border-gray-100 px-6 py-4">
                      {locale === 'ar' ? row.motherArabicName ?? row.motherEnglishName ?? '-' : row.motherEnglishName ?? row.motherArabicName ?? '-'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-[#7a6c63]">
                    {isRTL ? 'لا توجد سجلات' : 'No records found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
