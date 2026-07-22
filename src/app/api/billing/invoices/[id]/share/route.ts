import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionData } from "@/lib/session";
import { entitlementGuard } from "@/lib/withEntitlements";
import { whatsappManager } from "@/lib/whatsapp-manager";
import { generateInvoicePDF } from "@/lib/pdf";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { doctorId } = await getSessionData();
    if (!doctorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const block = await entitlementGuard(doctorId, req, { module: "WHATSAPP_CRM" });
    if (block) return block;

    const { type } = await req.json(); // "INVOICE" | "RECEIPT" | "REMINDER"

    const invoice = await prisma.invoice.findUnique({
      where: { id, doctorId },
      include: {
        items: true,
        doctor: true,
        patient: true,
      }
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (!invoice.patient.phone) {
      return NextResponse.json({ error: "Patient has no phone number" }, { status: 400 });
    }

    // Generate PDF
    const pdfBuffer = await generateInvoicePDF(invoice as any);

    let caption = "";
    let fileName = `Invoice_${invoice.invoiceNumber}.pdf`;

    if (type === "RECEIPT") {
      caption = `Hi ${invoice.patient.firstName},\n\nWe have received your payment of $${invoice.totalAmount}. Attached is your receipt for your records. Thank you!`;
      fileName = `Receipt_${invoice.invoiceNumber}.pdf`;
    } else if (type === "REMINDER") {
      caption = `Hi ${invoice.patient.firstName},\n\nThis is a gentle reminder regarding your outstanding invoice for $${invoice.totalAmount}. Attached is the invoice for your reference.`;
    } else {
      // INVOICE
      caption = `Hi ${invoice.patient.firstName},\n\nAttached is your invoice for $${invoice.totalAmount}. Please review and complete your payment at your earliest convenience.`;
    }

    // Send Document
    await whatsappManager.sendDocument(doctorId, invoice.patient.phone, pdfBuffer, fileName, caption);

    await prisma.auditLog.create({
      data: {
        userId: doctorId,
        userType: "CLINIC",
        action: "WHATSAPP_BILLING_SHARE",
        details: {
          invoiceId: invoice.id,
          type: type,
          patientPhone: invoice.patient.phone
        }
      }
    });

    return NextResponse.json({ success: true, message: `Successfully sent ${type} via WhatsApp` });
  } catch (error: any) {
    console.error("WhatsApp Share Error:", error);
    return NextResponse.json({ error: error.message || "Failed to send WhatsApp message" }, { status: 500 });
  }
}
