// @ts-ignore
import PDFDocument from 'pdfkit/js/pdfkit.standalone.js';
import fs from 'fs';
import path from 'path';
import { getCurrencySymbol } from './currency';
import { Invoice, InvoiceItem, Doctor, Patient, PatientPayment } from '@prisma/client';
import { numberToWords } from './number-to-words';

type InvoiceWithDetails = Invoice & {
  items: InvoiceItem[];
  doctor: Doctor;
  patient: Patient;
  payments?: PatientPayment[];
};

/**
 * Robust logo buffer loader supporting local filesystem, base64 data URIs, and remote URLs.
 */
async function loadLogoBuffer(imageStr?: string | null): Promise<Buffer | null> {
  if (!imageStr || !imageStr.trim()) return null;
  const img = imageStr.trim();

  // 1. Base64 Data URI
  if (img.startsWith('data:')) {
    try {
      const base64Data = img.split(',')[1];
      if (base64Data) return Buffer.from(base64Data, 'base64');
    } catch (e) {
      console.error('Failed to parse base64 logo:', e);
    }
  }

  // 2. Relative upload URL (e.g. /api/uploads/logos/... or /uploads/...)
  if (img.startsWith('/')) {
    try {
      let relativePath = img;
      if (relativePath.startsWith('/api/uploads/')) {
        relativePath = relativePath.replace('/api/uploads/', '/uploads/');
      }
      const localPath = path.join(process.cwd(), 'public', relativePath);
      if (fs.existsSync(localPath)) {
        return fs.readFileSync(localPath);
      }

      // Try fetching using app URL
      const appUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://gyrex.in';
      const fullUrl = `${appUrl.replace(/\/$/, '')}${img}`;
      const res = await fetch(fullUrl);
      if (res.ok) {
        return Buffer.from(await res.arrayBuffer());
      }
    } catch (e) {
      console.error('Failed to load local logo file:', e);
    }
  }

  // 3. Absolute remote URL (http / https)
  if (img.startsWith('http://') || img.startsWith('https://')) {
    try {
      const res = await fetch(img);
      if (res.ok) {
        return Buffer.from(await res.arrayBuffer());
      }
    } catch (e) {
      console.error('Failed to fetch remote logo:', e);
    }
  }

  return null;
}

export async function generateInvoicePDF(invoice: InvoiceWithDetails): Promise<Buffer> {
  const logoBuffer = await loadLogoBuffer(invoice.doctor.image);

  return new Promise((resolve, reject) => {
    try {
      // Create A4 portrait document
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });

      doc.on('error', (err: any) => {
        reject(err);
      });

      // Register Roboto fonts for better unicode currency symbol support (e.g. Rupee ₹)
      try {
        const fontPath = path.join(process.cwd(), 'public', 'fonts', 'Roboto-Regular.ttf');
        const fontBoldPath = path.join(process.cwd(), 'public', 'fonts', 'Roboto-Bold.ttf');

        if (fs.existsSync(fontPath)) {
          doc.registerFont('Roboto', new Uint8Array(fs.readFileSync(fontPath)));
        }
        if (fs.existsSync(fontBoldPath)) {
          doc.registerFont('Roboto-Bold', new Uint8Array(fs.readFileSync(fontBoldPath)));
        }
      } catch (fontErr) {
        console.warn('Font registration fallback to default:', fontErr);
      }

      const sym = invoice.currencySymbol || getCurrencySymbol(invoice.currencyCode);

      // ════════════ HEADER SECTION (LEFT: CLINIC INFO, RIGHT: INVOICE DETAILS) ════════════
      const clinicName = invoice.doctor.clinicName || invoice.doctor.name || 'Clinic';
      let leftY = 45;

      // 1. Clinic Info (Left Column: bounded to width 270 to prevent colliding with right column)
      if (logoBuffer) {
        try {
          doc.image(logoBuffer, 50, 45, { fit: [55, 45] });
          doc.fontSize(16).font('Roboto-Bold').fillColor('#0F172A').text(clinicName, 115, 45, { width: 205 });
          leftY = Math.max(doc.y, 95);
        } catch (imgErr) {
          doc.fontSize(16).font('Roboto-Bold').fillColor('#0F172A').text(clinicName, 50, 45, { width: 270 });
          leftY = doc.y + 4;
        }
      } else {
        doc.fontSize(16).font('Roboto-Bold').fillColor('#0F172A').text(clinicName, 50, 45, { width: 270 });
        leftY = doc.y + 4;
      }

      doc.fontSize(9).font('Roboto').fillColor('#475569');
      if (invoice.doctor.address) {
        doc.text(invoice.doctor.address, 50, leftY, { width: 270 });
        leftY = doc.y + 2;
      }

      const cityStateCountry = [invoice.doctor.city, invoice.doctor.state, invoice.doctor.country].filter(Boolean).join(', ');
      if (cityStateCountry) {
        doc.text(cityStateCountry, 50, leftY, { width: 270 });
        leftY = doc.y + 2;
      }

      if (invoice.doctor.phone) {
        doc.text(`Phone: ${invoice.doctor.phone}`, 50, leftY, { width: 270 });
        leftY = doc.y + 2;
      }

      if (invoice.doctor.email) {
        doc.text(`Email: ${invoice.doctor.email}`, 50, leftY, { width: 270 });
        leftY = doc.y + 2;
      }

      if (invoice.doctor.taxGstNumber) {
        doc.text(`GSTIN: ${invoice.doctor.taxGstNumber}`, 50, leftY, { width: 270 });
        leftY = doc.y + 2;
      }

      // 2. Invoice Details (Right Column: positioned at x: 340, width: 210, right aligned)
      const isPaid = invoice.status === 'PAID';
      const docTypeTitle = isPaid ? 'RECEIPT' : 'INVOICE';

      doc.fontSize(22).font('Roboto-Bold').fillColor('#0F172A').text(docTypeTitle, 340, 45, { align: 'right', width: 210 });
      doc.fontSize(9).font('Roboto').fillColor('#64748B')
         .text(`Invoice Number: ${invoice.invoiceNumber}`, 340, 72, { align: 'right', width: 210 })
         .text(`Date: ${new Date(invoice.issueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`, 340, 86, { align: 'right', width: 210 });

      // Clean formatted status badge
      const statusConfig: Record<string, { label: string; color: string }> = {
        PAID: { label: 'Paid', color: '#16A34A' },
        PARTIALLY_PAID: { label: 'Partially Paid', color: '#2563EB' },
        UNPAID: { label: 'Unpaid', color: '#D97706' },
        OVERDUE: { label: 'Overdue', color: '#DC2626' },
        DRAFT: { label: 'Draft', color: '#64748B' },
        CANCELLED: { label: 'Cancelled', color: '#94A3B8' },
      };
      const currentStatus = statusConfig[invoice.status] || {
        label: invoice.status.replace(/_/g, ' '),
        color: '#64748B',
      };

      doc.font('Roboto-Bold').fillColor(currentStatus.color).text(`Status: ${currentStatus.label}`, 340, 100, { align: 'right', width: 210 });

      let rightY = 114;
      if (invoice.dueDate) {
        doc.font('Roboto').fillColor('#64748B').text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`, 340, rightY, { align: 'right', width: 210 });
        rightY += 14;
      }

      // Safe separation divider: dynamically calculates max height
      const headerDividerY = Math.max(leftY, rightY) + 12;
      doc.strokeColor('#E2E8F0').lineWidth(1).moveTo(50, headerDividerY).lineTo(550, headerDividerY).stroke();

      // ════════════ BILL TO SECTION ════════════
      const billToY = headerDividerY + 14;
      const patientCode = `PAT-${invoice.patient.id.slice(-6).toUpperCase()}`;

      // Deduplicate patient name if firstName and lastName are identical (e.g. Reshma Reshma)
      const pFirst = (invoice.patient.firstName || '').trim();
      const pLast = (invoice.patient.lastName || '').trim();
      const cleanPatientName = (pLast && pLast.toLowerCase() !== pFirst.toLowerCase())
        ? `${pFirst} ${pLast}`
        : pFirst;

      doc.fontSize(10).font('Roboto-Bold').fillColor('#0F172A').text('Bill To:', 50, billToY);
      doc.fontSize(9).font('Roboto').fillColor('#334155')
         .text(`Name: ${cleanPatientName}`, 50, billToY + 15, { width: 270 })
         .text(`Patient ID: ${patientCode}`, 50, billToY + 28, { width: 270 })
         .text(`Phone: ${invoice.patient.phone}`, 50, billToY + 41, { width: 270 });

      let ptBottomY = billToY + 54;
      if (invoice.patient.email) {
        doc.text(`Email: ${invoice.patient.email}`, 50, billToY + 54, { width: 270 });
        ptBottomY += 13;
      }

      const tableDividerY = ptBottomY + 8;
      doc.strokeColor('#E2E8F0').moveTo(50, tableDividerY).lineTo(550, tableDividerY).stroke();

      // ════════════ ITEMS TABLE ════════════
      let y = tableDividerY + 14;
      doc.fontSize(9).font('Roboto-Bold').fillColor('#475569');
      doc.text('Description', 50, y, { width: 290 });
      doc.text('Qty', 340, y, { width: 40, align: 'right' });
      doc.text('Unit Price', 390, y, { width: 70, align: 'right' });
      doc.text('Total', 470, y, { width: 80, align: 'right' });

      doc.strokeColor('#E2E8F0').moveTo(50, y + 14).lineTo(550, y + 14).stroke();
      doc.font('Roboto').fillColor('#0F172A');
      y += 22;

      for (const item of invoice.items) {
        doc.text(item.description, 50, y, { width: 290 });
        doc.text(item.quantity.toString(), 340, y, { width: 40, align: 'right' });
        doc.text(`${sym}${item.unitPrice.toFixed(2)}`, 390, y, { width: 70, align: 'right' });
        doc.text(`${sym}${item.total.toFixed(2)}`, 470, y, { width: 80, align: 'right' });
        y += 18;
      }

      doc.strokeColor('#E2E8F0').moveTo(50, y + 6).lineTo(550, y + 6).stroke();
      y += 16;

      // ════════════ TOTALS & FINANCIAL SUMMARY ════════════
      doc.font('Roboto-Bold').fillColor('#334155');
      doc.text('Subtotal:', 340, y, { width: 120, align: 'right' });
      doc.text(`${sym}${invoice.subtotal.toFixed(2)}`, 470, y, { width: 80, align: 'right' });
      y += 16;

      if (invoice.discountAmount > 0) {
        doc.font('Roboto').fillColor('#16A34A');
        doc.text('Discount:', 340, y, { width: 120, align: 'right' });
        doc.text(`-${sym}${invoice.discountAmount.toFixed(2)}`, 470, y, { width: 80, align: 'right' });
        y += 16;
      }

      if ((invoice as any).taxAmount > 0) {
        doc.font('Roboto').fillColor('#64748B');
        doc.text('Tax:', 340, y, { width: 120, align: 'right' });
        doc.text(`${sym}${(invoice as any).taxAmount.toFixed(2)}`, 470, y, { width: 80, align: 'right' });
        y += 16;
      }

      doc.strokeColor('#E2E8F0').moveTo(340, y).lineTo(550, y).stroke();
      y += 8;

      // Grand Total
      doc.fontSize(11).font('Roboto-Bold').fillColor('#0F172A');
      doc.text('Grand Total:', 340, y, { width: 120, align: 'right' });
      doc.text(`${sym}${invoice.totalAmount.toFixed(2)}`, 470, y, { width: 80, align: 'right' });
      y += 18;

      // Amount Paid
      const amountPaid = invoice.payments ? invoice.payments.reduce((sum, p) => sum + p.amount, 0) : 0;
      const balanceDue = Math.max(0, invoice.totalAmount - amountPaid);

      doc.fontSize(9).font('Roboto').fillColor('#475569');
      doc.text('Amount Paid:', 340, y, { width: 120, align: 'right' });
      doc.text(`${sym}${amountPaid.toFixed(2)}`, 470, y, { width: 80, align: 'right' });
      y += 18;

      // BALANCE DUE IN BOLD RED COLOR
      if (balanceDue > 0.01) {
        doc.fontSize(11).font('Roboto-Bold').fillColor('#DC2626'); // Red color for outstanding due!
        doc.text('Balance Due:', 340, y, { width: 120, align: 'right' });
        doc.text(`${sym}${balanceDue.toFixed(2)}`, 470, y, { width: 80, align: 'right' });
      } else {
        doc.fontSize(10).font('Roboto-Bold').fillColor('#16A34A'); // Green for fully paid!
        doc.text('Balance Due:', 340, y, { width: 120, align: 'right' });
        doc.text(`${sym}0.00 (Fully Paid)`, 440, y, { width: 110, align: 'right' });
      }
      doc.fillColor('black'); // Reset back
      y += 28;

      // Amount in Words
      doc.fontSize(9).font('Roboto-Bold').fillColor('#0F172A').text('Amount in Words:', 50, y);
      doc.font('Roboto').fillColor('#475569').text(numberToWords(invoice.totalAmount, invoice.currencyCode), 50, y + 14, { width: 500 });
      y += 32;

      // ════════════ FOOTER ════════════
      let footerY = 710;
      if (invoice.notes) {
        doc.fontSize(9).font('Roboto-Bold').fillColor('#0F172A').text('Notes:', 50, footerY);
        doc.font('Roboto').fillColor('#475569').text(invoice.notes, 50, footerY + 12, { width: 500 });
        footerY += 35;
      }

      if (invoice.doctor.invoiceFooter) {
        doc.fontSize(8).font('Roboto').fillColor('#64748B');
        doc.text(invoice.doctor.invoiceFooter, 50, footerY, { width: 500, align: 'center' });
        footerY += 16;
      }

      doc.fontSize(8).font('Roboto').fillColor('#94A3B8');
      doc.text('Generated by Gyrex', 50, footerY, { width: 500, align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
