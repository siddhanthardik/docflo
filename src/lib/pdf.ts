// @ts-ignore
import PDFDocument from 'pdfkit/js/pdfkit.standalone.js';
import { getCurrencySymbol } from './currency';
import { Invoice, InvoiceItem, Doctor, Patient, PatientPayment } from '@prisma/client';

type InvoiceWithDetails = Invoice & {
  items: InvoiceItem[];
  doctor: Doctor;
  patient: Patient;
  payments?: PatientPayment[];
};

export async function generateInvoicePDF(invoice: InvoiceWithDetails): Promise<Buffer> {
  let logoBuffer: Buffer | null = null;
  if (invoice.doctor.image) {
    try {
      const imgRes = await fetch(invoice.doctor.image);
      if (imgRes.ok) {
        logoBuffer = Buffer.from(await imgRes.arrayBuffer());
      }
    } catch (e) {
      console.error('Failed to fetch invoice logo:', e);
    }
  }

  return new Promise((resolve, reject) => {
    try {
      // Create A4 portrait document
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });

      // We don't have font support for all currencies built into standard PDFKit fonts (like Rupee symbol) easily without a custom font file.
      // So we will use the currency code (e.g. INR) if standard fonts fail, or just rely on the symbol passed. PDFKit Helvetica doesn't support ₹ well.
      // Actually, since PDFKit uses standard fonts, we might just output the symbol string.
      // A common workaround is just using the currency code or symbol if supported.
      const sym = invoice.currencySymbol || getCurrencySymbol(invoice.currencyCode);

      // Clinic Info (Header)
      const clinicName = invoice.doctor.clinicName || invoice.doctor.name || 'Clinic';
      
      if (logoBuffer) {
        doc.image(logoBuffer, 50, 45, { height: 40 });
        doc.fontSize(20).text(clinicName, 100, 50);
      } else {
        doc.fontSize(20).text(clinicName, 50, 50);
      }
        
      doc.fontSize(10)
         .text(invoice.doctor.address || '', 50, 75)
         .text([invoice.doctor.city, invoice.doctor.state, invoice.doctor.country].filter(Boolean).join(', '), 50, 90)
         .text(`Phone: ${invoice.doctor.phone || ''}`, 50, 105)
         .text(`Email: ${invoice.doctor.email || ''}`, 50, 120);

      if (invoice.doctor.taxGstNumber) {
         doc.text(`GST No: ${invoice.doctor.taxGstNumber}`, 50, 135);
      }

      // Invoice Details
      doc.fontSize(20).text(invoice.status === 'PAID' ? 'RECEIPT' : 'INVOICE', 350, 50, { align: 'right', width: 200 });
      doc.fontSize(10)
         .text(`Invoice Number: ${invoice.invoiceNumber}`, 350, 75, { align: 'right', width: 200 })
         .text(`Date: ${invoice.issueDate.toLocaleDateString()}`, 350, 90, { align: 'right', width: 200 })
         .text(`Status: ${invoice.status}`, 350, 105, { align: 'right', width: 200 });
      
      if (invoice.dueDate) {
         doc.text(`Due Date: ${invoice.dueDate.toLocaleDateString()}`, 350, 120, { align: 'right', width: 200 });
      }

      doc.moveTo(50, 160).lineTo(550, 160).stroke();

      // Bill To
      doc.fontSize(12).font('Helvetica-Bold').text('Bill To:', 50, 180);
      doc.fontSize(10).font('Helvetica')
         .text(`Name: ${invoice.patient.firstName} ${invoice.patient.lastName}`, 50, 195)
         .text(`Patient ID: ${invoice.patient.id.slice(-6).toUpperCase()}`, 50, 210)
         .text(`Phone: ${invoice.patient.phone}`, 50, 225);
      
      if (invoice.patient.email) {
         doc.text(`Email: ${invoice.patient.email}`, 50, 240);
      }

      doc.moveTo(50, 260).lineTo(550, 260).stroke();

      // Table Header
      let y = 280;
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('Description', 50, y);
      doc.text('Qty', 350, y, { width: 50, align: 'right' });
      doc.text('Unit Price', 400, y, { width: 70, align: 'right' });
      doc.text('Total', 470, y, { width: 80, align: 'right' });
      
      doc.moveTo(50, y + 15).lineTo(550, y + 15).stroke();
      doc.font('Helvetica');
      y += 25;

      // Table Rows
      for (const item of invoice.items) {
        doc.text(item.description, 50, y, { width: 300 });
        doc.text(item.quantity.toString(), 350, y, { width: 50, align: 'right' });
        doc.text(`${sym}${item.unitPrice.toFixed(2)}`, 400, y, { width: 70, align: 'right' });
        doc.text(`${sym}${item.total.toFixed(2)}`, 470, y, { width: 80, align: 'right' });
        y += 20;
      }

      doc.moveTo(50, y + 10).lineTo(550, y + 10).stroke();
      y += 25;

      // Totals
      doc.font('Helvetica-Bold');
      doc.text('Subtotal:', 350, y, { width: 120, align: 'right' });
      doc.text(`${sym}${invoice.subtotal.toFixed(2)}`, 470, y, { width: 80, align: 'right' });
      y += 20;

      if (invoice.discountAmount > 0) {
        doc.font('Helvetica');
        doc.text('Discount:', 350, y, { width: 120, align: 'right' });
        doc.text(`-${sym}${invoice.discountAmount.toFixed(2)}`, 470, y, { width: 80, align: 'right' });
        y += 20;
      }

      if ((invoice as any).taxAmount > 0) {
        doc.font('Helvetica');
        doc.text('Tax:', 350, y, { width: 120, align: 'right' });
        doc.text(`${sym}${(invoice as any).taxAmount.toFixed(2)}`, 470, y, { width: 80, align: 'right' });
        y += 20;
      }

      doc.moveTo(350, y).lineTo(550, y).stroke();
      y += 10;

      doc.fontSize(12).font('Helvetica-Bold');
      doc.text('Grand Total:', 350, y, { width: 120, align: 'right' });
      doc.text(`${sym}${invoice.totalAmount.toFixed(2)}`, 470, y, { width: 80, align: 'right' });
      y += 20;
      
      const amountPaid = invoice.payments ? invoice.payments.reduce((sum, p) => sum + p.amount, 0) : 0;
      const balanceDue = Math.max(0, invoice.totalAmount - amountPaid);
      
      doc.fontSize(10).font('Helvetica');
      doc.text('Amount Paid:', 350, y, { width: 120, align: 'right' });
      doc.text(`${sym}${amountPaid.toFixed(2)}`, 470, y, { width: 80, align: 'right' });
      y += 20;

      doc.font('Helvetica-Bold');
      doc.text('Balance Due:', 350, y, { width: 120, align: 'right' });
      doc.text(`${sym}${balanceDue.toFixed(2)}`, 470, y, { width: 80, align: 'right' });

      // Footer
      let footerY = 700;
      if (invoice.notes) {
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Notes:', 50, footerY);
        doc.font('Helvetica');
        doc.text(invoice.notes, 50, footerY + 15, { width: 500 });
        footerY += 40;
      }
      
      if (invoice.doctor.invoiceFooter) {
        doc.fontSize(9).font('Helvetica').fillColor('gray');
        doc.text(invoice.doctor.invoiceFooter, 50, footerY, { width: 500, align: 'center' });
        footerY += 20;
      }
      
      doc.fontSize(8).fillColor('gray');
      doc.text('Generated by Gyrex', 50, footerY, { width: 500, align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
