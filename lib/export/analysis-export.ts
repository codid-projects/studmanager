import type { LocaleCode } from '@/lib/api/types';
import { PDF_FONT_NAME, registerPdfFont } from './pdf-font';

export interface AnalysisExportContext {
  /** Heading printed above the table. */
  title: string;
  /** Sub-heading with the horse name / line the table belongs to. */
  subtitle?: string;
  headers: string[];
  rows: Array<Array<string | number>>;
  locale: LocaleCode;
  /** File name without an extension. */
  fileName: string;
}

function generatedAtLine(locale: LocaleCode) {
  const stamp = new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date());

  return locale === 'ar' ? `تاريخ التصدير: ${stamp}` : `Exported at: ${stamp}`;
}

export async function exportAnalysisToExcel({
  title,
  subtitle,
  headers,
  rows,
  locale,
  fileName,
}: AnalysisExportContext) {
  const XLSX = await import('xlsx');

  const aoa: Array<Array<string | number>> = [
    [title],
    ...(subtitle ? [[subtitle]] : []),
    [generatedAtLine(locale)],
    [],
    headers,
    ...rows,
  ];

  const sheet = XLSX.utils.aoa_to_sheet(aoa);
  sheet['!cols'] = headers.map((_, index) => ({ wch: index === 0 ? 28 : 16 }));

  const workbook = XLSX.utils.book_new();
  if (locale === 'ar') workbook.Workbook = { Views: [{ RTL: true }] };
  XLSX.utils.book_append_sheet(workbook, sheet, 'Analysis');
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}

export async function exportAnalysisToPdf({
  title,
  subtitle,
  headers,
  rows,
  locale,
  fileName,
}: AnalysisExportContext) {
  const [{ jsPDF }, autoTableModule] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);
  const autoTable = autoTableModule.default;

  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

  // The bundled PDF fonts have no Arabic glyphs, so embed the app's Arabic-capable font.
  await registerPdfFont(doc);

  const isRTL = locale === 'ar';
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  const textX = isRTL ? pageWidth - margin : margin;
  const align = isRTL ? 'right' : 'left';

  doc.setFontSize(16);
  doc.text(title, textX, margin, { align });

  doc.setFontSize(9);
  let cursorY = margin + 18;
  for (const line of [...(subtitle ? [subtitle] : []), generatedAtLine(locale)]) {
    doc.text(line, textX, cursorY, { align });
    cursorY += 13;
  }

  let head = headers;
  let body = rows;

  if (isRTL) {
    head = [...headers].reverse();
    body = rows.map((row) => [...row].reverse());
  }

  autoTable(doc, {
    head: [head],
    body: body.map((row) => row.map((cell) => String(cell))),
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
      fillColor: [61, 42, 27],
      textColor: [255, 250, 244],
      halign: isRTL ? 'right' : 'left',
    },
    alternateRowStyles: { fillColor: [251, 246, 239] },
  });

  doc.save(`${fileName}.pdf`);
}
