import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionData } from "@/lib/session";
import { format } from "date-fns";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const { doctorId } = await getSessionData();
    const resolvedParams = await Promise.resolve(params);
    const invoiceId = resolvedParams.id;

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

    const invoiceDetails = invoice.items.map(item => `- ${item.description}: ₹${item.total}`).join('\n');
    
    // Construct WhatsApp Message
    const message = `Hello ${invoice.patient.firstName},

Here is your invoice summary from ${invoice.doctor.clinicName || invoice.doctor.name}:
*Invoice Number:* ${invoice.invoiceNumber}
*Date:* ${format(invoice.issueDate, 'dd MMM yyyy')}

*Items:*
${invoiceDetails}

*Subtotal:* ₹${invoice.subtotal}
*Discount:* ₹${invoice.discountAmount}
*Total Amount:* ₹${invoice.totalAmount}
*Amount Paid:* ₹${totalPaid}
*Balance Due:* ₹${balanceDue}

You can pay the balance due via UPI or cash at the clinic. Please let us know if you have any questions!

Thank you,
${invoice.doctor.clinicName || invoice.doctor.name}`;

    // Note: Here we would use the Evolution API to send the message in production.
    // We can also create a conversation entry if we haven't already.

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
          patientName: `${invoice.patient.firstName} ${invoice.patient.lastName}`
        }
      });
    }

    await prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        direction: "OUTGOING",
        messageType: "text",
        content: message,
        senderName: "Clinic Staff"
      }
    });

    return NextResponse.json({ success: true, message: "Invoice sent via WhatsApp" });
  } catch (error: any) {
    console.error("Error sending invoice:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
