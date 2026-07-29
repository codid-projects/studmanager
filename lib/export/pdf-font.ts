import type { jsPDF } from 'jspdf';

// Amiri is used instead of the app's SFProAR font because SFProAR is missing
// the Arabic isolated presentation forms, which makes jsPDF drop letters.
const PDF_FONT_URL = '/fonts/Amiri-Regular.ttf';

export const PDF_FONT_NAME = 'Amiri';

function toBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;

  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }

  return btoa(binary);
}

/**
 * Embeds the Arabic-capable font and selects it, so Arabic exports keep their
 * glyphs instead of falling back to jsPDF's Latin-only built-ins.
 */
export async function registerPdfFont(doc: jsPDF) {
  const fontResponse = await fetch(PDF_FONT_URL);
  if (!fontResponse.ok) throw new Error('Failed to load PDF font.');

  doc.addFileToVFS(`${PDF_FONT_NAME}.ttf`, toBase64(await fontResponse.arrayBuffer()));
  doc.addFont(`${PDF_FONT_NAME}.ttf`, PDF_FONT_NAME, 'normal');
  // autotable renders headers in bold by default; map bold to the same file so
  // it never falls back to a font without Arabic glyphs.
  doc.addFont(`${PDF_FONT_NAME}.ttf`, PDF_FONT_NAME, 'bold');
  doc.setFont(PDF_FONT_NAME);
}
