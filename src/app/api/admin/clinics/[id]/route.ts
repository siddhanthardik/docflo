import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || !hasPermission(session.user?.role || "", "MANAGE_USERS")) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { isSuspended, packageId } = body;

    const updateData: any = {};
    if (isSuspended !== undefined) updateData.isSuspended = isSuspended;
    if (packageId !== undefined) updateData.packageId = packageId;

    const updatedClinic = await prisma.doctor.update({
      where: { id },
      data: updateData,
      include: {
        package: true
      }
    });

    return NextResponse.json(updatedClinic);
  } catch (error: any) {
    console.error("PUT /api/admin/clinics/[id] error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
