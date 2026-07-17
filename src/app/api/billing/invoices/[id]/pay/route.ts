import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionData } from "@/lib/session";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const { doctorId } = await getSessionData();
    const resolvedParams = await Promise.resolve(params);
    const invoiceId = resolvedParams.id;
    
    const body = await req.json();
    const { amount, paymentMethod, referenceId } = body;

    if (!amount || !paymentMethod) {
      return NextResponse.json({ error: "Amount and payment method are required" }, { status: 400 });
    }

    // Verify invoice belongs to doctor
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId, doctorId },
      include: { payments: true }
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

    return NextResponse.json(payment, { status: 201 });
  } catch (error: any) {
    console.error("Error recording payment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
