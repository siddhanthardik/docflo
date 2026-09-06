import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionData } from "@/lib/session";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, doctorId, role, isSuperAdmin } = await getSessionData();
    const { id: invoiceId } = await params;

    // 1. Authorization: Only clinic owners or managers are permitted to cancel invoices
    const allowedRoles = ["DOCTOR", "OWNER", "MANAGER", "ADMIN"];
    const isAuthorized = isSuperAdmin || allowedRoles.includes(role?.toUpperCase());
    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Permission Denied: Only clinic owners or managers are authorized to cancel invoices." },
        { status: 403 }
      );
    }

    // 2. Validate cancellation reason
    const body = await req.json().catch(() => ({}));
    const { reason } = body;

    if (!reason || typeof reason !== "string" || reason.trim().length < 3) {
      return NextResponse.json(
        { error: "A clear cancellation reason is mandatory (minimum 3 characters)." },
        { status: 400 }
      );
    }

    // 3. Verify invoice existence and ownership
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId, doctorId },
      include: {
        patient: {
          select: { firstName: true, lastName: true, phone: true }
        }
      }
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (invoice.status === "CANCELLED") {
      return NextResponse.json(
        { error: "This invoice is already cancelled." },
        { status: 400 }
      );
    }

    // 4. Fetch authorizer name for audit trail
    const author = await prisma.doctor.findUnique({
      where: { id: userId },
      select: { name: true }
    });
    const authorizerName = author?.name || (role ? `${role.charAt(0) + role.slice(1).toLowerCase()}` : "Clinic Manager");
    const cancelledDate = new Date();
    const dateStr = cancelledDate.toISOString().split("T")[0];
    const auditStamp = `[CANCELLED on ${dateStr} by ${authorizerName}: ${reason.trim()}]`;
    const updatedNotes = invoice.notes ? `${invoice.notes}\n${auditStamp}` : auditStamp;

    // 5. Update invoice to CANCELLED status
    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: "CANCELLED",
        cancellationReason: reason.trim(),
        cancelledAt: cancelledDate,
        cancelledBy: `${authorizerName} (${role || "OWNER"})`,
        notes: updatedNotes
      },
      include: {
        items: true,
        patient: true,
        doctor: true,
        payments: true
      }
    });

    // 6. Record immutable event in AuditLog
    await prisma.auditLog.create({
      data: {
        userId: doctorId,
        userType: "CLINIC",
        action: "INVOICE_CANCELLED",
        details: {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          amount: invoice.totalAmount,
          patientName: `${invoice.patient.firstName} ${invoice.patient.lastName || ""}`.trim(),
          cancellationReason: reason.trim(),
          cancelledBy: `${authorizerName} (${role})`,
          previousStatus: invoice.status,
          cancelledAt: cancelledDate.toISOString()
        },
        ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1"
      }
    }).catch((err) => console.error("[AuditLog] Failed to record invoice cancellation:", err));

    return NextResponse.json({
      success: true,
      message: "Invoice successfully cancelled and excluded from revenue.",
      invoice: updatedInvoice
    });

  } catch (error: any) {
    console.error("Error cancelling invoice:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
