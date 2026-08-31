import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionData } from "@/lib/session";
import { entitlementGuard } from "@/lib/withEntitlements";
import { whatsappManager } from "@/lib/whatsapp-manager";
import { generateInvoicePDF } from "@/lib/pdf";
import { getCurrencySymbol } from "@/lib/currency";

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

    // Construct Real Patient Name
    let patientGreetingName = "";
    const fn = (invoice.patient.firstName || "").trim();
    const ln = (invoice.patient.lastName || "").trim();
    if (fn && fn.toLowerCase() !== "patient") {
      patientGreetingName = (ln && !ln.startsWith("+")) ? `${fn} ${ln}` : fn;
    } else if (ln && !ln.startsWith("+")) {
      patientGreetingName = ln;
    } else {
      const conv = await prisma.conversation.findUnique({
        where: { doctorId_patientPhone: { doctorId, patientPhone: invoice.patient.phone } },
        select: { patientName: true }
      });
      if (conv?.patientName && conv.patientName.toLowerCase() !== "patient" && !conv.patientName.startsWith("+")) {
        patientGreetingName = conv.patientName;
      }
    }

    if (!patientGreetingName) {
      patientGreetingName = "Valued Patient";
    }

    const sym = invoice.currencySymbol || getCurrencySymbol(invoice.currencyCode);
    let caption = "";
    let fileName = `Invoice_${invoice.invoiceNumber}.pdf`;

    if (type === "RECEIPT") {
      caption = `Hi ${patientGreetingName},\n\nWe have received your payment of ${sym}${invoice.totalAmount}. Attached is your receipt for your records. Thank you!`;
      fileName = `Receipt_${invoice.invoiceNumber}.pdf`;
    } else if (type === "REMINDER") {
      caption = `Hi ${patientGreetingName},\n\nThis is a gentle reminder regarding your outstanding invoice for ${sym}${invoice.totalAmount}. Attached is the invoice for your reference.`;
    } else {
      // INVOICE
      caption = `Hi ${patientGreetingName},\n\nAttached is your invoice (#${invoice.invoiceNumber}) for ${sym}${invoice.totalAmount}. Please review and complete your payment at your earliest convenience.`;
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
