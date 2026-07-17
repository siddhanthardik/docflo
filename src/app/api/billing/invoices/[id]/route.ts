import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionData } from "@/lib/session";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { doctorId } = await getSessionData();
    const { id: invoiceId } = await params;

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId, doctorId },
      include: {
        items: true,
        patient: true,
        payments: {
          orderBy: { paymentDate: 'desc' }
        }
      }
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json(invoice);
  } catch (error: any) {
    console.error("Error fetching invoice:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { doctorId } = await getSessionData();
    const { id: invoiceId } = await params;

    await prisma.invoice.delete({
      where: { id: invoiceId, doctorId }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting invoice:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
