import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionData } from "@/lib/session";
import { getCurrencySymbol } from "@/lib/currency";

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
    const { patientId, appointmentId, dueDate, notes, items, discountType = "FLAT", discountValue = 0, taxAmount = 0 } = body;

    if (!patientId || !items || !items.length) {
      return NextResponse.json({ error: "Patient and at least one item are required" }, { status: 400 });
    }

    // Fetch Doctor to get base currency
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { currency: true }
    });
    
    // Default to USD if currency is missing
    const currencyCode = doctor?.currency || "USD";
    const currencySymbol = getCurrencySymbol(currencyCode);

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

    // Calculate totals securely on the backend
    const subtotal = items.reduce((sum: number, item: any) => {
      // Validate inputs
      const price = Math.max(0, parseFloat(item.unitPrice) || 0);
      const qty = Math.max(1, parseInt(item.quantity) || 1);
      return sum + (price * qty);
    }, 0);

    // Apply Discount
    let calculatedDiscountAmount = 0;
    const validatedDiscountValue = Math.max(0, parseFloat(discountValue) || 0);

    if (discountType === "PERCENTAGE") {
      // Cap at 100%
      const percentage = Math.min(100, validatedDiscountValue);
      calculatedDiscountAmount = (subtotal * percentage) / 100;
    } else {
      // FLAT discount
      calculatedDiscountAmount = validatedDiscountValue;
    }

    // Discount cannot exceed subtotal
    calculatedDiscountAmount = Math.min(subtotal, calculatedDiscountAmount);

    // Apply Tax (Tax is applied after discount)
    const validatedTaxAmount = Math.max(0, parseFloat(taxAmount) || 0);
    
    // Calculate final total
    const totalAmount = Math.max(0, subtotal - calculatedDiscountAmount + validatedTaxAmount);

    // Rounding to 2 decimal places to prevent floating point anomalies
    const roundToTwo = (num: number) => Math.round(num * 100) / 100;

    const invoice = await prisma.invoice.create({
      data: {
        doctorId,
        patientId,
        appointmentId: appointmentId || null,
        invoiceNumber,
        status: "UNPAID",
        dueDate: dueDate ? new Date(dueDate) : null,
        subtotal: roundToTwo(subtotal),
        discountType,
        discountValue: validatedDiscountValue,
        discountAmount: roundToTwo(calculatedDiscountAmount),
        taxAmount: roundToTwo(validatedTaxAmount),
        totalAmount: roundToTwo(totalAmount),
        currencyCode,
        currencySymbol,
        notes,
        items: {
          create: items.map((item: any) => {
            const price = Math.max(0, parseFloat(item.unitPrice) || 0);
            const qty = Math.max(1, parseInt(item.quantity) || 1);
            return {
              description: item.description,
              quantity: qty,
              unitPrice: price,
              total: price * qty,
              serviceTypeId: item.serviceTypeId || null
            };
          })
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
