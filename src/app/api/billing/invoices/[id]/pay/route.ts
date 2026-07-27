import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionData } from "@/lib/session";
import { whatsappManager } from "@/lib/whatsapp-manager";
import { generateInvoicePDF } from "@/lib/pdf";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { doctorId } = await getSessionData();
    const { id: invoiceId } = await params;
    
    const body = await req.json();
    const { amount, paymentMethod, referenceId } = body;

    if (!amount || !paymentMethod) {
      return NextResponse.json({ error: "Amount and payment method are required" }, { status: 400 });
    }

    // Verify invoice belongs to doctor
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId, doctorId },
      include: { payments: true, patient: true, doctor: true }
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Record the payment
    const payment = await prisma.patientPayment.create({
      data: {
        invoiceId,
        doctorId,
        amount: parseFloat(amount),
        paymentMethod,
        referenceId: referenceId || null,
        paymentDate: new Date()
      }
    });

    // Calculate total paid so far
    const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0) + parseFloat(amount);
    
    // Update invoice status based on total paid
    let status = invoice.status;
    let paidAt = invoice.paidAt;

    if (totalPaid >= invoice.totalAmount) {
      status = "PAID";
      paidAt = new Date();
    } else if (totalPaid > 0) {
      status = "PARTIALLY_PAID";
    }

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status, paidAt }
    });

    // Automatically send receipt via WhatsApp if WhatsApp is connected & patient has phone & enablePaymentReceipts is true
    try {
      const doctorInfo = await prisma.doctor.findUnique({
        where: { id: doctorId },
        select: { enablePaymentReceipts: true }
      });

      if (whatsappManager.isConnected(doctorId) && doctorInfo?.enablePaymentReceipts !== false && invoice.patient?.phone) {
        const updatedInvoice = await prisma.invoice.findUnique({
          where: { id: invoiceId },
          include: { items: true, doctor: true, patient: true, payments: true }
        });

        if (updatedInvoice) {
          const pdfBuffer = await generateInvoicePDF(updatedInvoice as any);
          const fileName = `Receipt_${updatedInvoice.invoiceNumber}.pdf`;
          const formattedAmount = parseFloat(amount).toLocaleString("en-IN");
          const formattedTotalPaid = totalPaid.toLocaleString("en-IN");
          const caption = `Hi ${updatedInvoice.patient.firstName},\n\nThank you for your payment of ₹${formattedAmount}. Attached is your payment receipt from ${updatedInvoice.doctor.clinicName || "our clinic"}.\n\nTotal Amount Paid: ₹${formattedTotalPaid}\nInvoice Status: ${status === "PAID" ? "Fully Paid ✅" : "Partially Paid ⏳"}\n\nThank you for choosing us! 🌟`;

          await whatsappManager.sendDocument(doctorId, updatedInvoice.patient.phone, pdfBuffer, fileName, caption);

          await prisma.auditLog.create({
            data: {
              userId: doctorId,
              userType: "CLINIC",
              action: "WHATSAPP_RECEIPT_AUTO_SENT",
              details: {
                invoiceId: updatedInvoice.id,
                amount: parseFloat(amount),
                patientPhone: updatedInvoice.patient.phone
              }
            }
          });
        }
      }
    } catch (waError) {
      console.error("Auto WhatsApp Receipt dispatch error:", waError);
      // Non-blocking error: do not fail payment if WhatsApp dispatch fails
    }

    return NextResponse.json(payment, { status: 201 });
  } catch (error: any) {
    console.error("Error recording payment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
