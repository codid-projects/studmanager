import type { HorseListItemDto, LocaleCode } from '@/lib/api/types';
import { formatDate, localizeGender } from '@/lib/api/horse-formatters';
import { localizeColor } from '@/lib/api/localization';

export interface HorsesExportFilter {
  label: string;
  value: string;
}

export interface HorsesExportContext {
  horses: HorseListItemDto[];
  filters: HorsesExportFilter[];
  locale: LocaleCode;
}

// Amiri is used instead of the app's SFProAR font because SFProAR is missing
// the Arabic isolated presentation forms, which makes jsPDF drop letters.
const PDF_FONT_URL = '/fonts/Amiri-Regular.ttf';
const PDF_FONT_NAME = 'Amiri';

function exportTitle(locale: LocaleCode) {
  return locale === 'ar' ? 'قائمة الخيول' : 'Horses List';
}

function exportFileName(extension: string) {
  return `horses-${new Date().toISOString().slice(0, 10)}.${extension}`;
}

function generatedAtLine(locale: LocaleCode) {
  const stamp = new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date());

  return locale === 'ar' ? `تاريخ التصدير: ${stamp}` : `Exported at: ${stamp}`;
}

function filterLines(filters: HorsesExportFilter[], locale: LocaleCode) {
  if (!filters.length) {
    return [locale === 'ar' ? 'الفلاتر: بدون فلاتر' : 'Filters: none'];
  }

  const prefix = locale === 'ar' ? 'الفلاتر المطبقة' : 'Applied filters';

  return [
    `${prefix}:`,
    ...filters.map((filter) => `• ${filter.label}: ${filter.value}`),
  ];
}

function statusLabel(horse: HorseListItemDto, locale: LocaleCode) {
  if (horse.isSold) return locale === 'ar' ? 'مباع' : 'Sold';
  if (horse.isActive) return locale === 'ar' ? 'نشط' : 'Active';
  return locale === 'ar' ? 'غير نشط' : 'Inactive';
}

function exportHeaders(locale: LocaleCode) {
  return locale === 'ar'
    ? [
        '#',
        'الاسم بالعربية',
        'الاسم بالإنجليزية',
        'النوع',
        'تاريخ الميلاد',
        'اللون',
        'الرسن',
        'الخط الخاص',
        'الأب',
        'الأم',
        'الحالة',
        'رقم الشريحة',
        'الوسوم',
      ]
    : [
        '#',
        'English Name',
        'Arabic Name',
        'Gender',
        'Birth Date',
        'Color',
        'Strain',
        'Special Line',
        'Father',
        'Mother',
        'Status',
        'Microchip',
        'Tags',
      ];
}

function parentName(
  english: string | null | undefined,
  arabic: string | null | undefined,
  locale: LocaleCode,
) {
  if (locale === 'ar') return arabic?.trim() || english?.trim() || '-';
  return english?.trim() || arabic?.trim() || '-';
}

function exportRows(horses: HorseListItemDto[], locale: LocaleCode) {
  return horses.map((horse, index) => {
    const nameCells =
      locale === 'ar'
        ? [horse.arabicName ?? '-', horse.englishName ?? '-']
        : [horse.englishName ?? '-', horse.arabicName ?? '-'];

    return [
      index + 1,
      ...nameCells,
      localizeGender(horse.gender, locale),
      formatDate(horse.dateofBirth),
      horse.color ? localizeColor(horse.color, locale) : '-',
      (locale === 'ar' ? horse.strainAr : horse.strainEn) ??
        horse.strainEn ??
        horse.strainAr ??
        '-',
      (locale === 'ar' ? horse.specialAr : horse.specialEn) ??
        horse.specialEn ??
        horse.specialAr ??
        '-',
      parentName(horse.horseFatherEnglishName, horse.horseFatherArabicName, locale),
      parentName(horse.horseMotherEnglishName, horse.horseMotherArabicName, locale),
      statusLabel(horse, locale),
      horse.microchipID?.trim() || '-',
      (horse.tags ?? [])
        .map((tag) => tag.name?.trim())
        .filter(Boolean)
        .join(', ') || '-',
    ];
  });
}

export async function exportHorsesToExcel({ horses, filters, locale }: HorsesExportContext) {
  const XLSX = await import('xlsx');

  const aoa: Array<Array<string | number>> = [
    [exportTitle(locale)],
    [generatedAtLine(locale)],
    ...filterLines(filters, locale).map((line) => [line]),
    [],
    exportHeaders(locale),
    ...exportRows(horses, locale),
  ];

  const sheet = XLSX.utils.aoa_to_sheet(aoa);
  sheet['!cols'] = [
    { wch: 5 },
    { wch: 28 },
    { wch: 28 },
    { wch: 10 },
    { wch: 14 },
    { wch: 14 },
    { wch: 20 },
    { wch: 20 },
    { wch: 28 },
    { wch: 28 },
    { wch: 10 },
    { wch: 18 },
    { wch: 34 },
  ];

  const workbook = XLSX.utils.book_new();
  if (locale === 'ar') workbook.Workbook = { Views: [{ RTL: true }] };
  XLSX.utils.book_append_sheet(workbook, sheet, 'Horses');
  XLSX.writeFile(workbook, exportFileName('xlsx'));
}

function toBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;

  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }

  return btoa(binary);
}

export async function exportHorsesToPdf({ horses, filters, locale }: HorsesExportContext) {
  const [{ jsPDF }, autoTableModule] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);
  const autoTable = autoTableModule.default;

  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

  // The bundled PDF fonts have no Arabic glyphs, so embed the app's Arabic-capable font.
  const fontResponse = await fetch(PDF_FONT_URL);
  if (!fontResponse.ok) throw new Error('Failed to load PDF font.');
  doc.addFileToVFS(`${PDF_FONT_NAME}.ttf`, toBase64(await fontResponse.arrayBuffer()));
  doc.addFont(`${PDF_FONT_NAME}.ttf`, PDF_FONT_NAME, 'normal');
  // autotable renders headers in bold by default; map bold to the same file so
  // it never falls back to a font without Arabic glyphs.
  doc.addFont(`${PDF_FONT_NAME}.ttf`, PDF_FONT_NAME, 'bold');
  doc.setFont(PDF_FONT_NAME);

  const isRTL = locale === 'ar';
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  const textX = isRTL ? pageWidth - margin : margin;
  const align = isRTL ? 'right' : 'left';

  doc.setFontSize(16);
  doc.text(exportTitle(locale), textX, margin, { align });

  doc.setFontSize(9);
  let cursorY = margin + 18;
  for (const line of [generatedAtLine(locale), ...filterLines(filters, locale)]) {
    doc.text(line, textX, cursorY, { align });
    cursorY += 13;
  }

  let headers = exportHeaders(locale);
  let rows = exportRows(horses, locale);

  if (isRTL) {
    headers = [...headers].reverse();
    rows = rows.map((row) => [...row].reverse());
  }

  autoTable(doc, {
    head: [headers],
    body: rows.map((row) => row.map((cell) => String(cell))),
    startY: cursorY + 8,
    margin: { left: margin, right: margin },
    styles: {
      font: PDF_FONT_NAME,
      fontSize: 8,
      halign: isRTL ? 'right' : 'left',
      cellPadding: 4,
    },
    headStyles: {
      font: PDF_FONT_NAME,
      fillColor: [49, 28, 17],
      textColor: [255, 250, 244],
      halign: isRTL ? 'right' : 'left',
    },
    alternateRowStyles: { fillColor: [251, 246, 239] },
  });

  doc.save(exportFileName('pdf'));
}
