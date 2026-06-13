import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import type { PdfPreview } from '../types/score';

GlobalWorkerOptions.workerSrc = workerUrl;

export const MAX_PDF_SIZE = 20 * 1024 * 1024;
export const MAX_PDF_PAGES = 20;

export async function inspectPdf(file: File): Promise<PdfPreview> {
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    throw new Error('Choose a PDF file.');
  }
  if (file.size > MAX_PDF_SIZE) {
    throw new Error('PDFs must be 20 MB or smaller.');
  }

  const data = await file.arrayBuffer();
  const pdf = await getDocument({ data }).promise;
  if (pdf.numPages > MAX_PDF_PAGES) {
    throw new Error(`PDFs may contain at most ${MAX_PDF_PAGES} pages.`);
  }

  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 1.2 });
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('PDF preview is not available in this browser.');
  }
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  await page.render({ canvas, canvasContext: context, viewport }).promise;

  return {
    pageCount: pdf.numPages,
    previewUrl: canvas.toDataURL('image/jpeg', 0.82)
  };
}
