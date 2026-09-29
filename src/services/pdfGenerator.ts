import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface ExportPdfOptions {
  filename?: string;
  onProgress?: (status: string) => void;
}

/**
 * Exports an HTML element (or multiple .pdf-page-sheet elements within it) to a PDF file
 * using html2canvas and jsPDF, ensuring high-resolution Thai font rendering and proper pagination.
 */
export async function exportElementToPdf(
  element: HTMLElement,
  options: ExportPdfOptions = {}
): Promise<void> {
  const { filename = 'รายงานสรุปผลการตรวจสอบพัสดุ.pdf', onProgress } = options;

  onProgress?.('กำลังเตรียมข้อมูลเอกสาร...');

  // Check if element contains individual page sheets
  const pageSheets = element.querySelectorAll<HTMLElement>('.pdf-page-sheet');

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const a4WidthMm = 210;
  const a4HeightMm = 297;

  if (pageSheets && pageSheets.length > 0) {
    // Process each page sheet individually for crisp page boundaries
    const totalSheets = pageSheets.length;

    for (let i = 0; i < totalSheets; i++) {
      const sheet = pageSheets[i];
      onProgress?.(`กำลังสร้างหน้า PDF ${i + 1} จาก ${totalSheets}...`);

      const canvas = await html2canvas(sheet, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 820,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);

      if (i > 0) {
        pdf.addPage('a4', 'portrait');
      }

      // Add image filling the A4 page
      pdf.addImage(imgData, 'JPEG', 0, 0, a4WidthMm, a4HeightMm);
    }
  } else {
    // Single container pagination fallback
    onProgress?.('กำลังเรนเดอร์เอกสาร...');
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 820,
    });

    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    // Calculate height in mm on an A4 sheet (full width 210mm)
    const pageHeightPx = Math.floor((imgWidth / a4WidthMm) * a4HeightMm);
    let currentY = 0;
    let pageNum = 0;

    while (currentY < imgHeight) {
      onProgress?.(`กำลังจัดเตรียมหน้า PDF ที่ ${pageNum + 1}...`);
      const sliceHeight = Math.min(pageHeightPx, imgHeight - currentY);

      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = imgWidth;
      pageCanvas.height = pageHeightPx;
      const ctx = pageCanvas.getContext('2d');

      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, imgWidth, pageHeightPx);
        ctx.drawImage(
          canvas,
          0,
          currentY,
          imgWidth,
          sliceHeight,
          0,
          0,
          imgWidth,
          sliceHeight
        );
      }

      const pageData = pageCanvas.toDataURL('image/jpeg', 0.95);

      if (pageNum > 0) {
        pdf.addPage('a4', 'portrait');
      }

      pdf.addImage(pageData, 'JPEG', 0, 0, a4WidthMm, a4HeightMm);

      currentY += sliceHeight;
      pageNum++;
    }
  }

  onProgress?.('กำลังบันทึกและดาวน์โหลดไฟล์ PDF...');
  pdf.save(filename);
}

/**
 * Parse numeric asset value safely
 */
export function parseAssetValue(val?: string): number {
  if (!val) return 0;
  const cleaned = val.replace(/,/g, '').replace(/[^0-9.]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Format currency in Thai Baht format
 */
export function formatBaht(num: number): string {
  return num.toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
