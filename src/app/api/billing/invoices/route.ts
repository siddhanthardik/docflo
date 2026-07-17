import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionData } from "@/lib/session";

export async function GET(req: Request) {
  try {
    const { doctorId } = await getSessionData();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const whereClause: any = { doctorId };
    if (status) {
      whereClause.status = status;
    }

    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      include: {
        patient: {
          select: { firstName: true, lastName: true, phone: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(invoices);
  } catch (error: any) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { doctorId } = await getSessionData();
    const body = await req.json();
    const { patientId, appointmentId, dueDate, discountAmount = 0, notes, items } = body;

    if (!patientId || !items || !items.length) {
      return NextResponse.json({ error: "Patient and at least one item are required" }, { status: 400 });
    }

    // Generate Invoice Number
    const year = new Date().getFullYear();
    const lastInvoice = await prisma.invoice.findFirst({
      where: { doctorId, invoiceNumber: { startsWith: `INV-${year}-` } },
      orderBy: { invoiceNumber: 'desc' },
    });

    let nextNum = 1;
    if (lastInvoice) {
      const parts = lastInvoice.invoiceNumber.split('-');
      if (parts.length === 3) {
        const lastNum = parseInt(parts[2], 10);
        if (!isNaN(lastNum)) {
          nextNum = lastNum + 1;
        }
      }
    }
    const invoiceNumber = `INV-${year}-${nextNum.toString().padStart(4, '0')}`;

    // Calculate totals
    const subtotal = items.reduce((sum: number, item: any) => sum + (item.unitPrice * item.quantity), 0);
    const totalAmount = Math.max(0, subtotal - discountAmount);

    const invoice = await prisma.invoice.create({
      data: {
        doctorId,
        patientId,
        appointmentId,
        invoiceNumber,
        status: "UNPAID",
        dueDate: dueDate ? new Date(dueDate) : null,
        subtotal,
        discountAmount,
        totalAmount,
        notes,
        items: {
          create: items.map((item: any) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.unitPrice * item.quantity,
            serviceTypeId: item.serviceTypeId || null
          }))
        }
      },
      include: {
        items: true,
        patient: { select: { firstName: true, lastName: true, phone: true } }
      }
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error: any) {
    console.error("Error creating invoice:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
