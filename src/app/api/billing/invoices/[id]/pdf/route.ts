import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionData } from "@/lib/session";
import { generateInvoicePDF } from "@/lib/pdf";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { doctorId } = await getSessionData();
    const { id: invoiceId } = await params;

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId, doctorId },
      include: {
        items: true,
        patient: true,
        doctor: true,
        payments: {
          orderBy: { paymentDate: 'desc' }
        }
      }
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Generate PDF
    const pdfBuffer = await generateInvoicePDF(invoice as any);

    // Safe filename
    const safePatientName = invoice.patient.firstName.replace(/[^a-z0-9]/gi, '_');
    const invoiceDate = invoice.issueDate.toISOString().split('T')[0];
    const fileName = `${safePatientName}_${invoiceDate}.pdf`;

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });

  } catch (error: any) {
    console.error("Error generating invoice PDF:", error);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
