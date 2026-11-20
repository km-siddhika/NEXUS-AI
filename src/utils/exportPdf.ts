import { jsPDF } from 'jspdf';

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      return true;
    } catch {
      return false;
    } finally {
      document.body.removeChild(textarea);
    }
  }
}

export function exportDocumentToPdf(params: {
  title: string;
  subtitle?: string;
  sections: Array<{ heading: string; content: string }>;
  filename?: string;
}): void {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 48;
  const maxWidth = pageWidth - margin * 2;
  let y = 52;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - 56) {
      doc.addPage();
      y = 52;
    }
  };

  // Brand header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(121, 85, 232); // #7955E8
  doc.text('NEXUS AI — INNOVATION BRIEF', margin, y);
  y += 22;

  // Document Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(23, 23, 37); // #171725
  const titleLines = doc.splitTextToSize(params.title, maxWidth) as string[];
  doc.text(titleLines, margin, y);
  y += titleLines.length * 24 + 4;

  if (params.subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor(119, 119, 137);
    doc.text(params.subtitle, margin, y);
    y += 18;
  }

  doc.setDrawColor(236, 236, 242);
  doc.line(margin, y, pageWidth - margin, y);
  y += 24;

  for (const section of params.sections) {
    ensureSpace(64);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12.5);
    doc.setTextColor(23, 23, 37);
    const headLines = doc.splitTextToSize(section.heading, maxWidth) as string[];
    doc.text(headLines, margin, y);
    y += headLines.length * 16 + 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor(65, 65, 82);
    const bodyLines = doc.splitTextToSize(section.content || '—', maxWidth) as string[];
    for (const line of bodyLines) {
      ensureSpace(16);
      doc.text(line, margin, y);
      y += 15;
    }
    y += 14;
  }

  // Disclaimer footer on last page
  ensureSpace(40);
  doc.setDrawColor(236, 236, 242);
  doc.line(margin, pageHeight - 48, pageWidth - margin, pageHeight - 48);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(119, 119, 137);
  doc.text(
    '© 2026 NEXUS AI. AI-generated estimates and suggestions should be independently verified.',
    margin,
    pageHeight - 32
  );

  const safeName = (params.filename || params.title || 'nexus-report')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  doc.save(`${safeName || 'nexus-report'}.pdf`);
}
