import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionData } from "@/lib/session";
import { format } from "date-fns";
import { entitlementGuard } from "@/lib/withEntitlements";
import { whatsappManager } from "@/lib/whatsapp-manager";
import { generateInvoicePDF } from "@/lib/pdf";
import { getCurrencySymbol } from "@/lib/currency";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { doctorId } = await getSessionData();
    const { id: invoiceId } = await params;

    const block = await entitlementGuard(doctorId, req, { module: "WHATSAPP_CRM" });
    if (block) return block;

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId, doctorId },
      include: {
        patient: true,
        doctor: true,
        items: true,
        payments: true
      }
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
    const balanceDue = Math.max(0, invoice.totalAmount - totalPaid);

    // Generate PDF
    const pdfBuffer = await generateInvoicePDF(invoice as any);
    const fileName = `Invoice_${invoice.invoiceNumber}.pdf`;
    
    // Construct Real Patient Name
    let patientGreetingName = "";
    const fn = (invoice.patient.firstName || "").trim();
    const ln = (invoice.patient.lastName || "").trim();
    if (fn && fn.toLowerCase() !== "patient") {
      patientGreetingName = (ln && !ln.startsWith("+")) ? `${fn} ${ln}` : fn;
    } else if (ln && !ln.startsWith("+")) {
      patientGreetingName = ln;
    } else {
      // Check if conversation has a recorded name
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

    // Construct WhatsApp Caption
    const sym = invoice.currencySymbol || getCurrencySymbol(invoice.currencyCode);
    let caption = `Hi ${patientGreetingName},\n\nAttached is your invoice (#${invoice.invoiceNumber}) from ${invoice.doctor.clinicName || invoice.doctor.name} for ${sym}${invoice.totalAmount}.\n\n`;

    if (balanceDue > 0) {
      caption += `You have a remaining balance of ${sym}${balanceDue}. You can pay this securely via UPI or cash at the clinic.\n\n`;
    } else {
      caption += `This invoice has been paid in full.\n\n`;
    }
    
    caption += `Please let us know if you have any questions. Thank you! 📄`;

    // Send Document via Baileys
    const sendResult = await whatsappManager.sendDocument(doctorId, invoice.patient.phone, pdfBuffer, fileName, caption);
    const sentDate = sendResult?.sentDate || new Date();

    // Let's create an outgoing ChatMessage
    let conversation = await prisma.conversation.findUnique({
      where: { doctorId_patientPhone: { doctorId, patientPhone: invoice.patient.phone } }
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          doctorId,
          patientId: invoice.patient.id,
          patientPhone: invoice.patient.phone,
          patientName: `${invoice.patient.firstName} ${invoice.patient.lastName}`,
          lastMessageAt: sentDate,
          createdAt: sentDate,
        }
      });
    } else {
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: sentDate },
      });
    }

    await prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        direction: "OUTGOING",
        messageType: "document",
        content: caption,
        senderName: "Clinic Staff",
        createdAt: sentDate,
      }
    });

    return NextResponse.json({ success: true, message: "Invoice sent via WhatsApp" });
  } catch (error: any) {
    console.error("Error sending invoice:", error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}
