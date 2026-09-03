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
    if (packageId !== undefined) updateData.packageId = packageId || null;
    if (billingPeriod !== undefined) updateData.billingPeriod = billingPeriod;
    if (subscriptionStatus !== undefined) updateData.subscriptionStatus = subscriptionStatus;
    if (subscriptionExpiry !== undefined) {
      updateData.subscriptionExpiry = subscriptionExpiry ? new Date(subscriptionExpiry) : null;
    }

    // Execute in transaction: update doctor + record history if package changed
    const updatedClinic = await prisma.$transaction(async (tx) => {
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

      // If package changed, write immutable audit log
      if (packageId !== undefined && packageId !== existingDoctor.packageId) {
        await tx.subscriptionHistory.create({
          data: {
            doctorId: id,
            previousPackageId: existingDoctor.packageId ?? null,
            newPackageId: packageId || "",
            changedById: session.user?.id || "admin",
            changedByRole: session.user?.role || "SUPERADMIN",
            reason: reason || "Manual admin package update",
          },
        });
      }

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
