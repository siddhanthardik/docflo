import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { revalidatePath, revalidateTag } from "next/cache";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || !hasPermission(session.user?.role || "", "MANAGE_USERS")) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const {
      isSuspended,
      packageId,
      billingPeriod,
      subscriptionStatus,
      subscriptionExpiry,
      reason,
    } = body;

    // Fetch existing doctor to know previous state
    const existingDoctor = await prisma.doctor.findUnique({
      where: { id },
      select: {
        id: true,
        packageId: true,
        billingPeriod: true,
        subscriptionStatus: true,
        subscriptionExpiry: true,
      },
    });

    if (!existingDoctor) {
      return new NextResponse("Doctor not found", { status: 404 });
    }

    const updateData: any = {};
    if (isSuspended !== undefined) updateData.isSuspended = isSuspended;
    if (packageId !== undefined) {
      updateData.packageId = packageId || null;
      if (packageId && subscriptionStatus === undefined && existingDoctor.subscriptionStatus !== "ACTIVE") {
        updateData.subscriptionStatus = "ACTIVE";
      }
    }
    if (billingPeriod !== undefined) updateData.billingPeriod = billingPeriod;
    if (subscriptionStatus !== undefined) updateData.subscriptionStatus = subscriptionStatus;
    if (subscriptionExpiry !== undefined) {
      updateData.subscriptionExpiry = subscriptionExpiry ? new Date(subscriptionExpiry) : null;
    } else if (packageId && existingDoctor.subscriptionExpiry && new Date(existingDoctor.subscriptionExpiry) <= new Date()) {
      // If assigning a package and previous trial expiry was in the past, refresh by 1 year
      updateData.subscriptionExpiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    }

    // Check if any subscription attribute changed or if an audit note was entered
    const isPackageChanging = packageId !== undefined && packageId !== existingDoctor.packageId;
    const isStatusChanging = subscriptionStatus !== undefined && subscriptionStatus !== existingDoctor.subscriptionStatus;
    const isBillingPeriodChanging = billingPeriod !== undefined && billingPeriod !== existingDoctor.billingPeriod;
    const isExpiryChanging = updateData.subscriptionExpiry !== undefined && (
      (updateData.subscriptionExpiry === null && existingDoctor.subscriptionExpiry !== null) ||
      (updateData.subscriptionExpiry !== null && existingDoctor.subscriptionExpiry === null) ||
      (updateData.subscriptionExpiry && existingDoctor.subscriptionExpiry && 
       new Date(updateData.subscriptionExpiry).getTime() !== new Date(existingDoctor.subscriptionExpiry).getTime())
    );
    const hasAuditNote = Boolean(reason && reason.trim());

    const shouldRecordAudit = isPackageChanging || isStatusChanging || isBillingPeriodChanging || isExpiryChanging || hasAuditNote;

    let auditReason = reason?.trim();
    if (!auditReason) {
      const parts: string[] = [];
      if (isPackageChanging) parts.push("Package modified");
      if (isStatusChanging) parts.push(`Status set to ${subscriptionStatus}`);
      if (isBillingPeriodChanging) parts.push(`Billing period set to ${billingPeriod}`);
      if (isExpiryChanging) {
        parts.push(updateData.subscriptionExpiry ? `Expiry set to ${new Date(updateData.subscriptionExpiry).toLocaleDateString("en-IN")}` : "Expiry removed");
      }
      auditReason = parts.join(", ") || "Manual admin subscription update";
    }

    const changedByRole = session.user?.name 
      ? `${session.user.name} (${session.user.role || "ADMIN"})` 
      : (session.user?.role || "SUPERADMIN");

    const effectivePackageId = (packageId !== undefined ? packageId : existingDoctor.packageId) || "";

    // Execute in transaction: record audit history FIRST, then update doctor so included relation contains the new log
    const updatedClinic = await prisma.$transaction(async (tx) => {
      if (shouldRecordAudit) {
        await tx.subscriptionHistory.create({
          data: {
            doctorId: id,
            previousPackageId: existingDoctor.packageId ?? null,
            newPackageId: effectivePackageId,
            changedById: session.user?.id || "admin",
            changedByRole,
            reason: auditReason,
          },
        });
      }

      const updated = await tx.doctor.update({
        where: { id },
        data: updateData,
        include: {
          package: true,
          subscriptionHistories: {
            orderBy: { createdAt: "desc" },
          },
        },
      });

      return updated;
    });

    // Revalidate paths & tags to clear Next.js cache completely
    try {
      revalidatePath("/admin/clinics");
      revalidatePath(`/admin/clinics/${id}`);
      revalidatePath("/admin/subscriptions");
      revalidateTag(`doctor-package-${id}`, "default");
    } catch (revalErr) {
      console.warn("Revalidation warning:", revalErr);
    }

    return NextResponse.json(updatedClinic);
  } catch (error: any) {
    console.error("PUT /api/admin/clinics/[id] error:", error);
    return new NextResponse(error?.message || "Internal Server Error", { status: 500 });
  }
}
